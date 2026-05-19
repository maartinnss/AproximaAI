import { z } from "zod";

export const registroSchema = z.object({
  nomeGestor: z.string().min(2).max(120),
  email: z.email(),
  senha: z.string().min(8).max(100),
  nomeEstabelecimento: z.string().min(2).max(120),
  categoria: z.enum(["barbearia", "salao", "clinica", "estetica", "outro"]),
  telefone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10, "Telefone deve ter ao menos 10 dígitos").max(13, "Telefone inválido")),
  endereco: z.string().min(5).max(255),
});

export type RegistroInput = z.infer<typeof registroSchema>;
