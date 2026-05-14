import "server-only";

import { db } from "../db/client";
import { toProfissionalView, type ProfissionalView } from "./_view-models";

export const profissionalRepo = {
  async listByEstabelecimento(
    estabelecimentoId: string,
    opts: { ativos?: boolean } = {},
  ): Promise<ProfissionalView[]> {
    const list = await db.profissional.findMany({
      where: {
        estabelecimentoId,
        deletedAt: null,
        ...(opts.ativos === true ? { ativo: true } : {}),
      },
      orderBy: { nome: "asc" },
    });
    return list.map(toProfissionalView);
  },

  async findById(id: string, estabelecimentoId: string): Promise<ProfissionalView | null> {
    const p = await db.profissional.findFirst({
      where: { id, estabelecimentoId, deletedAt: null },
    });
    return p ? toProfissionalView(p) : null;
  },

  async create(data: {
    estabelecimentoId: string;
    nome: string;
    especialidade: string;
    telefone: string;
    email: string;
  }): Promise<ProfissionalView> {
    const p = await db.profissional.create({ data });
    return toProfissionalView(p);
  },

  async update(
    id: string,
    estabelecimentoId: string,
    data: Partial<{
      nome: string;
      especialidade: string;
      telefone: string;
      email: string;
      ativo: boolean;
    }>,
  ): Promise<ProfissionalView> {
    const p = await db.profissional.update({
      where: { id, estabelecimentoId },
      data,
    });
    return toProfissionalView(p);
  },

  async softDelete(id: string, estabelecimentoId: string): Promise<void> {
    await db.profissional.update({
      where: { id, estabelecimentoId },
      data: { deletedAt: new Date(), ativo: false },
    });
  },
};
