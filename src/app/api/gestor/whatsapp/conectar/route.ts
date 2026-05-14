import {
  handleError,
  ok,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { db } from "@/server/db/client";
import {
  createInstance,
  deleteInstance,
  getConnectionState,
} from "@/server/lib/evolution";

type QrCode = { base64?: string; code?: string };

// Evolution retorna o QR na resposta do createInstance.
// O endpoint GET /instance/connect/{name} retorna {"count":0} — não usado.
async function obterQrFresco(instanceName: string): Promise<QrCode> {
  await deleteInstance(instanceName).catch(() => null);
  // Aguarda Baileys limpar sessão antes de recriar.
  await new Promise((r) => setTimeout(r, 1500));
  const result = await createInstance(instanceName);
  return result?.qrcode ?? {};
}

// GET — retorna estado + QR se desconectado
export async function GET() {
  try {
    const ctx = await requireGestorContext();
    const est = await db.estabelecimento.findFirst({
      where: { id: ctx.estabelecimentoId },
      select: { slug: true, evolutionInstanceName: true },
    });
    if (!est) return handleError(new Error("Estabelecimento não encontrado"));

    const instanceName = est.slug;
    const { state } = await getConnectionState(instanceName).catch(() => ({ state: "close" }));

    if (state === "open") {
      return ok({ conectado: true, estado: state });
    }

    // Tenta criar instância — se já existe, Evolution retorna erro (capturado).
    // O QR vem na resposta do create; se falhar tenta deletar+recriar.
    let qr: QrCode = {};
    const createResult = await createInstance(instanceName).catch(() => null);
    if (createResult?.qrcode?.base64) {
      qr = createResult.qrcode;
    } else {
      // Instância já existia sem QR disponível — força recriação.
      qr = await obterQrFresco(instanceName).catch(() => ({}));
    }

    if (!est.evolutionInstanceName) {
      await db.estabelecimento.update({
        where: { id: ctx.estabelecimentoId },
        data: { evolutionInstanceName: instanceName },
      });
    }

    return ok({ conectado: false, estado: state, qrcode: qr });
  } catch (err) {
    return handleError(err);
  }
}

// POST — força reconexão (botão "Gerar novo QR")
export async function POST() {
  try {
    const ctx = await requireGestorContext();
    const est = await db.estabelecimento.findFirst({
      where: { id: ctx.estabelecimentoId },
      select: { slug: true },
    });
    if (!est) return handleError(new Error("Estabelecimento não encontrado"));

    const instanceName = est.slug;
    const qr = await obterQrFresco(instanceName);

    await db.estabelecimento.update({
      where: { id: ctx.estabelecimentoId },
      data: { evolutionInstanceName: instanceName },
    });

    return ok({ qrcode: qr }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
