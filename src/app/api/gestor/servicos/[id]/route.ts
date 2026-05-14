import {
  enforceRateLimit,
  extractId,
  handleError,
  noContent,
  ok,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { bumpTags, tenantTags } from "@/server/lib/cache-tags";
import { servicoRepo } from "@/server/repositories/servico.repo";
import { atualizarServicoSchema } from "@/server/validators/servico.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const id = await extractId(params);
    const body = await parseBody(req, atualizarServicoSchema);
    const view = await servicoRepo.update(id, ctx.estabelecimentoId, body);
    bumpTags(tenantTags.servicos(ctx.estabelecimentoId));
    return ok(view);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const id = await extractId(params);
    await servicoRepo.softDelete(id, ctx.estabelecimentoId);
    bumpTags(tenantTags.servicos(ctx.estabelecimentoId));
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
