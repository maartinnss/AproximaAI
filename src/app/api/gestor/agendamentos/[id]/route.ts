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
import { agendamentoService } from "@/server/services/agendamento.service";
import { atualizarAgendamentoSchema } from "@/server/validators/agendamento.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const id = await extractId(params);
    const body = await parseBody(req, atualizarAgendamentoSchema);
    const view = await agendamentoService.atualizar(id, ctx.estabelecimentoId, body);
    bumpTags(
      tenantTags.agendamentos(ctx.estabelecimentoId),
      tenantTags.dashboard(ctx.estabelecimentoId),
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
    await agendamentoService.excluir(id, ctx.estabelecimentoId);
    bumpTags(
      tenantTags.agendamentos(ctx.estabelecimentoId),
      tenantTags.dashboard(ctx.estabelecimentoId),
    );
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
