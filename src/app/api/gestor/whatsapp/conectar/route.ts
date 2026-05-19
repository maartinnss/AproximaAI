import {
  handleError,
  ok,
  requireGestorContext,
} from "@/server/lib/api-helpers";
import { db } from "@/server/db/client";
import { env } from "@/server/lib/env";
import {
  createInstance,
  deleteInstance,
  getConnectionState,
  restartInstance,
} from "@/server/lib/evolution";

type QrCode = { base64?: string; code?: string };

// Erro de rede (ECONNREFUSED, timeout) vs erro HTTP do Evolution.
// `request()` lança "Evolution API {status} ..." para erros HTTP.
// Erros de fetch (rede) têm mensagem diferente.
function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return !/^Evolution API \d+/.test(err.message);
}

// Nuke completo: só usar quando gestor pede QR novo explicitamente (POST).
async function forceNewQr(instanceName: string): Promise<QrCode> {
  await deleteInstance(instanceName).catch(() => null);
  await new Promise((r) => setTimeout(r, 800));
  const result = await createInstance(instanceName).catch((err) => {
    if (isNetworkError(err)) {
      throw new Error("Evolution API não está acessível. Verifique se o Docker está rodando.");
    }
    throw err;
  });
  return result?.qrcode ?? {};
}

// GET — retorna estado + QR se desconectado.
export async function GET() {
  try {
    if (!env.EVOLUTION_API_URL) {
      return ok({ conectado: false, estado: "close", qrcode: {}, evolutionNaoConfigurado: true });
    }

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

    if (state === "connecting") {
      return ok({ conectado: false, estado: state, qrcode: {} });
    }

    // Tenta criar nova instância (primeiro acesso ou instância deletada manualmente).
    let evolutionOffline = false;
    const createResult = await createInstance(instanceName).catch((err) => {
      if (isNetworkError(err)) evolutionOffline = true;
      return null;
    });

    if (evolutionOffline) {
      return ok({ conectado: false, estado: "close", qrcode: {}, evolutionIndisponivel: true });
    }

    if (createResult?.qrcode?.base64) {
      if (!est.evolutionInstanceName) {
        await db.estabelecimento.update({
          where: { id: ctx.estabelecimentoId },
          data: { evolutionInstanceName: instanceName },
        });
      }
      return ok({ conectado: false, estado: state, qrcode: createResult.qrcode });
    }

    // Instância já existe — fire-and-forget restart, retorna imediatamente.
    restartInstance(instanceName).catch(() => null);
    return ok({ conectado: false, estado: state, qrcode: {}, precisaReconectar: true });
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
    const qr = await forceNewQr(instanceName);

    await db.estabelecimento.update({
      where: { id: ctx.estabelecimentoId },
      data: { evolutionInstanceName: instanceName },
    });

    return ok({ qrcode: qr }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
