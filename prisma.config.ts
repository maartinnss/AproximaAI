import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Carrega .env.local primeiro (convenção Next.js), depois .env como fallback.
// `dotenv` por padrão NÃO sobrescreve env vars já definidas no shell — então
// deploy em prod com env injetada externamente continua tendo prioridade.
if (existsSync(".env.local")) loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx src/server/db/seed.ts",
  },
});
