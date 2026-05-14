import { z } from "zod";

import {
  handleError,
  ok,
  parseBody,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { db } from "@/server/db/client";

const schema = z.object({
  aiEnabled: z.boolean().optional(),
  aiPersona: z.string().max(2000).nullable().optional(),
});

export async function PATCH(req: Request) {
  try {
    const ctx = await requireGestorContext();
    const body = await parseBody(req, schema);

    const data: Record<string, unknown> = {};
    if (body.aiEnabled !== undefined) data.aiEnabled = body.aiEnabled;
    if (body.aiPersona !== undefined) data.aiPersona = body.aiPersona;

    if (Object.keys(data).length === 0) {
      const est = await db.estabelecimento.findFirst({
        where: { id: ctx.estabelecimentoId },
        select: { aiEnabled: true, aiPersona: true },
      });
      return ok(est);
    }

    const updated = await db.estabelecimento.update({
      where: { id: ctx.estabelecimentoId },
      data,
      select: { aiEnabled: true, aiPersona: true },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
