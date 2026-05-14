import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "../lib/env";

declare global {
  var __prisma: PrismaClient | undefined;
}

function makeClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const db = globalThis.__prisma ?? makeClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
