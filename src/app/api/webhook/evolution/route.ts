import { timingSafeEqual } from "crypto";

import { after } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/server/db/client";
import { env, isProductionRuntime } from "@/server/lib/env";
import { sendTextMessage } from "@/server/lib/evolution";
import { logger } from "@/server/lib/logger";
import { getWaMensagemQueue } from "@/server/lib/queue";
import { waMensagemService } from "@/server/services/wa-mensagem.service";

type EvolutionPayload = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
};

const TEXTO_APENAS_TEXTO =
  "Por enquanto só consigo responder mensagens de texto. Tente me mandar uma mensagem escrita! 😊";

async function dispatch(data: EvolutionPayload): Promise<void> {
  if (data.event !== "messages.upsert") {
    if (data.event) {
      logger.debug({ event: data.event, instance: data.instance }, "[webhook/evolution] evento ignorado");
    }
    return;
  }
  if (data.data?.key?.fromMe) return;

  const remoteJid = data.data?.key?.remoteJid ?? "";
  if (!remoteJid.endsWith("@s.whatsapp.net")) return; // ignora grupos

  const waId = remoteJid.replace("@s.whatsapp.net", "");
  const instanceName = data.instance ?? "";
  const metaMessageId = data.data?.key?.id ?? "";
  const nome = data.data?.pushName;
  const timestamp = data.data?.messageTimestamp ?? Math.floor(Date.now() / 1000);

  if (!waId || !metaMessageId || !instanceName) return;

  // Optimistic insert: if P2002 (unique violation), this event was already dispatched.
  try {
    await db.idempotencyKey.create({
      data: {
        chave: `webhook:evolution:${metaMessageId}`,
        endpoint: "webhook/evolution",
        expiraEm: new Date(Date.now() + 86_400_000),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      logger.info({ metaMessageId }, "[webhook/evolution] replay detectado — ignorado");
      return;
    }
    // DB unavailable — fall through, waMensagemService has its own dedup layer
    logger.warn({ err }, "[webhook/evolution] idempotency check falhou — continuando");
  }

  const texto =
    data.data?.message?.conversation ??
    data.data?.message?.extendedTextMessage?.text ??
    "";

  if (!texto) {
    // Non-text message (audio, image, sticker, etc.) — reply and stop
    await sendTextMessage(instanceName, `+${waId}`, TEXTO_APENAS_TEXTO).catch(() => null);
    return;
  }

  const queue = getWaMensagemQueue();

  if (queue) {
    await queue.add(
      "processar",
      { waId, phoneNumberId: instanceName, metaMessageId, nome, texto, timestamp, provider: "evolution" },
      { jobId: metaMessageId },
    );
  } else {
    await waMensagemService.processar(
      { waId, phoneNumberId: instanceName, metaMessageId, nome, texto, timestamp },
      { enviarTexto: (to, text) => sendTextMessage(instanceName, to, text) },
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    // Evolution API v2 global webhooks do NOT send an apikey header.
    // We validate only against EVOLUTION_WEBHOOK_SECRET (an inbound-only secret).
    // If not set, bypass auth in dev; block in production.
    const apikeyHeader = req.headers.get("apikey") ?? "";
    const webhookSecret = env.EVOLUTION_WEBHOOK_SECRET;

    if (!webhookSecret) {
      if (isProductionRuntime) {
        logger.warn("[webhook/evolution] EVOLUTION_WEBHOOK_SECRET não definido em produção — bloqueado");
        return new Response("Forbidden", { status: 403 });
      }
      logger.warn("[webhook/evolution] EVOLUTION_WEBHOOK_SECRET não definido — validação ignorada (dev only)");
    } else {
      const headerBuf = Buffer.from(apikeyHeader, "utf8");
      const expectedBuf = Buffer.from(webhookSecret, "utf8");
      if (headerBuf.length !== expectedBuf.length || !timingSafeEqual(headerBuf, expectedBuf)) {
        logger.warn({ apikeyHeader }, "[webhook/evolution] apikey inválida");
        return new Response("Forbidden", { status: 403 });
      }
    }

    let payload: EvolutionPayload;
    try {
      payload = (await req.json()) as EvolutionPayload;
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const queue = getWaMensagemQueue();
    if (queue) {
      await dispatch(payload).catch((err) =>
        logger.error({ err }, "[webhook/evolution] enqueue falhou"),
      );
    } else {
      after(async () => {
        await dispatch(payload).catch((err) =>
          logger.error({ err }, "[webhook/evolution] processamento falhou"),
        );
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "[webhook/evolution] erro não tratado");
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
