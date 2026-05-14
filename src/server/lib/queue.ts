import "server-only";

import Redis from "ioredis";
import { Queue } from "bullmq";

import { env } from "./env";

export type WaMensagemJob = {
  waId: string;
  phoneNumberId: string;
  metaMessageId: string;
  nome?: string;
  texto: string;
  timestamp: number;
  provider: "meta" | "evolution";
};

declare global {
  var __waMensagemQueue: Queue<WaMensagemJob> | undefined;
}

export function getWaMensagemQueue(): Queue<WaMensagemJob> | null {
  if (!env.REDIS_URL) return null;
  if (globalThis.__waMensagemQueue) return globalThis.__waMensagemQueue;
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue<WaMensagemJob>("wa-mensagem", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: { age: 86_400, count: 10_000 },
      removeOnFail: { age: 7 * 86_400, count: 5_000 },
    },
  });
  globalThis.__waMensagemQueue = queue;
  return queue;
}
