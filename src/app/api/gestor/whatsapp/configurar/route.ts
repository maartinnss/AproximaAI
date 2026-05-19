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
  aiPersona: z
    .string()
    .max(2000)
    .transform((v) => v.replace(/<[^>]*>/g, "").trim())
    .nullable()
    .optional(),
  whatsappPhoneNumberId: z.string().max(40).nullable().optional(),
  whatsappDisplayPhone: z.string().max(30).nullable().optional(),
});

export async function PATCH(req: Request) {
  try {
    const ctx = await requireGestorContext();
    const body = await parseBody(req, schema);

    const data: Record<string, unknown> = {};
    if (body.aiEnabled !== undefined) data.aiEnabled = body.aiEnabled;
    if (body.aiPersona !== undefined) data.aiPersona = body.aiPersona;
    if (body.whatsappPhoneNumberId !== undefined) data.whatsappPhoneNumberId = body.whatsappPhoneNumberId;
    if (body.whatsappDisplayPhone !== undefined) data.whatsappDisplayPhone = body.whatsappDisplayPhone;

    const select = {
      aiEnabled: true,
      aiPersona: true,
      whatsappPhoneNumberId: true,
      whatsappDisplayPhone: true,
    };

    if (Object.keys(data).length === 0) {
      const est = await db.estabelecimento.findFirst({
        where: { id: ctx.estabelecimentoId },
        select,
      });
      return ok(est);
    }

    const updated = await db.estabelecimento.update({
      where: { id: ctx.estabelecimentoId },
      data,
      select,
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
