# src/server — backend layer

Server-only code. **Never imported from Client Components** (`"use client"`).

## Layers

- `auth/` — Auth.js v5 config + session helpers (`requireGestor`, `requireCliente`).
- `db/` — Prisma client singleton (`client.ts`) + seed (`seed.ts`).
- `repositories/` — 1 method = 1 query. Receives `estabelecimentoId` for tenant scope.
- `services/` — business logic, orchestration. Calls repositories, never `db/client` directly.
- `services/whatsapp/` — Meta Cloud API integration + LLM tools.
- `ai/` — `LLMProvider` interface + Claude implementation.
- `jobs/` — BullMQ queues, workers, schedulers.
- `lib/` — env, logger, errors, rate-limit, idempotency, tenant context.
- `validators/` — shared zod schemas (request/response shapes).

## Import rules

- `app/**` calls `src/server/services/**` (never `repositories` directly, never `db/client`).
- Client Components import only from `src/lib/**` and `src/types/**`.
- Workers run in a separate Node process via `worker.ts` entrypoint at repo root.
