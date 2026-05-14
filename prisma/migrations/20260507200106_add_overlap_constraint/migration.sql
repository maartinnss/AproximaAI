-- Anti-overbooking: impede que o mesmo profissional tenha 2 agendamentos
-- ativos (pendente/confirmado) com janelas de tempo sobrepostas.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "agendamento"
ADD CONSTRAINT "agendamento_no_overlap_profissional"
EXCLUDE USING gist (
  "profissional_id" WITH =,
  tstzrange("inicio_em", "fim_em", '[)') WITH &&
)
WHERE (status IN ('pendente', 'confirmado'));
