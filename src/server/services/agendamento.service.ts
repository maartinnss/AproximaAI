import "server-only";

import { db } from "../db/client";
import { agendamentoRepo } from "../repositories/agendamento.repo";
import { profissionalRepo } from "../repositories/profissional.repo";
import { estabelecimentoRepo } from "../repositories/estabelecimento.repo";
import { notificacaoService } from "./notificacao.service";
import { HttpError } from "../lib/api-helpers";
import { logger } from "../lib/logger";
import {
  checarHorarioFuncionamento,
  isValidLocalTime,
  zonedTimeToUtc,
} from "../lib/datetime";
import type {
  AtualizarAgendamentoInput,
  CriarAgendamentoInput,
} from "../validators/agendamento.schema";
import {
  toAgendamentoView,
  type AgendamentoFull,
  type AgendamentoView,
  type EstabelecimentoView,
} from "../repositories/_view-models";

const INCLUDE = {
  cliente: { select: { id: true, nome: true, telefoneE164: true, email: true } },
  servico: { select: { id: true, nome: true, precoCentavos: true, duracaoMinutos: true } },
  profissional: { select: { id: true, nome: true } },
} as const;

/**
 * Combina 'YYYY-MM-DD' + 'HH:mm' do gestor em UTC, respeitando o IANA
 * timezone do estabelecimento (inclui DST automaticamente).
 */
function combinarDataHora(data: string, hora: string, timezone: string): Date {
  const [y, m, d] = data.split("-").map(Number);
  const [h, mi] = hora.split(":").map(Number);
  const parts = { year: y!, month: m!, day: d!, hour: h!, minute: mi!, second: 0 };
  if (!isValidLocalTime(parts, timezone)) {
    throw new HttpError(
      400,
      "hora_inexistente",
      `O horário ${hora} não existe em ${data} neste fuso (transição de horário de verão)`,
    );
  }
  return zonedTimeToUtc(parts, timezone);
}

function fmtDataHora(view: AgendamentoView, locale: string): string {
  const d = new Date(view.data + "T12:00:00").toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
  });
  return `${d} às ${view.hora}`;
}

async function notifSafe(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error({ err }, "[agendamento] notif falhou");
  }
}

/**
 * Busca raw `Servico` (com `precoCentavos`) — evita round-trip
 * `centavos → reais → centavos` que o view-model faria.
 */
async function findServicoRaw(servicoId: string, estabelecimentoId: string) {
  return db.servico.findFirst({
    where: { id: servicoId, estabelecimentoId, deletedAt: null },
    select: {
      id: true,
      precoCentavos: true,
      duracaoMinutos: true,
      ativo: true,
      nome: true,
    },
  });
}

async function validarVinculoProfissionalServico(
  profissionalId: string,
  servicoId: string,
): Promise<void> {
  const vinculo = await db.profissionalServico.findUnique({
    where: { profissionalId_servicoId: { profissionalId, servicoId } },
  });
  if (!vinculo) {
    throw new HttpError(
      409,
      "profissional_nao_oferece_servico",
      "Esse profissional não atende esse serviço",
    );
  }
}

function validarHorario(
  inicio: Date,
  fim: Date,
  est: EstabelecimentoView,
): void {
  if (inicio.getTime() < Date.now()) {
    throw new HttpError(400, "data_passada", "Não é possível agendar para data/hora no passado");
  }
  const result = checarHorarioFuncionamento(
    inicio,
    fim,
    est.horarioFuncionamento,
    est.timezone,
  );
  if (result.ok) return;
  if (result.reason === "fora_dos_dias") {
    throw new HttpError(400, "fora_dos_dias", "Estabelecimento não opera nesse dia da semana");
  }
  if (result.reason === "antes_abertura") {
    throw new HttpError(400, "antes_abertura", "Horário antes da abertura do estabelecimento");
  }
  throw new HttpError(400, "apos_fechamento", "Horário ultrapassa o fechamento do estabelecimento");
}

export const agendamentoService = {
  async criar(
    estabelecimentoId: string,
    input: CriarAgendamentoInput,
    origem: "gestor" | "whatsapp" | "web" | "api" = "gestor",
  ): Promise<AgendamentoView> {
    const est = await estabelecimentoRepo.requireById(estabelecimentoId);

    const servico = await findServicoRaw(input.servicoId, estabelecimentoId);
    if (!servico) throw new HttpError(404, "servico_not_found", "Serviço não encontrado");
    if (!servico.ativo) throw new HttpError(409, "servico_inativo", "Serviço inativo");

    const profissional = await profissionalRepo.findById(
      input.profissionalId,
      estabelecimentoId,
    );
    if (!profissional) {
      throw new HttpError(404, "profissional_not_found", "Profissional não encontrado");
    }
    if (!profissional.ativo) {
      throw new HttpError(409, "profissional_inativo", "Profissional inativo");
    }

    await validarVinculoProfissionalServico(input.profissionalId, input.servicoId);

    const inicio = combinarDataHora(input.data, input.hora, est.timezone);
    const fim = new Date(inicio.getTime() + servico.duracaoMinutos * 60_000);

    validarHorario(inicio, fim, est);

    // Upsert atômico — evita race condition em retries concorrentes do Meta.
    const cliente = await db.cliente.upsert({
      where: { telefoneE164: input.clienteTelefone },
      create: {
        nome: input.clienteNome,
        telefoneE164: input.clienteTelefone,
        email: input.clienteEmail ?? undefined,
        origem: "manual",
      },
      update: {},
      select: { id: true },
    });

    const created = await db.agendamento.create({
      data: {
        estabelecimentoId,
        clienteId: cliente.id,
        servicoId: input.servicoId,
        profissionalId: input.profissionalId,
        inicioEm: inicio,
        fimEm: fim,
        status: "pendente",
        origem,
        precoCentavosSnapshot: servico.precoCentavos,
        duracaoMinutosSnapshot: servico.duracaoMinutos,
        observacoes: input.observacoes ?? null,
      },
      include: INCLUDE,
    });

    const view = toAgendamentoView(created as AgendamentoFull, est.timezone);
    await notifSafe(() =>
      notificacaoService.criar({
        estabelecimentoId,
        tipo: "info",
        titulo: "Novo agendamento",
        mensagem: `${view.clienteNome} agendou ${view.servico.nome} para ${fmtDataHora(view, est.locale)}.`,
        icone: "CalendarPlus",
        metadata: { agendamentoId: view.id },
      }),
    );
    return view;
  },

  async atualizar(
    id: string,
    estabelecimentoId: string,
    input: AtualizarAgendamentoInput,
  ): Promise<AgendamentoView> {
    const atual = await db.agendamento.findFirst({
      where: { id, estabelecimentoId },
      include: INCLUDE,
    });
    if (!atual) throw new HttpError(404, "not_found", "Agendamento não encontrado");

    const est = await estabelecimentoRepo.requireById(estabelecimentoId);

    const data: Record<string, unknown> = {};

    const profissionalIdFinal = input.profissionalId ?? atual.profissionalId;
    const servicoIdFinal = input.servicoId ?? atual.servicoId;

    if (input.profissionalId && input.profissionalId !== atual.profissionalId) {
      const prof = await profissionalRepo.findById(input.profissionalId, estabelecimentoId);
      if (!prof) throw new HttpError(404, "profissional_not_found", "Profissional não encontrado");
      if (!prof.ativo) throw new HttpError(409, "profissional_inativo", "Profissional inativo");
      data.profissionalId = input.profissionalId;
    }

    let duracaoMin: number;
    if (input.servicoId && input.servicoId !== atual.servicoId) {
      const serv = await findServicoRaw(input.servicoId, estabelecimentoId);
      if (!serv) throw new HttpError(404, "servico_not_found", "Serviço não encontrado");
      data.servicoId = input.servicoId;
      data.precoCentavosSnapshot = serv.precoCentavos;
      data.duracaoMinutosSnapshot = serv.duracaoMinutos;
      duracaoMin = serv.duracaoMinutos;
    } else {
      // Busca duração atual do serviço — não usa snapshot que pode estar desatualizado.
      const servAtual = await findServicoRaw(atual.servicoId, estabelecimentoId);
      duracaoMin = servAtual?.duracaoMinutos ?? atual.duracaoMinutosSnapshot;
    }

    // Se profissional ou serviço mudaram, revalidar vínculo N:N.
    if (input.profissionalId || input.servicoId) {
      await validarVinculoProfissionalServico(profissionalIdFinal, servicoIdFinal);
    }

    if (input.data || input.hora) {
      const dataStr =
        input.data ??
        new Intl.DateTimeFormat("en-CA", {
          timeZone: est.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(atual.inicioEm);
      const horaStr = input.hora ?? formatHora(atual.inicioEm, est.timezone);
      const inicio = combinarDataHora(dataStr, horaStr, est.timezone);
      const fim = new Date(inicio.getTime() + duracaoMin * 60_000);
      validarHorario(inicio, fim, est);
      data.inicioEm = inicio;
      data.fimEm = fim;
    }

    if (input.status) data.status = input.status;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes;

    if (input.status === "cancelado" && atual.status !== "cancelado") {
      data.canceladoPor = "gestor";
      data.canceladoEm = new Date();
      // Schema garante que motivo está presente quando status=cancelado.
      data.motivoCancelamento = input.motivo;
    }

    if (Object.keys(data).length === 0) {
      return toAgendamentoView(atual as AgendamentoFull, est.timezone);
    }

    const updated = await db.agendamento.update({
      where: { id, estabelecimentoId },
      data,
      include: INCLUDE,
    });

    const view = toAgendamentoView(updated as AgendamentoFull, est.timezone);

    if (input.status && input.status !== atual.status) {
      if (input.status === "concluido") {
        await notifSafe(() =>
          notificacaoService.criar({
            estabelecimentoId,
            tipo: "sucesso",
            titulo: "Atendimento concluído",
            mensagem: `${view.clienteNome} — ${view.servico.nome} (${fmtDataHora(view, est.locale)}).`,
            icone: "Trophy",
            metadata: { agendamentoId: view.id },
          }),
        );
      } else if (input.status === "cancelado") {
        await notifSafe(() =>
          notificacaoService.criar({
            estabelecimentoId,
            tipo: "alerta",
            titulo: "Cancelamento",
            mensagem: `${view.clienteNome} cancelou ${view.servico.nome} de ${fmtDataHora(view, est.locale)}.`,
            icone: "CalendarX",
            metadata: { agendamentoId: view.id },
          }),
        );
      }
    }

    return view;
  },

  async cancelar(
    id: string,
    estabelecimentoId: string,
    motivo: string,
    canceladoPor: "cliente" | "gestor" | "sistema" = "gestor",
  ): Promise<void> {
    const atual = await db.agendamento.findFirst({
      where: { id, estabelecimentoId },
      select: {
        id: true,
        status: true,
        inicioEm: true,
        cliente: { select: { nome: true } },
        servico: { select: { nome: true } },
      },
    });
    if (!atual) throw new HttpError(404, "not_found", "Agendamento não encontrado");
    if (atual.status === "cancelado") {
      throw new HttpError(409, "ja_cancelado", "Agendamento já está cancelado");
    }

    // Janela de cancelamento aplica a clientes/sistema; gestor opera fora dela.
    let est = canceladoPor !== "gestor"
      ? await estabelecimentoRepo.requireById(estabelecimentoId)
      : null;

    if (canceladoPor !== "gestor") {
      const horasRestantes =
        (atual.inicioEm.getTime() - Date.now()) / (60 * 60 * 1000);
      if (horasRestantes < est!.janelaCancelamentoHoras) {
        throw new HttpError(
          409,
          "fora_da_janela",
          `Cancelamento exige antecedência mínima de ${est!.janelaCancelamentoHoras}h`,
        );
      }
    }

    // Atualização atômica: só cancela se ainda não estiver cancelado.
    // Evita duplo cancelamento em requests concorrentes (TOCTOU).
    const updated = await db.agendamento.updateMany({
      where: { id, estabelecimentoId, status: { not: "cancelado" } },
      data: {
        status: "cancelado",
        motivoCancelamento: motivo,
        canceladoPor,
        canceladoEm: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new HttpError(409, "ja_cancelado", "Agendamento já está cancelado");
    }

    if (!est) est = await estabelecimentoRepo.requireById(estabelecimentoId);
    const clienteNome = atual.cliente.nome ?? "Cliente";
    const servicoNome = atual.servico.nome;
    const dataHoraStr = fmtDataHoraRaw(atual.inicioEm, est.locale, est.timezone);
    await notifSafe(() =>
      notificacaoService.criar({
        estabelecimentoId,
        tipo: "alerta",
        titulo: "Cancelamento",
        mensagem: `${clienteNome} — ${servicoNome} (${dataHoraStr}). Motivo: ${motivo}`,
        icone: "CalendarX",
        metadata: { agendamentoId: id },
      }),
    );
  },

  async excluir(id: string, estabelecimentoId: string): Promise<void> {
    const atual = await db.agendamento.findFirst({
      where: { id, estabelecimentoId },
      select: { id: true, status: true },
    });
    if (!atual) throw new HttpError(404, "not_found", "Agendamento não encontrado");
    if (atual.status === "pendente" || atual.status === "confirmado") {
      throw new HttpError(
        409,
        "agendamento_ativo",
        "Cancele o agendamento antes de excluir",
      );
    }
    await agendamentoRepo.hardDelete(id, estabelecimentoId);
  },
};

function formatHora(at: Date, timezone: string): string {
  // Intl em alguns runtimes retorna "24" para meia-noite; normaliza para "00".
  const raw = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
  return raw.startsWith("24:") ? `00:${raw.slice(3)}` : raw;
}

function fmtDataHoraRaw(at: Date, locale: string, timezone: string): string {
  const d = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
  }).format(at);
  return `${d} às ${formatHora(at, timezone)}`;
}
