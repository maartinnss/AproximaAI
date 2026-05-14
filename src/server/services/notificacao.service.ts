import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "../db/client";
import { logger } from "../lib/logger";
import { channels, redis } from "../lib/redis";
import {
  toNotificacaoView,
  type NotificacaoView,
} from "../repositories/_view-models";

export type CriarNotificacaoInput = {
  estabelecimentoId: string;
  tipo: "info" | "sucesso" | "alerta" | "aviso";
  titulo: string;
  mensagem: string;
  icone?: string;
  metadata?: Prisma.InputJsonValue;
};

export const notificacaoService = {
  /**
   * Cria notificação no DB e publica via Redis pub/sub para o canal do tenant.
   * Subscribers SSE do gestor recebem em tempo real.
   */
  async criar(input: CriarNotificacaoInput): Promise<NotificacaoView> {
    const created = await db.notificacao.create({
      data: {
        estabelecimentoId: input.estabelecimentoId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        icone: input.icone ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
    const view = toNotificacaoView(created);
    try {
      await redis.publish(
        channels.notificacoes(input.estabelecimentoId),
        JSON.stringify(view),
      );
    } catch (err) {
      logger.error(
        { err, estabelecimentoId: input.estabelecimentoId },
        "[notif] falha publicar redis",
      );
    }
    return view;
  },
};
