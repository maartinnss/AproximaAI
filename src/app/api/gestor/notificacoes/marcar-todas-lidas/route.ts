import {
  enforceRateLimit,
  handleError,
  noContent,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { notificacaoRepo } from "@/server/repositories/notificacao.repo";

export async function POST() {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    await notificacaoRepo.marcarTodasComoLidas(ctx.estabelecimentoId);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
