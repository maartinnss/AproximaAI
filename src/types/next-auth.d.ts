import type { DefaultSession } from "next-auth";

export type AppRole = "gestor";

declare module "next-auth" {
  interface User {
    role: AppRole;
    estabelecimentoId?: string;
    locale?: string;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      estabelecimentoId?: string;
      locale?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
    estabelecimentoId?: string;
    locale?: string;
  }
}
