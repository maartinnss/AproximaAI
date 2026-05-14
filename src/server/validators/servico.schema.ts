import { z } from "zod";

export const criarServicoSchema = z.object({
  nome: z.string().min(2).max(120),
  descricao: z.string().min(2).max(1000),
  precoCentavos: z.number().int().nonnegative(),
  duracaoMinutos: z.number().int().min(5).max(600),
});

export const atualizarServicoSchema = criarServicoSchema
  .partial()
  .extend({ ativo: z.boolean().optional() });

export type CriarServicoInput = z.infer<typeof criarServicoSchema>;
export type AtualizarServicoInput = z.infer<typeof atualizarServicoSchema>;
