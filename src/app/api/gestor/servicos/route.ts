import {
  enforceRateLimit,
  handleError,
  ok,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { bumpTags, tenantTags } from "@/server/lib/cache-tags";
import { servicoRepo } from "@/server/repositories/servico.repo";
import { criarServicoSchema } from "@/server/validators/servico.schema";

export async function POST(req: Request) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const body = await parseBody(req, criarServicoSchema);
    const view = await servicoRepo.create({
      estabelecimentoId: ctx.estabelecimentoId,
      ...body,
    });
    bumpTags(tenantTags.servicos(ctx.estabelecimentoId));
    return ok(view, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
