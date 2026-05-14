import "server-only";

import { randomUUID } from "crypto";

import { db } from "@/server/db/client";
import { env } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";
import { waSessionRepo } from "@/server/repositories/wa-session.repo";
import { agenteService } from "@/server/services/agente.service";

export type WaMensagemEntrada = {
  waId: string;
  phoneNumberId: string;
  metaMessageId: string;
  nome?: string;
  texto: string;
  timestamp: number;
};

export type WaProvider = {
  enviarTexto: (to: string, text: string) => Promise<void>;
  marcarLida?: (messageId: string) => Promise<void>;
};

function sanitizarTexto(input: string): string {
  // Remove null bytes e caracteres de controle (exceto \n, \r, \t) que podem
  // confundir o LLM ou corromper logs estruturados.
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export const waMensagemService = {
  async processar(entrada: WaMensagemEntrada, provider: WaProvider): Promise<void> {
    try {
      if (!/^\d{7,15}$/.test(entrada.waId)) {
        logger.warn({ waId: entrada.waId }, "[wa] waId com formato inválido, ignorado");
        return;
      }

      const texto = sanitizarTexto(
        entrada.texto.length > 4000 ? entrada.texto.slice(0, 4000) : entrada.texto,
      );

      const deduplicationKey = `wa:dedup:${entrada.metaMessageId}`;
      let redisDeduped = false;

      // Fast-path dedup via Redis SET NX — evita LLM duplicado em retries concorrentes
      if (env.REDIS_URL) {
        try {
          const { redis } = await import("@/server/lib/redis");
          const nx = await redis.set(deduplicationKey, "1", "EX", 86400, "NX");
          if (nx === null) {
            logger.info({ metaMessageId: entrada.metaMessageId }, "[wa] dedup Redis — já processando");
            return;
          }
          redisDeduped = true;
        } catch (err) {
          logger.warn({ err }, "[wa] Redis dedup falhou — continuando com fallback DB");
        }
      }

      // Fallback: dedup via DB (cobre Redis indisponível ou ausente)
      const duplicada = await waSessionRepo.existeMensagem(entrada.metaMessageId);
      if (duplicada) {
        logger.info({ metaMessageId: entrada.metaMessageId }, "[wa] dedup DB — mensagem duplicada ignorada");
        return;
      }

      const cliente = await waSessionRepo.findOrCreateCliente(entrada.waId, entrada.nome);

      const estabelecimento = await db.estabelecimento.findFirst({
        where: {
          OR: [
            { whatsappPhoneNumberId: entrada.phoneNumberId },
            { evolutionInstanceName: entrada.phoneNumberId },
          ],
          deletedAt: null,
        },
      });

      if (!estabelecimento) {
        logger.error({ phoneNumberId: entrada.phoneNumberId }, "[wa] estabelecimento não encontrado");
        return;
      }

      let session = await waSessionRepo.findAtiva(entrada.waId, entrada.phoneNumberId, estabelecimento.id);
      if (!session) {
        session = await waSessionRepo.criarSessao({
          clienteId: cliente.id,
          estabelecimentoId: estabelecimento.id,
          waId: entrada.waId,
          phoneNumberId: entrada.phoneNumberId,
        });
      }

      try {
        await waSessionRepo.saveMensagem({
          sessionId: session.id,
          direcao: "in",
          metaMessageId: entrada.metaMessageId,
          tipo: "text",
          conteudo: { text: texto },
          enviadaEm: new Date(entrada.timestamp * 1000),
        });
      } catch (dbErr) {
        // DB write falhou — apaga chave Redis para que retry (BullMQ ou Meta)
        // possa reprocessar. Sem isso a mensagem seria descartada permanentemente.
        if (redisDeduped && env.REDIS_URL) {
          try {
            const { redis } = await import("@/server/lib/redis");
            await redis.del(deduplicationKey);
          } catch {}
        }
        throw dbErr;
      }

      if (provider.marcarLida) {
        provider.marcarLida(entrada.metaMessageId).catch((err) =>
          logger.warn({ err }, "[wa] marcarLida falhou (ignorado)"),
        );
      }

      if (!estabelecimento.aiEnabled) {
        logger.info({ estabelecimentoId: estabelecimento.id }, "[wa] aiEnabled=false, agente desativado");
        return;
      }

      const vinte4hAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const msgsDia = await db.waMessage.count({
        where: {
          direcao: "out",
          session: { estabelecimentoId: estabelecimento.id },
          enviadaEm: { gte: vinte4hAtras },
        },
      });
      if (msgsDia >= estabelecimento.maxMsgsDia) {
        logger.warn(
          { estabelecimentoId: estabelecimento.id, msgsDia, limite: estabelecimento.maxMsgsDia },
          "[wa] limite diário atingido",
        );
        return;
      }

      const contextoAtual = (session.contexto ?? { mensagens: [] }) as {
        mensagens: Array<{ role: "user" | "assistant"; content: string }>;
      };

      const horarioFuncionamento = estabelecimento.horarioFuncionamento as {
        abertura: string;
        fechamento: string;
        diasSemana: number[];
      };

      const resposta = await agenteService.processar(
        {
          estabelecimentoId: estabelecimento.id,
          estabelecimentoNome: estabelecimento.nome,
          estabelecimentoPersona: estabelecimento.aiPersona,
          timezone: estabelecimento.timezone,
          locale: estabelecimento.locale,
          horarioFuncionamento,
          clienteId: cliente.id,
          clienteTelefoneE164: cliente.telefoneE164,
          sessionId: session.id,
        },
        texto,
        contextoAtual.mensagens,
      );

      try {
        await provider.enviarTexto(`+${entrada.waId}`, resposta.texto);
      } catch (err) {
        logger.error({ err, waId: entrada.waId }, "[wa] envio falhou — resposta salva mas não entregue");
      }

      await waSessionRepo.saveMensagem({
        sessionId: session.id,
        direcao: "out",
        metaMessageId: randomUUID(),
        tipo: "text",
        conteudo: { text: resposta.texto },
        enviadaEm: new Date(),
        custoTokens: resposta.tokensUsados,
        modeloLlm: env.LLM_MODEL,
      });

      await waSessionRepo.updateContexto(session.id, { mensagens: resposta.mensagensAtualizadas });
    } catch (err) {
      logger.error({ err, waId: entrada.waId }, "[wa-mensagem] processamento falhou");
    }
  },
};
