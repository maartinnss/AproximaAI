import "server-only";

import type { WaSession } from "@prisma/client";

import { db } from "@/server/db/client";

export type WaSessionContexto = {
  mensagens: Array<{ role: "user" | "assistant"; content: string }>;
};

export const waSessionRepo = {
  async findOrCreateCliente(
    waId: string,
    nome?: string,
  ): Promise<{ id: string; telefoneE164: string }> {
    const telefoneE164 = `+${waId}`;
    const result = await db.cliente.upsert({
      where: { telefoneE164 },
      update: {},
      create: {
        telefoneE164,
        nome: nome ?? null,
        origem: "whatsapp",
      },
      select: { id: true, telefoneE164: true },
    });
    return result;
  },

  async findAtiva(
    waId: string,
    phoneNumberId: string,
    estabelecimentoId: string,
  ): Promise<WaSession | null> {
    return db.waSession.findFirst({
      where: {
        waId,
        phoneNumberId,
        estabelecimentoId,
        status: "ativa",
        expiraEm: { gt: new Date() },
      },
    });
  },

  async criarSessao(data: {
    clienteId: string;
    estabelecimentoId: string;
    waId: string;
    phoneNumberId: string;
  }): Promise<WaSession> {
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return db.waSession.create({
      data: {
        clienteId: data.clienteId,
        estabelecimentoId: data.estabelecimentoId,
        waId: data.waId,
        phoneNumberId: data.phoneNumberId,
        status: "ativa",
        expiraEm,
        contexto: { mensagens: [] },
      },
    });
  },

  async updateContexto(id: string, contexto: WaSessionContexto): Promise<void> {
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.waSession.update({
      where: { id },
      data: {
        contexto: contexto as object,
        ultimaMensagemEm: new Date(),
        expiraEm,
      },
    });
  },

  async saveMensagem(data: {
    sessionId: string;
    direcao: "in" | "out";
    metaMessageId: string;
    tipo: "text" | "template" | "interactive" | "audio" | "image" | "system";
    conteudo: object;
    enviadaEm: Date;
    custoTokens?: number;
    modeloLlm?: string;
  }): Promise<void> {
    await db.waMessage.create({
      data: {
        sessionId: data.sessionId,
        direcao: data.direcao,
        metaMessageId: data.metaMessageId,
        tipo: data.tipo,
        conteudo: data.conteudo,
        enviadaEm: data.enviadaEm,
        custoTokens: data.custoTokens ?? null,
        modeloLlm: data.modeloLlm ?? null,
      },
    });
  },

  async existeMensagem(metaMessageId: string): Promise<boolean> {
    const count = await db.waMessage.count({ where: { metaMessageId } });
    return count > 0;
  },

  async logAcao(data: {
    sessionId: string;
    ferramenta: string;
    argumentos: object;
    resultado?: object;
    sucesso: boolean;
    erro?: string;
  }): Promise<void> {
    await db.agenteAcaoLog.create({
      data: {
        sessionId: data.sessionId,
        ferramenta: data.ferramenta,
        argumentos: data.argumentos,
        ...(data.resultado !== undefined ? { resultado: data.resultado } : {}),
        sucesso: data.sucesso,
        erro: data.erro ?? null,
      },
    });
  },
};
