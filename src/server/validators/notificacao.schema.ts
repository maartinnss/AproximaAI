import { z } from "zod";

export const marcarLidaSchema = z.object({
  id: z.uuid(),
});

export type MarcarLidaInput = z.infer<typeof marcarLidaSchema>;
