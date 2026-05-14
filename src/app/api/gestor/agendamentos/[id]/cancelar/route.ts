import {
  enforceRateLimit,
  extractId,
  handleError,
  noContent,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { bumpTags, tenantTags } from "@/server/lib/cache-tags";
import { agendamentoService } from "@/server/services/agendamento.service";
import { cancelarAgendamentoSchema } from "@/server/validators/agendamento.schema";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const ctx = await requireGestorContext();
    await enforceRateLimit(ctx);
    const id = await extractId(params);
    const { motivo } = await parseBody(req, cancelarAgendamentoSchema);
    await agendamentoService.cancelar(id, ctx.estabelecimentoId, motivo);
    bumpTags(
      tenantTags.agendamentos(ctx.estabelecimentoId),
      tenantTags.dashboard(ctx.estabelecimentoId),
    );
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
