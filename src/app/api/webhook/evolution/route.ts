import { timingSafeEqual } from "crypto";

import { after } from "next/server";

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
  if (data.event !== "messages.upsert") return;
  if (data.data?.key?.fromMe) return;

  const remoteJid = data.data?.key?.remoteJid ?? "";
  if (!remoteJid.endsWith("@s.whatsapp.net")) return; // ignora grupos

  const waId = remoteJid.replace("@s.whatsapp.net", "");
  const instanceName = data.instance ?? "";
  const metaMessageId = data.data?.key?.id ?? "";
  const nome = data.data?.pushName;
  const timestamp = data.data?.messageTimestamp ?? Math.floor(Date.now() / 1000);

  if (!waId || !metaMessageId || !instanceName) return;

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
    const apikeyHeader = req.headers.get("apikey") ?? "";
    const expectedKey = env.EVOLUTION_API_KEY;
    if (!expectedKey) {
      if (isProductionRuntime) {
        return new Response("Forbidden", { status: 403 });
      }
      logger.warn("[webhook/evolution] EVOLUTION_API_KEY não definido — validação ignorada (dev only)");
    } else {
      const headerBuf = Buffer.from(apikeyHeader, "utf8");
      const expectedBuf = Buffer.from(expectedKey, "utf8");
      if (headerBuf.length !== expectedBuf.length || !timingSafeEqual(headerBuf, expectedBuf)) {
        logger.warn("[webhook/evolution] apikey inválida");
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
