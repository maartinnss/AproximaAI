import { createHmac, timingSafeEqual } from "crypto";

import { after } from "next/server";

import { env, isProductionRuntime } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";
import { markAsRead, sendTextMessage } from "@/server/lib/whatsapp";
import { getWaMensagemQueue } from "@/server/lib/queue";
import { waMensagemService } from "@/server/services/wa-mensagem.service";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = env.META_VERIFY_TOKEN;
  if (!verifyToken) {
    return new Response("Forbidden", { status: 403 });
  }

  if (mode === "subscribe" && token !== null) {
    const tokenBuf = Buffer.from(token, "utf8");
    const expectedBuf = Buffer.from(verifyToken, "utf8");
    if (tokenBuf.length === expectedBuf.length && timingSafeEqual(tokenBuf, expectedBuf)) {
      return new Response(challenge ?? "", { status: 200 });
    }
  }

  return new Response("Forbidden", { status: 403 });
}

type MetaPayload = {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          id?: string;
          type?: string;
          from?: string;
          timestamp?: string;
          text?: { body?: string };
        }>;
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
      };
    }>;
  }>;
};

async function dispatch(payload: MetaPayload): Promise<void> {
  const queue = getWaMensagemQueue();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id ?? "";
      const contacts = value.contacts ?? [];

      for (const message of value.messages ?? []) {
        if (message.type !== "text") {
          const waId = message.from ?? "";
          if (waId && phoneNumberId) {
            await sendTextMessage(
              phoneNumberId,
              `+${waId}`,
              "Por enquanto só consigo responder mensagens de texto. Tente me mandar uma mensagem escrita! 😊",
            ).catch(() => null);
          }
          continue;
        }

        const waId = message.from ?? "";
        const metaMessageId = message.id ?? "";
        const texto = message.text?.body ?? "";
        const nowSecs = Math.floor(Date.now() / 1000);
        const rawTs = parseInt(message.timestamp ?? "0", 10);
        // Clamp timestamp: aceita até 5min no passado ou 60s no futuro; resto usa agora.
        const timestamp = rawTs > nowSecs - 300 && rawTs <= nowSecs + 60 ? rawTs : nowSecs;

        if (!waId || !metaMessageId || !texto) continue;

        const contactEntry = contacts.find((c) => c.wa_id === waId);
        const nome = contactEntry?.profile?.name;

        if (queue) {
          await queue.add(
            "processar",
            { waId, phoneNumberId, metaMessageId, nome, texto, timestamp, provider: "meta" },
            { jobId: metaMessageId },
          );
        } else {
          await waMensagemService.processar(
            { waId, phoneNumberId, metaMessageId, nome, texto, timestamp },
            {
              enviarTexto: (to, text) => sendTextMessage(phoneNumberId, to, text),
              marcarLida: (msgId) => markAsRead(phoneNumberId, msgId),
            },
          );
        }
      }
    }
  }
}

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();

  const appSecret = env.META_APP_SECRET;
  if (!appSecret) {
    if (isProductionRuntime) {
      return new Response("Forbidden", { status: 403 });
    }
    logger.warn("[webhook/whatsapp] META_APP_SECRET não definido — validação de assinatura ignorada (dev only)");
  } else {
    const header = req.headers.get("x-hub-signature-256");
    if (!header) {
      return new Response("Forbidden", { status: 403 });
    }
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const headerBuf = Buffer.from(header, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (
      headerBuf.length !== expectedBuf.length ||
      !timingSafeEqual(headerBuf, expectedBuf)
    ) {
      logger.warn({ header }, "[webhook/whatsapp] assinatura inválida");
      return new Response("Forbidden", { status: 403 });
    }
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(rawBody) as MetaPayload;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const queue = getWaMensagemQueue();
  if (queue) {
    // Queue available: dispatch synchronously (enqueue is fast), ack immediately
    await dispatch(payload).catch((err) =>
      logger.error({ err }, "[webhook/whatsapp] enqueue falhou"),
    );
  } else {
    // No Redis: fall back to after() for dev environments
    after(async () => {
      await dispatch(payload).catch((err) =>
        logger.error({ err }, "[webhook/whatsapp] processamento falhou"),
      );
    });
  }

  return new Response("OK", { status: 200 });
}
