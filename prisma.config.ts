import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Carrega .env.local primeiro (convenção Next.js), depois .env como fallback.
// `dotenv` por padrão NÃO sobrescreve env vars já definidas no shell — então
// deploy em prod com env injetada externamente continua tendo prioridade.
if (existsSync(".env.local")) loadEnv({ path: ".env.local" });
loadEnv();

// Em Neon (prod) com PgBouncer: DATABASE_URL deve ser a URL direta (sem pooler)
// para migrations. Use DIRECT_URL no .env.worker/.env.vps quando necessário e
// passe-a aqui sobrescrevendo DATABASE_URL para o CLI do Prisma.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!migrationUrl) throw new Error("DATABASE_URL is required in prisma.config.ts");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    seed: "tsx src/server/db/seed.ts",
  },
});
