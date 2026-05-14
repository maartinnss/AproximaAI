import {
  enforceRateLimit,
  handleError,
  ok,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { bumpTags, tenantTags } from "@/server/lib/cache-tags";
import { profissionalRepo } from "@/server/repositories/profissional.repo";
import { criarProfissionalSchema } from "@/server/validators/profissional.schema";

export async function POST(req: Request) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const body = await parseBody(req, criarProfissionalSchema);
    const view = await profissionalRepo.create({
      estabelecimentoId: ctx.estabelecimentoId,
      ...body,
    });
    bumpTags(
      tenantTags.profissionais(ctx.estabelecimentoId),
      tenantTags.agendamentos(ctx.estabelecimentoId),
    );
    return ok(view, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
