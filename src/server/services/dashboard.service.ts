import "server-only";

import { db } from "../db/client";
import { agendamentoRepo } from "../repositories/agendamento.repo";
import {
  iniciais,
  type AgendamentoView,
} from "../repositories/_view-models";
import {
  addDaysZoned,
  startOfDayZoned,
  startOfMonthZoned,
  startOfNextMonthZoned,
  startOfPreviousMonthZoned,
  zonedDateString,
} from "../lib/datetime";

const PALETA = ["#27272a", "#00cec9", "#00b894", "#fdcb6e", "#3f3f46", "#6366F1"];

const DOW_PT_BY_INDEX = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type ResumoDashboard = {
  atendimentos: string;
  atendimentosVariacao: string;
  receita: string;
  receitaVariacao: string;
  ticketMedio: string;
  destaque: { nome: string; valor: string } | null;
};

export type DadosGrafico = { nome: string; atendimentos: number; receita: number };
export type DadosServicosGrafico = { nome: string; valor: number; cor: string };

function variacaoTexto(atual: number, anterior: number, sufixo = "vs mês anterior"): string {
  if (anterior === 0) return atual > 0 ? `+100% ${sufixo}` : `0% ${sufixo}`;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  const sinal = pct >= 0 ? "+" : "";
  return `${sinal}${pct}% ${sufixo}`;
}

function fmtBRL(centavos: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

export const dashboardService = {
  async getResumo(
    estabelecimentoId: string,
    timezone: string,
    locale: string,
    currency: string,
  ): Promise<ResumoDashboard> {
    const agora = new Date();
    const ini = startOfMonthZoned(agora, timezone);
    const fim = startOfNextMonthZoned(agora, timezone);
    const iniAnt = startOfPreviousMonthZoned(agora, timezone);

    const [atend, receita, atendAnt, receitaAnt, destaque] = await Promise.all([
      agendamentoRepo.countAtivosNoMes(estabelecimentoId, ini, fim),
      agendamentoRepo.receitaConcluidaNoPeriodo(estabelecimentoId, ini, fim),
      agendamentoRepo.countAtivosNoMes(estabelecimentoId, iniAnt, ini),
      agendamentoRepo.receitaConcluidaNoPeriodo(estabelecimentoId, iniAnt, ini),
      db.agendamento.groupBy({
        by: ["profissionalId"],
        where: {
          estabelecimentoId,
          inicioEm: { gte: ini, lt: fim },
          status: { in: ["confirmado", "concluido"] },
        },
        _count: true,
        orderBy: { _count: { profissionalId: "desc" } },
        take: 1,
      }),
    ]);

    let destaqueResult: { nome: string; valor: string } | null = null;
    if (destaque.length) {
      const prof = await db.profissional.findUnique({
        where: { id: destaque[0].profissionalId },
        select: { nome: true },
      });
      if (prof) {
        destaqueResult = {
          nome: prof.nome,
          valor: `${destaque[0]._count} atendimentos`,
        };
      }
    }

    const ticketMedioCentavos =
      receita.total > 0 ? Math.round(receita.totalCentavos / receita.total) : 0;

    return {
      atendimentos: String(atend),
      atendimentosVariacao: variacaoTexto(atend, atendAnt),
      receita: fmtBRL(receita.totalCentavos, currency, locale),
      receitaVariacao: variacaoTexto(receita.totalCentavos, receitaAnt.totalCentavos),
      ticketMedio: fmtBRL(ticketMedioCentavos, currency, locale),
      destaque: destaqueResult,
    };
  },

  async getDadosGraficoSemanal(
    estabelecimentoId: string,
    timezone: string,
  ): Promise<DadosGrafico[]> {
    const agora = new Date();
    // Janela local: últimos 7 dias completos (incluindo hoje no timezone alvo).
    const fim = addDaysZoned(startOfDayZoned(agora, timezone), 1, timezone);
    const inicio = addDaysZoned(fim, -7, timezone);

    const ags = await db.agendamento.findMany({
      where: {
        estabelecimentoId,
        inicioEm: { gte: inicio, lt: fim },
        status: { in: ["confirmado", "concluido"] },
      },
      select: { inicioEm: true, status: true, precoCentavosSnapshot: true },
    });

    // 1 bucket por dia local, na ordem cronológica.
    const days: Array<{
      key: string;
      dowIdx: number;
      atendimentos: number;
      receitaCentavos: number;
    }> = [];
    for (let i = 0; i < 7; i++) {
      const d = addDaysZoned(inicio, i, timezone);
      const key = zonedDateString(d, timezone);
      days.push({
        key,
        dowIdx: localDowIndex(d, timezone),
        atendimentos: 0,
        receitaCentavos: 0,
      });
    }

    const byKey = new Map(days.map((b) => [b.key, b]));
    for (const a of ags) {
      const localKey = zonedDateString(a.inicioEm, timezone);
      const bucket = byKey.get(localKey);
      if (!bucket) continue;
      bucket.atendimentos += 1;
      if (a.status === "concluido") {
        bucket.receitaCentavos += a.precoCentavosSnapshot;
      }
    }

    return days.map((b) => ({
      nome: DOW_PT_BY_INDEX[b.dowIdx] ?? b.key.slice(5),
      atendimentos: b.atendimentos,
      receita: Math.floor(b.receitaCentavos / 100),
    }));
  },

  async getReceitaPorProfissional(
    estabelecimentoId: string,
    timezone: string,
  ): Promise<DadosGrafico[]> {
    const agora = new Date();
    const ini = addDaysZoned(startOfDayZoned(agora, timezone), -30, timezone);

    const grupos = await db.agendamento.groupBy({
      by: ["profissionalId"],
      where: {
        estabelecimentoId,
        inicioEm: { gte: ini },
        status: { in: ["confirmado", "concluido"] },
      },
      _count: true,
      _sum: { precoCentavosSnapshot: true },
    });

    if (!grupos.length) return [];

    const profIds = grupos.map((g) => g.profissionalId);
    const profs = await db.profissional.findMany({
      where: { id: { in: profIds } },
      select: { id: true, nome: true },
    });
    const nomeById = new Map(profs.map((p) => [p.id, p.nome]));

    return grupos
      .map((g) => {
        const nome = nomeById.get(g.profissionalId) ?? "—";
        const partes = nome.split(" ");
        const apelido =
          partes.length >= 2 ? `${partes[0]} ${partes[1][0] ?? ""}.` : nome;
        return {
          nome: apelido,
          atendimentos: g._count,
          receita: Math.floor((g._sum.precoCentavosSnapshot ?? 0) / 100),
        };
      })
      .sort((a, b) => b.receita - a.receita);
  },

  async getDistribuicaoServicos(
    estabelecimentoId: string,
    timezone: string,
  ): Promise<DadosServicosGrafico[]> {
    const agora = new Date();
    const ini = addDaysZoned(startOfDayZoned(agora, timezone), -30, timezone);

    const grupos = await db.agendamento.groupBy({
      by: ["servicoId"],
      where: {
        estabelecimentoId,
        inicioEm: { gte: ini },
        status: { in: ["confirmado", "concluido"] },
      },
      _count: true,
    });

    if (!grupos.length) return [];

    const servIds = grupos.map((g) => g.servicoId);
    const servs = await db.servico.findMany({
      where: { id: { in: servIds } },
      select: { id: true, nome: true },
    });
    const nomeById = new Map(servs.map((s) => [s.id, s.nome]));

    const total = grupos.reduce((acc, g) => acc + g._count, 0);
    return grupos
      .map((g, i) => ({
        nome: nomeById.get(g.servicoId) ?? "—",
        valor: total > 0 ? Math.round((g._count / total) * 100) : 0,
        cor: PALETA[i % PALETA.length],
      }))
      .sort((a, b) => b.valor - a.valor);
  },

  async getUltimosAgendamentos(
    estabelecimentoId: string,
    timezone: string,
    limit = 5,
  ): Promise<AgendamentoView[]> {
    return agendamentoRepo.listUltimos(estabelecimentoId, timezone, limit);
  },
};

export { iniciais };

/**
 * Índice (0-6) do dia da semana no timezone alvo.
 * Usa zonedDateString → constrói noon UTC do dia local → getUTCDay.
 */
function localDowIndex(at: Date, timezone: string): number {
  const ymd = zonedDateString(at, timezone);
  return new Date(`${ymd}T12:00:00Z`).getUTCDay();
}
