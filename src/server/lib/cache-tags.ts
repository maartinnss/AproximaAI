import "server-only";

import { revalidateTag } from "next/cache";

/**
 * Tags de cache escopadas por tenant.
 *
 * Use em conjunto com `unstable_cache` (ou `'use cache'` + `cacheTag`) nas
 * leituras, e `bumpTags` nas escritas, para invalidar cache APENAS do
 * tenant afetado — `revalidatePath` invalida cross-tenant.
 */
export const tenantTags = {
  agendamentos: (estabelecimentoId: string) =>
    `tenant:${estabelecimentoId}:agendamentos`,
  dashboard: (estabelecimentoId: string) =>
    `tenant:${estabelecimentoId}:dashboard`,
  profissionais: (estabelecimentoId: string) =>
    `tenant:${estabelecimentoId}:profissionais`,
  servicos: (estabelecimentoId: string) =>
    `tenant:${estabelecimentoId}:servicos`,
  notificacoes: (estabelecimentoId: string) =>
    `tenant:${estabelecimentoId}:notificacoes`,
};

/**
 * Invalida cache imediatamente (Next 16 exige profile como 2º arg em
 * `revalidateTag`; usamos `"max"` para expiração imediata sem SWR).
 */
export function bumpTags(...tags: string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
}
