import "server-only";

import OpenAI from "openai";

import { db } from "@/server/db/client";
import { env, isProductionRuntime } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";
import { zonedTimeToUtc } from "@/server/lib/datetime";
import { waSessionRepo } from "@/server/repositories/wa-session.repo";
import { agendamentoService } from "@/server/services/agendamento.service";

type AgenteContext = {
  estabelecimentoId: string;
  estabelecimentoNome: string;
  estabelecimentoPersona: string | null;
  timezone: string;
  locale: string;
  horarioFuncionamento: { abertura: string; fechamento: string; diasSemana: number[] };
  clienteId: string;
  clienteTelefoneE164: string;
  sessionId: string;
};

type AgenteResposta = {
  texto: string;
  tokensUsados: number;
  mensagensAtualizadas: Array<{ role: "user" | "assistant"; content: string }>;
};

type HistoricoMensagem = { role: "user" | "assistant"; content: string };

const DIAS_SEMANA_PT = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function diasSemanaLabel(dias: number[]): string {
  return dias.map((d) => DIAS_SEMANA_PT[d] ?? d).join(", ");
}

function sanitizarPersona(persona: string): string {
  const truncated = persona.slice(0, 500);
  if (/ignore\s+(all\s+|previous\s+|above\s+)?instructions/i.test(truncated) ||
      /you are now/i.test(truncated) ||
      /forget\s+(everything|all)/i.test(truncated)) {
    logger.warn({ persona: truncated }, "[agente] possível prompt injection em aiPersona detectado");
  }
  return truncated;
}

function buildSystemPrompt(ctx: AgenteContext): string {
  const persona = ctx.estabelecimentoPersona
    ? sanitizarPersona(ctx.estabelecimentoPersona)
    : `um assistente virtual do ${ctx.estabelecimentoNome}`;
  return `Você é ${persona}.

Você ajuda clientes a agendar, cancelar e consultar serviços. Responda sempre em português brasileiro.
Seja cordial, objetivo e profissional. Nunca invente horários ou serviços — use as ferramentas disponíveis.

Estabelecimento: ${ctx.estabelecimentoNome}
Horário de funcionamento: ${ctx.horarioFuncionamento.abertura}–${ctx.horarioFuncionamento.fechamento} | Dias: ${diasSemanaLabel(ctx.horarioFuncionamento.diasSemana)}

Para criar um agendamento, você DEVE obter: serviço, profissional, data e hora.
Confirme os detalhes com o cliente antes de criar.`;
}

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "listar_servicos",
      description: "Lista todos os serviços disponíveis no estabelecimento.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_profissionais",
      description: "Lista os profissionais ativos. Filtra por serviço se servicoId informado.",
      parameters: {
        type: "object",
        properties: {
          servicoId: {
            type: "string",
            description: "UUID do serviço para filtrar profissionais que o atendem (opcional).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verificar_disponibilidade",
      description: "Retorna horários disponíveis para um profissional em uma data.",
      parameters: {
        type: "object",
        properties: {
          profissionalId: { type: "string", description: "UUID do profissional." },
          servicoId: { type: "string", description: "UUID do serviço." },
          data: { type: "string", description: "Data no formato YYYY-MM-DD." },
        },
        required: ["profissionalId", "servicoId", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_agendamento",
      description: "Cria um agendamento após confirmar os detalhes com o cliente.",
      parameters: {
        type: "object",
        properties: {
          profissionalId: { type: "string", description: "UUID do profissional." },
          servicoId: { type: "string", description: "UUID do serviço." },
          data: { type: "string", description: "Data no formato YYYY-MM-DD." },
          hora: { type: "string", description: "Hora no formato HH:mm." },
          observacoes: { type: "string", description: "Observações opcionais." },
        },
        required: ["profissionalId", "servicoId", "data", "hora"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelar_agendamento",
      description: "Cancela um agendamento do cliente.",
      parameters: {
        type: "object",
        properties: {
          agendamentoId: { type: "string", description: "UUID do agendamento a cancelar." },
          motivo: { type: "string", description: "Motivo do cancelamento." },
        },
        required: ["agendamentoId", "motivo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_meus_agendamentos",
      description: "Lista os próximos agendamentos do cliente neste estabelecimento.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function executarFerramenta(
  nome: string,
  args: Record<string, unknown>,
  ctx: AgenteContext,
): Promise<unknown> {
  if (nome === "listar_servicos") {
    const servicos = await db.servico.findMany({
      where: { estabelecimentoId: ctx.estabelecimentoId, ativo: true, deletedAt: null },
      select: { id: true, nome: true, descricao: true, precoCentavos: true, duracaoMinutos: true },
    });
    return servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      preco: `R$ ${(s.precoCentavos / 100).toFixed(2)}`,
      duracao: `${s.duracaoMinutos} min`,
    }));
  }

  if (nome === "listar_profissionais") {
    const servicoId = typeof args.servicoId === "string" ? args.servicoId : undefined;
    if (servicoId) {
      const vinculos = await db.profissionalServico.findMany({
        where: {
          servicoId,
          profissional: { estabelecimentoId: ctx.estabelecimentoId, ativo: true, deletedAt: null },
        },
        select: { profissional: { select: { id: true, nome: true, especialidade: true } } },
        take: 50,
      });
      return vinculos.map((v) => v.profissional);
    }
    return db.profissional.findMany({
      where: { estabelecimentoId: ctx.estabelecimentoId, ativo: true, deletedAt: null },
      select: { id: true, nome: true, especialidade: true },
      take: 50,
    });
  }

  if (nome === "verificar_disponibilidade") {
    const profissionalId = String(args.profissionalId);
    const servicoId = String(args.servicoId);
    const dataStr = String(args.data);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      return { erro: "Data inválida. Use o formato YYYY-MM-DD." };
    }

    const profissional = await db.profissional.findFirst({
      where: { id: profissionalId, estabelecimentoId: ctx.estabelecimentoId, deletedAt: null },
      select: { id: true },
    });
    if (!profissional) return { erro: "Profissional não encontrado" };

    const servico = await db.servico.findFirst({
      where: { id: servicoId, estabelecimentoId: ctx.estabelecimentoId, deletedAt: null },
      select: { duracaoMinutos: true },
    });
    if (!servico) return { erro: "Serviço não encontrado" };

    const [y, m, d] = dataStr.split("-").map(Number);
    const diaSemana = new Date(Date.UTC(y!, m! - 1, d!, 12)).getUTCDay();
    if (!ctx.horarioFuncionamento.diasSemana.includes(diaSemana)) {
      return { disponivel: false, motivo: "fechado neste dia" };
    }

    const inicioDia = zonedTimeToUtc({ year: y!, month: m!, day: d!, hour: 0, minute: 0, second: 0 }, ctx.timezone);
    const fimDia = zonedTimeToUtc({ year: y!, month: m!, day: d!, hour: 23, minute: 59, second: 59 }, ctx.timezone);

    const agendamentos = await db.agendamento.findMany({
      where: {
        profissionalId,
        inicioEm: { gte: inicioDia, lte: fimDia },
        status: { notIn: ["cancelado"] },
      },
      select: { inicioEm: true, fimEm: true },
    });

    const [abH, abM] = ctx.horarioFuncionamento.abertura.split(":").map(Number);
    const [feH, feM] = ctx.horarioFuncionamento.fechamento.split(":").map(Number);
    const aberturaMin = abH! * 60 + abM!;
    const fechamentoMin = feH! * 60 + feM! - servico.duracaoMinutos;

    if (fechamentoMin < aberturaMin) {
      return { disponivel: false, motivo: "serviço mais longo que o horário de funcionamento" };
    }

    const horarios: string[] = [];
    for (let min = aberturaMin; min <= fechamentoMin; min += 30) {
      const h = Math.floor(min / 60);
      const mi = min % 60;
      const slotInicio = zonedTimeToUtc({ year: y!, month: m!, day: d!, hour: h, minute: mi, second: 0 }, ctx.timezone);
      const slotFim = new Date(slotInicio.getTime() + servico.duracaoMinutos * 60_000);
      const conflito = agendamentos.some((a) => slotInicio < a.fimEm && slotFim > a.inicioEm);
      if (!conflito) horarios.push(`${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
      if (horarios.length >= 20) break;
    }
    return { disponivel: horarios.length > 0, horarios };
  }

  if (nome === "criar_agendamento") {
    const dataStr = String(args.data ?? "");
    const horaStr = String(args.hora ?? "");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      return { erro: "Data inválida. Use o formato YYYY-MM-DD." };
    }
    if (!/^\d{2}:\d{2}$/.test(horaStr)) {
      return { erro: "Hora inválida. Use o formato HH:mm (ex: 14:30)." };
    }
    const [h, m] = horaStr.split(":").map(Number);
    if (h! > 23 || m! > 59) {
      return { erro: "Hora fora do intervalo válido (00:00–23:59)." };
    }

    const cliente = await db.cliente.findUnique({
      where: { id: ctx.clienteId },
      select: { nome: true, telefoneE164: true },
    });
    if (!cliente) return { erro: "Cliente não encontrado" };

    const view = await agendamentoService.criar(
      ctx.estabelecimentoId,
      {
        clienteNome: cliente.nome ?? "Cliente",
        clienteTelefone: ctx.clienteTelefoneE164,
        clienteEmail: null,
        servicoId: String(args.servicoId),
        profissionalId: String(args.profissionalId),
        data: dataStr,
        hora: horaStr,
        observacoes: typeof args.observacoes === "string" ? args.observacoes : null,
      },
      "whatsapp",
    );
    return { id: view.id, data: view.data, hora: view.hora, servico: view.servico.nome, profissional: view.profissional.nome, status: view.status };
  }

  if (nome === "cancelar_agendamento") {
    const agendamentoId = String(args.agendamentoId);
    const agendamento = await db.agendamento.findFirst({
      where: { id: agendamentoId, estabelecimentoId: ctx.estabelecimentoId },
      select: { clienteId: true },
    });
    if (!agendamento) return { erro: "Agendamento não encontrado" };
    if (agendamento.clienteId !== ctx.clienteId) {
      return { erro: "Sem permissão para cancelar este agendamento" };
    }
    await agendamentoService.cancelar(agendamentoId, ctx.estabelecimentoId, String(args.motivo), "cliente");
    return { sucesso: true, mensagem: "Agendamento cancelado com sucesso." };
  }

  if (nome === "listar_meus_agendamentos") {
    const agendamentos = await db.agendamento.findMany({
      where: {
        clienteId: ctx.clienteId,
        estabelecimentoId: ctx.estabelecimentoId,
        inicioEm: { gte: new Date() },
        status: { notIn: ["cancelado"] },
      },
      include: { servico: { select: { nome: true } }, profissional: { select: { nome: true } } },
      orderBy: { inicioEm: "asc" },
      take: 5,
    });
    if (agendamentos.length === 0) return { mensagem: "Nenhum agendamento futuro encontrado." };
    return agendamentos.map((a) => ({
      id: a.id, servico: a.servico.nome, profissional: a.profissional.nome,
      inicioEm: a.inicioEm.toISOString(), status: a.status,
    }));
  }

  return { erro: `Ferramenta desconhecida: ${nome}` };
}

function makeClient(): OpenAI {
  const apiKey = env.OPENROUTER_API_KEY ?? env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("[agente] Nenhuma chave de API LLM configurada (OPENROUTER_API_KEY ou ANTHROPIC_API_KEY)");
  }
  const isOpenRouter = !!env.OPENROUTER_API_KEY;
  return new OpenAI({
    apiKey,
    ...(isOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
    ...(!isOpenRouter && env.ANTHROPIC_API_KEY && { baseURL: "https://api.anthropic.com/v1" }),
    defaultHeaders: isOpenRouter
      ? { "HTTP-Referer": "https://aproxima.ai", "X-Title": "AproximaAI" }
      : {},
  });
}

export const agenteService = {
  async processar(
    ctx: AgenteContext,
    mensagemUsuario: string,
    historicoMensagens: HistoricoMensagem[],
  ): Promise<AgenteResposta> {
    if (!env.OPENROUTER_API_KEY && !env.ANTHROPIC_API_KEY) {
      if (isProductionRuntime) {
        const fallback = "Estou temporariamente indisponível. Entre em contato pelo telefone do estabelecimento.";
        return {
          texto: fallback,
          tokensUsados: 0,
          mensagensAtualizadas: [
            ...historicoMensagens,
            { role: "user" as const, content: mensagemUsuario },
            { role: "assistant" as const, content: fallback },
          ],
        };
      }
      // DEV only — remove when API key is configured
      const updated = [
        ...historicoMensagens,
        { role: "user" as const, content: mensagemUsuario },
        { role: "assistant" as const, content: `[MOCK] Olá! Sou o assistente da ${ctx.estabelecimentoNome}. Recebi: "${mensagemUsuario}". Stack WhatsApp funcionando ✓` },
      ];
      return { texto: updated[updated.length - 1]!.content, tokensUsados: 0, mensagensAtualizadas: updated };
    }

    const client = makeClient();

    const MAX_HISTORICO = 10;
    const historicoCortado = historicoMensagens.length > MAX_HISTORICO
      ? historicoMensagens.slice(-MAX_HISTORICO)
      : historicoMensagens;

    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...historicoCortado.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
      { role: "user", content: mensagemUsuario },
    ];

    let tokensUsados = 0;
    let textoFinal = "";
    const MAX_ITERACOES = 10;
    const MAX_TOKENS_TOTAL = 50_000;

    for (let i = 0; i < MAX_ITERACOES; i++) {
      if (tokensUsados >= MAX_TOKENS_TOTAL) {
        logger.warn({ tokensUsados, sessionId: ctx.sessionId }, "[agente] limite de tokens atingido");
        textoFinal = "Desculpe, não consegui processar sua solicitação. Tente novamente.";
        break;
      }

      const response = await client.chat.completions.create({
        model: env.LLM_MODEL,
        max_tokens: env.LLM_MAX_TOKENS,
        messages: [
          { role: "system", content: buildSystemPrompt(ctx) },
          ...apiMessages,
        ],
        tools: TOOLS,
        tool_choice: "auto",
      });

      tokensUsados += response.usage?.total_tokens ?? 0;

      const choice = response.choices[0];
      if (!choice) break;

      const { finish_reason, message } = choice;
      apiMessages.push(message);

      if (finish_reason === "stop") {
        textoFinal = message.content ?? "";
        break;
      }

      if (finish_reason === "tool_calls" && message.tool_calls?.length) {
        const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

        for (const tc of message.tool_calls) {
          if (tc.type !== "function") continue;
          const fn = (tc as OpenAI.Chat.ChatCompletionMessageToolCall & { type: "function" }).function;
          let resultado: unknown;
          let sucesso = true;
          let erroMsg: string | undefined;

          try {
            const args = JSON.parse(fn.arguments || "{}") as Record<string, unknown>;
            resultado = await executarFerramenta(fn.name, args, ctx);
          } catch (err) {
            sucesso = false;
            erroMsg = err instanceof Error ? err.message : String(err);
            resultado = { error: erroMsg };
            logger.error({ err, ferramenta: fn.name }, "[agente] ferramenta falhou");
          }

          await waSessionRepo.logAcao({
            sessionId: ctx.sessionId,
            ferramenta: fn.name,
            argumentos: JSON.parse(fn.arguments || "{}") as object,
            resultado: resultado as object,
            sucesso,
            erro: erroMsg,
          });

          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(resultado),
          });
        }

        apiMessages.push(...toolResults);
        continue;
      }

      logger.warn({ finish_reason }, "[agente] finish_reason inesperado");
      textoFinal = message.content ?? "";
      break;
    }

    if (!textoFinal) {
      textoFinal = "Desculpe, não consegui processar sua solicitação. Tente novamente.";
    }

    const mensagensAtualizadas: HistoricoMensagem[] = [
      ...historicoCortado,
      { role: "user", content: mensagemUsuario },
      { role: "assistant", content: textoFinal },
    ];

    return { texto: textoFinal, tokensUsados, mensagensAtualizadas };
  },
};
