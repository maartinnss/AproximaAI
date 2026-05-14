import "server-only";

import { env } from "./env";
import { logger } from "./logger";

function base(): string {
  if (!env.EVOLUTION_API_URL) throw new Error("EVOLUTION_API_URL não configurado");
  return env.EVOLUTION_API_URL.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: env.EVOLUTION_API_KEY ?? "",
  };
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: headers(),
    signal: AbortSignal.timeout(15_000),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(sem corpo)");
    logger.error({ status: res.status, path, body: text }, "[evolution] requisição falhou");
    throw new Error(`Evolution API ${res.status} ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function sendTextMessage(
  instanceName: string,
  to: string,
  text: string,
): Promise<void> {
  // Evolution aceita número com ou sem +; normaliza removendo +
  const number = to.startsWith("+") ? to.slice(1) : to;
  await request("POST", `/message/sendText/${instanceName}`, { number, text });
}

export async function createInstance(instanceName: string): Promise<{ qrcode?: { base64?: string; code?: string } }> {
  return request("POST", "/instance/create", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  });
}

export async function fetchQrCode(instanceName: string): Promise<{ base64?: string; code?: string }> {
  return request("GET", `/instance/connect/${instanceName}`);
}

export async function getConnectionState(instanceName: string): Promise<{ state: string }> {
  const data = await request<{ instance?: { state?: string } }>("GET", `/instance/connectionState/${instanceName}`);
  return { state: data?.instance?.state ?? "close" };
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await request("DELETE", `/instance/delete/${instanceName}`);
}
