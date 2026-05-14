import "server-only";

import { db } from "../db/client";
import {
  toAvaliacaoView,
  type AvaliacaoFull,
  type AvaliacaoView,
} from "./_view-models";

export const avaliacaoRepo = {
  async listByEstabelecimento(
    estabelecimentoId: string,
    limit = 20,
  ): Promise<AvaliacaoView[]> {
    const list = await db.avaliacao.findMany({
      where: { estabelecimentoId },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return (list as AvaliacaoFull[]).map(toAvaliacaoView);
  },
};
