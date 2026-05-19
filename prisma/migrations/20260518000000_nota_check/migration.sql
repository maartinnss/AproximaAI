-- Garante nota entre 1 e 5 no banco de dados (PostgreSQL CHECK constraint).
-- Prisma não gera CHECK constraints nativamente; adicionado manualmente.
ALTER TABLE "avaliacao"
  ADD CONSTRAINT "avaliacao_nota_range_check" CHECK ("nota" >= 1 AND "nota" <= 5);
