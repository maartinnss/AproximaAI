import "server-only";

import { z } from "zod";

import { env } from "./env";
import { logger } from "./logger";

const connectionStateSchema = z
  .object({ instance: z.object({ state: z.string() }).optional() })
  .catch({ instance: undefined });

const createInstanceSchema = z
  .object({ qrcode: z.object({ base64: z.string().optional(), code: z.string().optional() }).optional() })
  .catch({ qrcode: undefined });

const fetchQrCodeSchema = z
  .object({ base64: z.string().optional(), code: z.string().optional() })
  .catch({});

function base(): string {
  if (!env.EVOLUTION_API_URL) throw new Error("EVOLUTION_API_URL não configurado");
  return env.EVOLUTION_API_URL.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  if (!env.EVOLUTION_API_KEY) {
    // Falha rápido em produção; em dev aceita sem key (Evolution local pode não exigir).
    if (process.env.NODE_ENV === "production") {
      throw new Error("[evolution] EVOLUTION_API_KEY obrigatório em produção");
    }
    logger.warn("[evolution] EVOLUTION_API_KEY não definido — requisição sem autenticação");
  }
  return {
    "Content-Type": "application/json",
    apikey: env.EVOLUTION_API_KEY ?? "",
  };
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: headers(),
    signal: AbortSignal.timeout(8_000),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(sem corpo)");
    logger.error({ status: res.status, path, body: text }, "[evolution] requisição falhou");
    // Prefixo padronizado: "Evolution API {status}" para distinguir de erros de rede
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
  const raw = await request<unknown>("POST", "/instance/create", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  });
  return createInstanceSchema.parse(raw);
}

export async function fetchQrCode(instanceName: string): Promise<{ base64?: string; code?: string }> {
  const raw = await request<unknown>("GET", `/instance/connect/${instanceName}`);
  return fetchQrCodeSchema.parse(raw);
}

export async function getConnectionState(instanceName: string): Promise<{ state: string }> {
  const raw = await request<unknown>("GET", `/instance/connectionState/${instanceName}`);
  const data = connectionStateSchema.parse(raw);
  return { state: data.instance?.state ?? "close" };
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await request("DELETE", `/instance/delete/${instanceName}`);
}

export async function restartInstance(instanceName: string): Promise<void> {
  await request("PUT", `/instance/restart/${instanceName}`);
}
