-- Limita ai_persona a 2000 caracteres no banco (alinhado com validação Zod na API).
-- Seguro: dados existentes já foram validados com max(2000) pelo endpoint /configurar.
ALTER TABLE "estabelecimento"
  ALTER COLUMN "ai_persona" TYPE VARCHAR(2000);
