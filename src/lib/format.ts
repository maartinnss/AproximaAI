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

/**
 * Máscara BRL progressiva — ex: "5000" → "50,00", "150000" → "1.500,00".
 * Trata entrada como centavos à direita (estilo caixa registradora).
 */
export function maskBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte valor mascarado em centavos inteiros (ex: "1.500,00" → 150000). */
export function unmaskBRLCentavos(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Máscara para duração em minutos — só dígitos, até 3 chars (max 999 min).
 * Ex: "abc30x" → "30", "1200" → "120".
 */
export function maskMinutos(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 3);
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
