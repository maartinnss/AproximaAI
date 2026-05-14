import "server-only";

import type { StatusAgendamento } from "@prisma/client";

import { db } from "../db/client";
import {
  toAgendamentoView,
  type AgendamentoFull,
  type AgendamentoView,
} from "./_view-models";

const include = {
  cliente: { select: { id: true, nome: true, telefoneE164: true, email: true } },
  servico: { select: { id: true, nome: true, precoCentavos: true, duracaoMinutos: true } },
  profissional: { select: { id: true, nome: true } },
} as const;

function map(list: AgendamentoFull[], timezone: string): AgendamentoView[] {
  return list.map((a) => toAgendamentoView(a, timezone));
}

export const agendamentoRepo = {
  async listByEstabelecimento(
    estabelecimentoId: string,
    timezone: string,
    opts: { limit?: number; status?: string[] } = {},
  ): Promise<AgendamentoView[]> {
    const list = await db.agendamento.findMany({
      where: {
        estabelecimentoId,
        ...(opts.status ? { status: { in: opts.status as ("pendente" | "confirmado" | "concluido" | "cancelado" | "no_show")[] } } : {}),
      },
      include,
      orderBy: { inicioEm: "desc" },
      take: opts.limit ?? 200,
    });
    return map(list as AgendamentoFull[], timezone);
  },

  async listUltimos(
    estabelecimentoId: string,
    timezone: string,
    limit = 5,
  ): Promise<AgendamentoView[]> {
    const list = await db.agendamento.findMany({
      where: { estabelecimentoId },
      include,
      orderBy: { inicioEm: "desc" },
      take: limit,
    });
    return map(list as AgendamentoFull[], timezone);
  },

  async listByPeriodo(
    estabelecimentoId: string,
    inicio: Date,
    fim: Date,
    timezone: string,
  ): Promise<AgendamentoView[]> {
    const list = await db.agendamento.findMany({
      where: {
        estabelecimentoId,
        inicioEm: { gte: inicio, lt: fim },
      },
      include,
      orderBy: { inicioEm: "asc" },
    });
    return map(list as AgendamentoFull[], timezone);
  },

  async findById(
    id: string,
    estabelecimentoId: string,
    timezone: string,
  ): Promise<AgendamentoView | null> {
    const a = await db.agendamento.findFirst({
      where: { id, estabelecimentoId },
      include,
    });
    return a ? toAgendamentoView(a as AgendamentoFull, timezone) : null;
  },

  async cancelar(
    id: string,
    estabelecimentoId: string,
    motivo: string,
    canceladoPor: "cliente" | "gestor" | "sistema" = "gestor",
  ): Promise<void> {
    await db.agendamento.update({
      where: { id, estabelecimentoId },
      data: {
        status: "cancelado",
        motivoCancelamento: motivo,
        canceladoPor,
        canceladoEm: new Date(),
      },
    });
  },

  async atualizarStatus(
    id: string,
    estabelecimentoId: string,
    status: StatusAgendamento,
  ): Promise<void> {
    await db.agendamento.update({
      where: { id, estabelecimentoId },
      data: { status },
    });
  },

  async hardDelete(id: string, estabelecimentoId: string): Promise<void> {
    await db.agendamento.delete({
      where: { id, estabelecimentoId },
    });
  },

  // Métricas — usadas pelo dashboard.service.

  async countAtivosNoMes(
    estabelecimentoId: string,
    inicio: Date,
    fim: Date,
  ): Promise<number> {
    return db.agendamento.count({
      where: {
        estabelecimentoId,
        inicioEm: { gte: inicio, lt: fim },
        status: { in: ["confirmado", "concluido"] },
      },
    });
  },

  async receitaConcluidaNoPeriodo(
    estabelecimentoId: string,
    inicio: Date,
    fim: Date,
  ): Promise<{ totalCentavos: number; total: number }> {
    const r = await db.agendamento.aggregate({
      where: {
        estabelecimentoId,
        inicioEm: { gte: inicio, lt: fim },
        status: "concluido",
      },
      _sum: { precoCentavosSnapshot: true },
      _count: true,
    });
    return {
      totalCentavos: r._sum.precoCentavosSnapshot ?? 0,
      total: r._count,
    };
  },
};
