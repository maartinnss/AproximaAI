import "server-only";

import Redis from "ioredis";

import { env } from "./env";

declare global {
  var __redis: Redis | undefined;
  var __redisChannelPool:
    | Map<string, { sub: Redis; listeners: Set<(payload: string) => void> }>
    | undefined;
}

function makeClient(): Redis {
  if (!env.REDIS_URL) throw new Error("REDIS_URL not configured");
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
}

/** Cliente publicador / general purpose (não use para subscribe). */
export const redis = globalThis.__redis ?? makeClient();
if (env.NODE_ENV !== "production") globalThis.__redis = redis;

/**
 * Pool de subscribers compartilhado por canal.
 *
 * Sem isso, cada conexão SSE faria `duplicate()` e abriria uma nova conexão
 * Redis — `maxclients` no Upstash/managed Redis estoura sob carga.
 *
 * Aqui: 1 conexão Redis por canal (i.e. por estabelecimento) sendo escutado,
 * com fan-out em memória para os handlers SSE conectados.
 */
const channelPool =
  globalThis.__redisChannelPool ??
  new Map<string, { sub: Redis; listeners: Set<(payload: string) => void> }>();
if (env.NODE_ENV !== "production") globalThis.__redisChannelPool = channelPool;

/**
 * Inscreve handler em canal Redis. Devolve função `unsubscribe`.
 * Quando o último handler de um canal sai, fechamos a conexão Redis.
 */
export function subscribeToChannel(
  channel: string,
  onMessage: (payload: string) => void,
): () => Promise<void> {
  let entry = channelPool.get(channel);

  if (!entry) {
    const sub = makeClient();
    const listeners = new Set<(payload: string) => void>();
    entry = { sub, listeners };
    channelPool.set(channel, entry);

    sub.on("message", (_chan, payload) => {
      const cur = channelPool.get(channel);
      if (!cur) return;
      for (const fn of cur.listeners) {
        try {
          fn(payload);
        } catch (err) {
          console.error("[redis] listener falhou:", err);
        }
      }
    });
    sub.subscribe(channel).catch((err) => {
      console.error("[redis] subscribe falhou:", channel, err);
    });
  }

  entry.listeners.add(onMessage);

  let removed = false;
  return async () => {
    if (removed) return;
    removed = true;
    const cur = channelPool.get(channel);
    if (!cur) return;
    cur.listeners.delete(onMessage);
    if (cur.listeners.size === 0) {
      channelPool.delete(channel);
      try {
        await cur.sub.unsubscribe(channel);
      } catch {}
      // Só desconecta se nenhum novo subscriber recriou a entry durante o await.
      if (!channelPool.has(channel)) {
        cur.sub.disconnect();
      }
    }
  };
}

export const channels = {
  notificacoes: (estabelecimentoId: string) => `notif:${estabelecimentoId}`,
};
