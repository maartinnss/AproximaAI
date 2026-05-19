import { z } from "zod";

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";
const isProdRuntime = process.env.NODE_ENV === "production" && !isBuildPhase;

const SENTINEL_SECRETS = [
  /^change[_-]?me/i,
  /^placeholder/i,
  /^x{6,}/i,
  /^example/i,
];

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET precisa ter ao menos 32 caracteres")
    .refine(
      (v) => !SENTINEL_SECRETS.some((re) => re.test(v)),
      "AUTH_SECRET parece ser um valor placeholder. Gere um real com `openssl rand -base64 32`",
    ),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z
    .union([z.literal("true"), z.literal("false")])
    .default("true")
    .transform((v) => v === "true"),

  REDIS_URL: z.string().url().optional(),

  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  // Segredo separado para validar webhooks recebidos da Evolution.
  // Se ausente, cai para EVOLUTION_API_KEY (retrocompatibilidade).
  // Em produção nova, definir ambos com valores distintos.
  EVOLUTION_WEBHOOK_SECRET: z.string().optional(),

  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_WABA_ID: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_GRAPH_VERSION: z.string().default("v21.0"),
  META_ACCESS_TOKEN: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct:free"),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(2048),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("AproximaAI <noreply@aproxima.ai>"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
  DEFAULT_LOCALE: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  DEFAULT_TIMEZONE: z.string().default("America/Sao_Paulo"),
  DEFAULT_CURRENCY: z.string().default("BRL"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = typeof env;

// Startup warning: variáveis opcionais no schema mas críticas em produção.
if (isProdRuntime) {
  const criticalInProd: Array<keyof Env> = [
    "REDIS_URL",
    "EVOLUTION_API_URL",
    "EVOLUTION_API_KEY",
    "ANTHROPIC_API_KEY",
    "OPENROUTER_API_KEY",
  ];
  const missing = criticalInProd.filter((k) => !env[k]);
  if (missing.length > 0) {
    console.warn(
      `[env] Variáveis críticas em produção não definidas: ${missing.join(", ")}. Algumas funcionalidades podem falhar.`,
    );
  }
}

/**
 * Verifica em RUNTIME (não em build) se uma env obrigatória em prod foi definida.
 * Usar dentro de handlers/jobs antes de tocar o recurso correspondente.
 *
 * Não roda no build (`next build`) porque variáveis de runtime de prod podem
 * não estar disponíveis na máquina de CI.
 */
export function assertProdEnv(...keys: Array<keyof Env>): void {
  if (!isProdRuntime) return;
  const missing = keys.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Variáveis obrigatórias em produção não definidas: ${missing.join(", ")}`,
    );
  }
}

export const isProductionRuntime = isProdRuntime;
