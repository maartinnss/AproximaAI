import "./load-env"; // MUST be first — loads .env.local before env.ts is evaluated

import Redis from "ioredis";
import { Worker } from "bullmq";

import { markAsRead, sendTextMessage as metaSend } from "@/server/lib/whatsapp";
import { sendTextMessage as evolutionSend } from "@/server/lib/evolution";
import { logger } from "@/server/lib/logger";
import { waMensagemService } from "@/server/services/wa-mensagem.service";
import type { WaMensagemJob } from "@/server/lib/queue";
import { env } from "@/server/lib/env";

if (!env.REDIS_URL) {
  throw new Error("[wa-worker] REDIS_URL obrigatório");
}


const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker<WaMensagemJob>(
  "wa-mensagem",
  async (job) => {
    const { provider, ...entrada } = job.data;

    // Normaliza números brasileiros: Meta entrega from no formato 8d (554898484876)
    // mas exige 9d para envio (5548998484876). Fix no entry point para garantir aplicação.
    const normalizarDestinatario = (to: string): string => {
      const digits = to.replace(/^\+/, "");
      if (digits.startsWith("55") && digits.length === 12) {
        const norm = "+" + digits.slice(0, 4) + "9" + digits.slice(4);
        logger.debug({ original: to, normalized: norm }, "[wa-worker] número BR normalizado");
        return norm;
      }
      return to.startsWith("+") ? to : "+" + to;
    };

    const prov =
      provider === "meta"
        ? {
            enviarTexto: (to: string, text: string) =>
              metaSend(entrada.phoneNumberId, normalizarDestinatario(to), text),
            marcarLida: (msgId: string) =>
              markAsRead(entrada.phoneNumberId, msgId),
          }
        : {
            enviarTexto: (to: string, text: string) =>
              evolutionSend(entrada.phoneNumberId, to, text),
          };

    await waMensagemService.processar(entrada, prov);
  },
  {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, metaMessageId: job.data.metaMessageId }, "[wa-worker] job concluído");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, metaMessageId: job?.data.metaMessageId, attempt: job?.attemptsMade, err },
    "[wa-worker] job falhou",
  );
});

worker.on("error", (err) => {
  logger.error({ err }, "[wa-worker] erro de conexão");
});

logger.info({ concurrency: env.WORKER_CONCURRENCY }, "[wa-worker] iniciado — aguardando jobs");

async function shutdown(signal: string) {
  logger.info({ signal }, "[wa-worker] sinal recebido — drenando fila...");
  await worker.close();
  await connection.quit();
  logger.info("[wa-worker] encerrado com segurança");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
