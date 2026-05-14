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
import { profissionalRepo } from "@/server/repositories/profissional.repo";
import { atualizarProfissionalSchema } from "@/server/validators/profissional.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const id = await extractId(params);
    const body = await parseBody(req, atualizarProfissionalSchema);
    const view = await profissionalRepo.update(id, ctx.estabelecimentoId, body);
    bumpTags(
      tenantTags.profissionais(ctx.estabelecimentoId),
      tenantTags.agendamentos(ctx.estabelecimentoId),
    );
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
    await profissionalRepo.softDelete(id, ctx.estabelecimentoId);
    bumpTags(
      tenantTags.profissionais(ctx.estabelecimentoId),
      tenantTags.agendamentos(ctx.estabelecimentoId),
    );
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
