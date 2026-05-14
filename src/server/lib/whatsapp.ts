import "server-only";

import { assertProdEnv, env } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";

const BASE = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;

async function graphPost(path: string, body: unknown): Promise<void> {
  assertProdEnv("META_ACCESS_TOKEN");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(sem corpo)");
    logger.error({ status: res.status, path, body: text }, "[whatsapp] requisição falhou");
    throw new Error(`Meta Graph API ${res.status}: ${text}`);
  }
}

/**
 * Normaliza números brasileiros para o formato de 9 dígitos.
 * Meta armazena o `from` no formato antigo (8 dígitos após área),
 * mas exige o novo formato (9 dígitos) para envio.
 * Ex: +554898484876 (12d) → +5548998484876 (13d)
 */
function normalizeTo(to: string): string {
  const digits = to.replace(/^\+/, "");
  if (digits.startsWith("55") && digits.length === 12) {
    return "+" + digits.slice(0, 4) + "9" + digits.slice(4);
  }
  return to.startsWith("+") ? to : "+" + to;
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
): Promise<void> {
  await graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeTo(to),
    type: "text",
    text: { body: text },
  });
}

export async function markAsRead(
  phoneNumberId: string,
  messageId: string,
): Promise<void> {
  await graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
