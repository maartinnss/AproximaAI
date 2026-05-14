/**
 * Edge-safe NextAuth config (no Prisma / no Node-only deps).
 * Used by `middleware.ts` so the auth check runs at the edge.
 *
 * Only "gestor" role exists in the web UI. Cliente final só usa WhatsApp.
 */
import type { NextAuthConfig } from "next-auth";

import type { AppRole } from "@/types/next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.estabelecimentoId = user.estabelecimentoId;
        token.locale = user.locale;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as AppRole;
      session.user.estabelecimentoId = token.estabelecimentoId as string | undefined;
      session.user.locale = token.locale as string | undefined;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      const protectedGestor =
        pathname.startsWith("/gestor/dashboard") ||
        pathname.startsWith("/gestor/agendamentos") ||
        pathname.startsWith("/gestor/calendario") ||
        pathname.startsWith("/gestor/profissionais") ||
        pathname.startsWith("/gestor/servicos") ||
        pathname.startsWith("/gestor/notificacoes") ||
        pathname.startsWith("/gestor/whatsapp") ||
        pathname.startsWith("/api/gestor");

      if (protectedGestor) return role === "gestor";

      return true;
    },
  },
} satisfies NextAuthConfig;
