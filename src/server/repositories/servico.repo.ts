import "server-only";

import { db } from "../db/client";
import { toServicoView, type ServicoView } from "./_view-models";

export const servicoRepo = {
  async listByEstabelecimento(
    estabelecimentoId: string,
    opts: { ativos?: boolean } = {},
  ): Promise<ServicoView[]> {
    const list = await db.servico.findMany({
      where: {
        estabelecimentoId,
        deletedAt: null,
        ...(opts.ativos === true ? { ativo: true } : {}),
      },
      orderBy: { nome: "asc" },
    });
    return list.map(toServicoView);
  },

  async findById(id: string, estabelecimentoId: string): Promise<ServicoView | null> {
    const s = await db.servico.findFirst({
      where: { id, estabelecimentoId, deletedAt: null },
    });
    return s ? toServicoView(s) : null;
  },

  async create(data: {
    estabelecimentoId: string;
    nome: string;
    descricao: string;
    precoCentavos: number;
    duracaoMinutos: number;
  }): Promise<ServicoView> {
    const s = await db.servico.create({ data });
    return toServicoView(s);
  },

  async update(
    id: string,
    estabelecimentoId: string,
    data: Partial<{
      nome: string;
      descricao: string;
      precoCentavos: number;
      duracaoMinutos: number;
      ativo: boolean;
    }>,
  ): Promise<ServicoView> {
    const s = await db.servico.update({
      where: { id, estabelecimentoId },
      data,
    });
    return toServicoView(s);
  },

  async softDelete(id: string, estabelecimentoId: string): Promise<void> {
    await db.servico.update({
      where: { id, estabelecimentoId },
      data: { deletedAt: new Date(), ativo: false },
    });
  },
};
