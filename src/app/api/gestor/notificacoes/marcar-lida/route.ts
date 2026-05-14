import {
  enforceRateLimit,
  handleError,
  noContent,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { notificacaoRepo } from "@/server/repositories/notificacao.repo";
import { marcarLidaSchema } from "@/server/validators/notificacao.schema";

export async function POST(req: Request) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const { id } = await parseBody(req, marcarLidaSchema);
    await notificacaoRepo.marcarComoLida(id, ctx.estabelecimentoId);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
