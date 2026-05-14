import {
  enforceRateLimit,
  handleError,
  ok,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { bumpTags, tenantTags } from "@/server/lib/cache-tags";
import { agendamentoRepo } from "@/server/repositories/agendamento.repo";
import { estabelecimentoRepo } from "@/server/repositories/estabelecimento.repo";
import { agendamentoService } from "@/server/services/agendamento.service";
import { criarAgendamentoSchema } from "@/server/validators/agendamento.schema";

export async function GET(req: Request) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx, "gestorRead");
    const est = await estabelecimentoRepo.requireById(ctx.estabelecimentoId);
    const url = new URL(req.url);
    const statusParam = url.searchParams.getAll("status");
    const list = await agendamentoRepo.listByEstabelecimento(
      ctx.estabelecimentoId,
      est.timezone,
      statusParam.length ? { status: statusParam } : {},
    );
    return ok(list);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const body = await parseBody(req, criarAgendamentoSchema);
    const view = await agendamentoService.criar(ctx.estabelecimentoId, body);
    bumpTags(
      tenantTags.agendamentos(ctx.estabelecimentoId),
      tenantTags.dashboard(ctx.estabelecimentoId),
    );
    return ok(view, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
