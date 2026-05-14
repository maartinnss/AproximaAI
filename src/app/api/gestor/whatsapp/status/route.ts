import { handleError, ok, requireGestorContext } from "@/server/lib/api-helpers";
import { db } from "@/server/db/client";
import { getConnectionState } from "@/server/lib/evolution";

export async function GET() {
  try {
    const ctx = await requireGestorContext();
    const est = await db.estabelecimento.findFirst({
      where: { id: ctx.estabelecimentoId },
      select: { slug: true, whatsappPhoneNumberId: true, evolutionInstanceName: true },
    });
    if (!est) return handleError(new Error("Estabelecimento não encontrado"));

    const instanceName = est.evolutionInstanceName ?? est.slug;
    const { state } = await getConnectionState(instanceName).catch(() => ({ state: "close" }));

    return ok({
      // Campos top-level: backward compat com WhatsappClient
      conectado: state === "open",
      estado: state,
      instancia: instanceName,
      // Providers detalhados
      providers: {
        evolution: {
          conectado: state === "open",
          estado: state,
          instancia: instanceName,
        },
        meta: est.whatsappPhoneNumberId
          ? { configurado: true, phoneNumberId: est.whatsappPhoneNumberId }
          : { configurado: false },
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
