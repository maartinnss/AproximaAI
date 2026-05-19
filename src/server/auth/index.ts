/**
 * Full NextAuth config with Credentials providers and Prisma access.
 * NOT edge-safe — only used in Node runtime (Route Handlers, Server Components).
 *
 * Apenas o perfil "gestor" possui login web. Cliente final interage só via WhatsApp.
 */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { z } from "zod";

import { db } from "../db/client";
import { checkRateLimit } from "../lib/rate-limit";
import { authConfig } from "./config";

const credentialsSchema = z.object({
  email: z.email(),
  senha: z.string().min(1),
});

class InvalidCredentials extends CredentialsSignin {
  code = "credentials_invalidas";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "gestor-credentials",
      name: "Gestor",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();

        const ip =
          request?.headers?.get("cf-connecting-ip") ??
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const rl = await checkRateLimit(`login:${ip}`, 10, 300_000);
        if (!rl.ok) throw new InvalidCredentials();

        const user = await db.usuarioGestor.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) throw new InvalidCredentials();

        const ok = await verify(user.senhaHash, parsed.data.senha);
        if (!ok) throw new InvalidCredentials();

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: "gestor" as const,
          estabelecimentoId: user.estabelecimentoId,
          locale: user.locale,
        };
      },
    }),
  ],
});
