import "server-only";

import pino from "pino";

import { env } from "./env";

const isDev = env.NODE_ENV !== "production";

/**
 * Logger estruturado (pino).
 *
 * Em prod: JSON em stdout — Sentry/Axiom/Datadog parseiam direto.
 * Em dev: pino-pretty (cores, timestamps legíveis).
 *
 * Use SEMPRE com objeto de contexto:
 *   logger.error({ err, agendamentoId, estabelecimentoId }, "falha ao cancelar")
 *
 * `console.error` perde campos em prod e dificulta correlação.
 */
export const logger = pino({
  level: isDev ? "debug" : "info",
  base: { app: "aproxima" },
  redact: {
    paths: [
      "*.senha",
      "*.senhaHash",
      "*.AUTH_SECRET",
      "*.token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname,app",
          },
        },
      }
    : {}),
});
