import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType, z } from "zod";

import { getOptionalSession } from "@/server/auth/session";

import { logger } from "./logger";
import { checkRateLimit, rateLimitPresets } from "./rate-limit";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Garante sessão de gestor; devolve `{ estabelecimentoId, ... }`.
 * Usar SEMPRE no início de cada route handler protegido.
 */
export async function requireGestorContext() {
  const session = await getOptionalSession();
  if (!session?.user || session.user.role !== "gestor" || !session.user.estabelecimentoId) {
    throw new HttpError(401, "unauthenticated", "Gestor não autenticado");
  }
  return {
    userId: session.user.id,
    estabelecimentoId: session.user.estabelecimentoId,
    nome: session.user.name ?? "",
    email: session.user.email ?? "",
    locale: session.user.locale ?? "pt-BR",
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json", "Body precisa ser JSON válido");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "validation_error", formatZodError(parsed.error));
  }
  return parsed.data;
}

function formatZodError(err: ZodError): string {
  return err.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

/**
 * Wrap de Postgres exclusion_violation (anti-overbooking constraint).
 */
export function isOverbookingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    code?: string;
    meta?: { code?: string };
    cause?: unknown;
    message?: string;
  };
  if (e.code === "23P01" || e.meta?.code === "23P01") return true;
  if (typeof e.message === "string" && e.message.includes("agendamento_no_overlap_profissional")) {
    return true;
  }
  if (e.cause && typeof e.cause === "object") {
    return isOverbookingError(e.cause);
  }
  return false;
}

/**
 * Detecta `PrismaClientKnownRequestError` com `code: 'P2025'` (registro não
 * encontrado em update/delete). Devolve 404 em vez de 500 genérico.
 */
function isPrismaNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string };
  return e.code === "P2025" || e.name === "PrismaClientKnownRequestError" && e.code === "P2025";
}

/**
 * Catch-all wrapper. Usar no final do handler:
 *   try { ... } catch (err) { return handleError(err); }
 */
export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return jsonError(err.status, err.code, err.message);
  }
  if (err instanceof ZodError) {
    return jsonError(400, "validation_error", formatZodError(err));
  }
  if (isOverbookingError(err)) {
    return jsonError(
      409,
      "overbooking",
      "Esse profissional já tem outro agendamento neste horário",
    );
  }
  if (isPrismaNotFound(err)) {
    return jsonError(404, "not_found", "Recurso não encontrado");
  }
  logger.error({ err }, "[api] erro não tratado");
  return jsonError(500, "internal_error", "Erro interno do servidor");
}

export async function extractId(
  params: Promise<{ id: string }>,
): Promise<string> {
  const { id } = await params;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) throw new HttpError(400, "invalid_id", "ID inválido");
  return id;
}

/**
 * Aplica rate-limit por tenant + usuário. Lança 429 se excedido. Chamar logo após
 * `requireGestorContext`, antes do parse do body.
 */
export async function enforceRateLimit(
  ctx: { estabelecimentoId: string; userId: string },
  scope: keyof typeof rateLimitPresets = "gestorMutation",
): Promise<void> {
  const preset = rateLimitPresets[scope];
  const result = await checkRateLimit(
    `${scope}:${ctx.estabelecimentoId}:${ctx.userId}`,
    preset.limit,
    preset.windowMs,
  );
  if (!result.ok) {
    throw new HttpError(
      429,
      "rate_limited",
      `Muitas requisições — tente novamente em ${Math.ceil(result.resetMs / 1000)}s`,
    );
  }
}
