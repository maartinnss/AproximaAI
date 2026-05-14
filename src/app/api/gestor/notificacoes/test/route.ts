/**
 * Endpoint de debug — publica notificação de teste no canal Redis do estabelecimento.
 * Bloqueado em produção.
 */
import { env } from "@/server/lib/env";
import {
  enforceRateLimit,
  handleError,
  jsonError,
  ok,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { notificacaoService } from "@/server/services/notificacao.service";

export async function POST() {
  if (env.NODE_ENV === "production") {
    return jsonError(404, "not_found", "Not found");
  }
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx, "debug");
    const view = await notificacaoService.criar({
      estabelecimentoId: ctx.estabelecimentoId,
      tipo: "info",
      titulo: "Teste de notificação",
      mensagem: `Disparado às ${new Date().toLocaleTimeString("pt-BR")}`,
      icone: "Info",
    });
    return ok(view);
  } catch (err) {
    return handleError(err);
  }
}
