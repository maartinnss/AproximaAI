/**
 * Session helpers para Server Components / Route Handlers.
 *
 * Apenas gestor — cliente final não tem login web (WhatsApp-only).
 *
 * `requireGestor` é envolto em `cache()` do React: páginas + Header chamando
 * em cascata na mesma request fazem 1 lookup de sessão, não N.
 */
import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "./index";

export type GestorContext = {
  userId: string;
  estabelecimentoId: string;
  email: string;
  nome: string;
  locale: string;
};

export const requireGestor = cache(async (): Promise<GestorContext> => {
  const session = await auth();

  if (!session?.user || session.user.role !== "gestor" || !session.user.estabelecimentoId) {
    redirect("/");
  }

  return {
    userId: session.user.id,
    estabelecimentoId: session.user.estabelecimentoId,
    email: session.user.email ?? "",
    nome: session.user.name ?? "",
    locale: session.user.locale ?? "pt-BR",
  };
});

export const getOptionalSession = cache(async () => {
  return await auth();
});
