import "server-only";

import { db } from "../db/client";
import { toNotificacaoView, type NotificacaoView } from "./_view-models";

export const notificacaoRepo = {
  async listByEstabelecimento(
    estabelecimentoId: string,
    opts: { naoLidas?: boolean; limit?: number } = {},
  ): Promise<NotificacaoView[]> {
    const list = await db.notificacao.findMany({
      where: {
        estabelecimentoId,
        ...(opts.naoLidas ? { lida: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: opts.limit,
    });
    return list.map(toNotificacaoView);
  },

  async countNaoLidas(estabelecimentoId: string): Promise<number> {
    return db.notificacao.count({
      where: { estabelecimentoId, lida: false },
    });
  },

  async marcarComoLida(id: string, estabelecimentoId: string): Promise<void> {
    // updateMany evita P2025 quando o id é de outro tenant (atacante ou
    // cliente desatualizado): retorna count=0 silenciosamente.
    await db.notificacao.updateMany({
      where: { id, estabelecimentoId },
      data: { lida: true },
    });
  },

  async marcarTodasComoLidas(estabelecimentoId: string): Promise<void> {
    await db.notificacao.updateMany({
      where: { estabelecimentoId, lida: false },
      data: { lida: true },
    });
  },
};
