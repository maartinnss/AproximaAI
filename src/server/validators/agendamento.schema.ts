import { z } from "zod";

const STATUS = z.enum([
  "pendente",
  "confirmado",
  "concluido",
  "cancelado",
  "no_show",
]);

const DATA = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "data inválida (YYYY-MM-DD)")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d!));
    return (
      dt.getUTCFullYear() === y! &&
      dt.getUTCMonth() === m! - 1 &&
      dt.getUTCDate() === d!
    );
  }, "data não existe no calendário");

const HORA = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "hora inválida (HH:mm)")
  .refine((s) => {
    const [h, m] = s.split(":").map(Number);
    return h! >= 0 && h! <= 23 && m! >= 0 && m! <= 59;
  }, "hora fora do intervalo válido (00:00–23:59)");

export const atualizarAgendamentoSchema = z
  .object({
    data: DATA.optional(),
    hora: HORA.optional(),
    status: STATUS.optional(),
    profissionalId: z.uuid().optional(),
    servicoId: z.uuid().optional(),
    observacoes: z.string().max(2000).optional().nullable(),
    motivo: z.string().min(1).max(500).optional(),
  })
  .superRefine((val, ctx) => {
    // Cancelamento via PATCH precisa de motivo (alinhado com /cancelar).
    if (val.status === "cancelado" && !val.motivo?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["motivo"],
        message: "motivo é obrigatório ao cancelar",
      });
    }
  });

export const cancelarAgendamentoSchema = z.object({
  motivo: z.string().min(1).max(500),
});

const TELEFONE = z
  .string()
  .min(8)
  .max(20)
  .transform((raw, ctx) => {
    const trimmed = raw.trim();
    const hadPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");

    if (digits.length < 8 || digits.length > 15) {
      ctx.addIssue({
        code: "custom",
        message: "Telefone E.164 inválido (8 a 15 dígitos)",
      });
      return z.NEVER;
    }

    if (hadPlus) return `+${digits}`;
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
      return `+${digits}`;
    }
    return `+${digits}`;
  })
  .refine((v) => /^\+\d{10,15}$/.test(v), {
    message: "Telefone E.164 inválido",
  });

export const criarAgendamentoSchema = z.object({
  clienteNome: z.string().min(2).max(120),
  clienteTelefone: TELEFONE,
  clienteEmail: z.email().optional().nullable(),
  servicoId: z.uuid(),
  profissionalId: z.uuid(),
  data: DATA,
  hora: HORA,
  observacoes: z.string().max(2000).optional().nullable(),
});

export type AtualizarAgendamentoInput = z.infer<typeof atualizarAgendamentoSchema>;
export type CancelarAgendamentoInput = z.infer<typeof cancelarAgendamentoSchema>;
export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;
