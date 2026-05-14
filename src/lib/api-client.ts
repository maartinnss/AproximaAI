/**
 * Cliente HTTP para chamadas internas a `/api/gestor/*`.
 *
 * Centraliza:
 *   - serialização JSON
 *   - parse de erro no formato `{ error: { code, message } }` do `api-helpers`
 *   - tratamento de 204 No Content
 *   - exceção tipada (`ApiClientError`) com `status` e `code`
 *
 * Usar nos Client Components em vez de `fetch` direto para garantir mensagens
 * consistentes de erro (gestor vê "telefone duplicado" em vez de "Erro ao salvar").
 */
type ApiErrorPayload = { error?: { code?: string; message?: string } };

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  /** Quando definido, é serializado como JSON e o Content-Type é setado. */
  json?: unknown;
};

export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  };

  const res = await fetch(url, init);

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  const parsed: unknown = contentType.includes("application/json") && text
    ? safeJsonParse(text)
    : text;

  if (!res.ok) {
    const payload = (parsed as ApiErrorPayload) ?? {};
    throw new ApiClientError(
      res.status,
      payload.error?.code ?? "unknown_error",
      payload.error?.message ?? `Erro ${res.status}`,
    );
  }

  return parsed as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Mensagem amigável para exibir em UI (toast/alert/inline). */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}
