import "server-only";

import { cache } from "react";

import { db } from "../db/client";
import { toEstabelecimentoView, type EstabelecimentoView } from "./_view-models";

const findByIdCached = cache(
  async (id: string): Promise<EstabelecimentoView | null> => {
    const e = await db.estabelecimento.findFirst({
      where: { id, deletedAt: null },
    });
    return e ? toEstabelecimentoView(e) : null;
  },
);

const findBySlugCached = cache(
  async (slug: string): Promise<EstabelecimentoView | null> => {
    const e = await db.estabelecimento.findFirst({
      where: { slug, deletedAt: null },
    });
    return e ? toEstabelecimentoView(e) : null;
  },
);

export const estabelecimentoRepo = {
  findById: findByIdCached,
  findBySlug: findBySlugCached,
  async requireById(id: string): Promise<EstabelecimentoView> {
    const e = await findByIdCached(id);
    if (!e) throw new Error(`Estabelecimento ${id} não encontrado`);
    return e;
  },
};
