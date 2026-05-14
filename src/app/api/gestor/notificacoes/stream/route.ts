import { handleError, requireGestorContext } from "@/server/lib/api-helpers";
import { channels, subscribeToChannel } from "@/server/lib/redis";

export const runtime = "nodejs";
// Não usar `dynamic = "force-dynamic"` — removido em Next 16 quando Cache
// Components ativo. SSE já é dinâmico por usar Redis subscriber.

export async function GET(req: Request) {
  try {
    const ctx = await requireGestorContext();
    const channel = channels.notificacoes(ctx.estabelecimentoId);
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        let unsubscribe: (() => Promise<void>) | null = null;
        let keepAlive: ReturnType<typeof setInterval> | null = null;

        const safeEnqueue = (data: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            closed = true;
          }
        };

        const cleanup = async () => {
          if (closed) return;
          closed = true;
          if (keepAlive) clearInterval(keepAlive);
          if (unsubscribe) {
            try {
              await unsubscribe();
            } catch {}
          }
          try {
            controller.close();
          } catch {}
        };

        // Browser desconectou (cliente fechou a aba / refresh / network drop)
        req.signal.addEventListener("abort", () => {
          void cleanup();
        });

        safeEnqueue(`event: ready\ndata: {}\n\n`);

        // Guard: abort pode ter disparado antes do subscribe (ex: redirect imediato).
        if (!closed) {
          unsubscribe = subscribeToChannel(channel, (payload) => {
            safeEnqueue(`event: notificacao\ndata: ${payload}\n\n`);
          });
        }

        keepAlive = setInterval(() => safeEnqueue(`: keep-alive\n\n`), 25_000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
