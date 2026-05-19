export async function register() {
  // Edge runtime não tem acesso ao Prisma/Node APIs — skip.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Fire-and-forget: não bloqueia startup.
  // Aguarda 8s para Evolution estar pronto antes de tentar reconectar.
  setTimeout(() => {
    reconnectWaInstances().catch(() => null);
  }, 8000);
}

async function reconnectWaInstances(): Promise<void> {
  const { db } = await import("./server/db/client");
  const { restartInstance, getConnectionState } = await import("./server/lib/evolution");

  let estabelecimentos: { evolutionInstanceName: string | null }[];
  try {
    estabelecimentos = await db.estabelecimento.findMany({
      where: { evolutionInstanceName: { not: null } },
      select: { evolutionInstanceName: true },
    });
  } catch (err) {
    console.warn("[instrumentation] DB indisponível — reconexão WhatsApp adiada.", err instanceof Error ? err.message : err);
    return;
  }

  if (estabelecimentos.length === 0) return;

  await Promise.allSettled(
    estabelecimentos.map(async (est) => {
      const name = est.evolutionInstanceName!;
      const { state } = await getConnectionState(name).catch(() => ({ state: "close" }));
      // Se já conectado ou reconectando, não intervém.
      if (state === "open" || state === "connecting") return;
      // Tenta restart — Evolution usa credenciais salvas no banco.
      await restartInstance(name).catch(() => null);
    }),
  );
}
