/**
 * Edge proxy (Next 16 substitui middleware.ts).
 * Apenas autenticação — lógica de "qual rota é protegida" mora no callback
 * `authorized` em authConfig.
 *
 * Importa só `authConfig` (edge-safe), nunca `src/server/auth/index.ts`
 * (que carrega Prisma).
 */
import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/gestor/dashboard/:path*",
    "/gestor/agendamentos/:path*",
    "/gestor/calendario/:path*",
    "/gestor/profissionais/:path*",
    "/gestor/servicos/:path*",
    "/gestor/notificacoes/:path*",
    "/api/gestor/:path*",
  ],
};
