import "server-only";

import { env } from "./env";

/**
 * Sliding window rate-limit baseado em Redis sorted set.
 *
 * Em ambientes sem REDIS_URL: vira no-op (dev). Em produção a env é exigida
 * por `assertProdEnv` ao tocar Redis pela 1ª vez.
 *
 * Algoritmo:
 *   1. Remove entradas expiradas: `ZREMRANGEBYSCORE key 0 (now - windowMs)`
 *   2. Conta restantes: `ZCARD key`
 *   3. Se < limit → adiciona timestamp atual: `ZADD key now now`
 *   4. PEXPIRE para gc automático
 *
 * Multi-tenant: chave inclui sempre `estabelecimentoId` (ou identifier
 * apropriado). Nunca chave global compartilhada entre tenants.
 */
export type RateLimitResult =
  | { ok: true; remaining: number; resetMs: number }
  | { ok: false; remaining: 0; resetMs: number };

export async function checkRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV === "production") {
      console.warn("[rate-limit] REDIS_URL não configurado em produção — rate limit desativado");
    }
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }

  // Import dinâmico — evita crash de módulo quando REDIS_URL está ausente.
  const { redis } = await import("./redis");

  const now = Date.now();
  const key = `rl:${bucket}`;
  const member = `${now}:${Math.random()}`;

  const pipe = redis.multi();
  pipe.zremrangebyscore(key, 0, now - windowMs);
  pipe.zcard(key);
  pipe.zadd(key, now, member);
  pipe.pexpire(key, windowMs);
  const replies = await pipe.exec();

  if (!replies) {
    return { ok: true, remaining: limit - 1, resetMs: windowMs };
  }

  // ZCARD retorna ANTES do zadd, então count atual = pré-add. Se já estamos
  // no limite, removemos o que acabamos de adicionar.
  const countBeforeAdd = Number(replies[1]?.[1] ?? 0);

  if (countBeforeAdd >= limit) {
    await redis.zrem(key, member);
    return { ok: false, remaining: 0, resetMs: windowMs };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - countBeforeAdd - 1),
    resetMs: windowMs,
  };
}

/** Presets para uso imediato — manter conservadores. */
export const rateLimitPresets = {
  /** Mutações no painel: 60 req / min por tenant. */
  gestorMutation: { limit: 60, windowMs: 60_000 },
  /** Leituras: 240 req / min (4/s). */
  gestorRead: { limit: 240, windowMs: 60_000 },
  /** Endpoint de debug em dev (test notif): 10 / min. */
  debug: { limit: 10, windowMs: 60_000 },
};
