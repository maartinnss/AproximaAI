import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @node-rs/argon2 é módulo nativo (.node binary) — não pode ser bundled pelo Next.js.
  // @prisma/client e pg: melhor deixar como external para evitar conflitos de singleton.
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
