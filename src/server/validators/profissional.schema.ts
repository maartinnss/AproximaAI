import { z } from "zod";

export const criarProfissionalSchema = z.object({
  nome: z.string().min(2).max(120),
  especialidade: z.string().min(2).max(120),
  telefone: z.string().min(8).max(20).regex(/^\+?[\d\s\-().]+$/, "Telefone inválido — use apenas dígitos, espaços ou +()-. "),
  email: z.email(),
});

export const atualizarProfissionalSchema = criarProfissionalSchema
  .partial()
  .extend({ ativo: z.boolean().optional() });

export type CriarProfissionalInput = z.infer<typeof criarProfissionalSchema>;
export type AtualizarProfissionalInput = z.infer<typeof atualizarProfissionalSchema>;
