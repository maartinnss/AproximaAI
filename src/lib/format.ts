/**
 * Telefone BR — formato (XX) XXXX-XXXX (fixo) ou (XX) XXXXX-XXXX (celular).
 * Aceita string com qualquer sujeira; aplica máscara progressiva enquanto digita.
 */
export function maskTelefoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/** Retorna só dígitos (útil pra envio ao backend). */
export function unmaskTelefone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Iniciais de um nome — até 2 letras (ex: "Maria Silva" → "MS"). */
export function iniciaisAvatar(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
