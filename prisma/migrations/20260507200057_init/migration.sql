-- CreateEnum
CREATE TYPE "CategoriaEstabelecimento" AS ENUM ('barbearia', 'salao', 'clinica', 'estetica', 'outro');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado', 'no_show');

-- CreateEnum
CREATE TYPE "OrigemAgendamento" AS ENUM ('web', 'whatsapp', 'gestor', 'api');

-- CreateEnum
CREATE TYPE "CanceladoPor" AS ENUM ('cliente', 'gestor', 'sistema');

-- CreateEnum
CREATE TYPE "OrigemCliente" AS ENUM ('web', 'whatsapp', 'manual');

-- CreateEnum
CREATE TYPE "RoleGestor" AS ENUM ('owner', 'staff');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('info', 'sucesso', 'alerta', 'aviso');

-- CreateEnum
CREATE TYPE "StatusWaSession" AS ENUM ('ativa', 'aguardando_humano', 'encerrada');

-- CreateEnum
CREATE TYPE "DirecaoMensagem" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('text', 'template', 'interactive', 'audio', 'image', 'system');

-- CreateEnum
CREATE TYPE "CategoriaTemplate" AS ENUM ('utility', 'marketing', 'authentication');

-- CreateEnum
CREATE TYPE "StatusTemplate" AS ENUM ('approved', 'pending', 'rejected');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid');

-- CreateTable
CREATE TABLE "estabelecimento" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "categoria" "CategoriaEstabelecimento" NOT NULL,
    "horario_funcionamento" JSONB NOT NULL,
    "logo_url" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "whatsapp_phone_number_id" TEXT,
    "whatsapp_display_phone" TEXT,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ai_persona" TEXT,
    "max_msgs_dia" INTEGER NOT NULL DEFAULT 1000,
    "janela_cancelamento_horas" INTEGER NOT NULL DEFAULT 2,
    "nota_media" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "total_avaliacoes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "estabelecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "duracao_minutos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional_servico" (
    "profissional_id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,

    CONSTRAINT "profissional_servico_pkey" PRIMARY KEY ("profissional_id","servico_id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" UUID NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "telefone_e164" TEXT NOT NULL,
    "avatar_url" TEXT,
    "origem" "OrigemCliente" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_gestor" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "RoleGestor" NOT NULL DEFAULT 'owner',
    "email_verificado_em" TIMESTAMPTZ(6),
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuario_gestor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_cliente_web" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "email_verificado_em" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuario_cliente_web_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamento" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "inicio_em" TIMESTAMPTZ(6) NOT NULL,
    "fim_em" TIMESTAMPTZ(6) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'pendente',
    "origem" "OrigemAgendamento" NOT NULL DEFAULT 'web',
    "preco_centavos_snapshot" INTEGER NOT NULL,
    "duracao_minutos_snapshot" INTEGER NOT NULL,
    "observacoes" TEXT,
    "motivo_cancelamento" TEXT,
    "cancelado_por" "CanceladoPor",
    "cancelado_em" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL,
    "agendamento_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "nota" SMALLINT NOT NULL,
    "comentario" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "icone" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_session" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "wa_id" TEXT NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "status" "StatusWaSession" NOT NULL DEFAULT 'ativa',
    "contexto" JSONB DEFAULT '{}',
    "ultima_mensagem_em" TIMESTAMPTZ(6),
    "expira_em" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wa_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_message" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "direcao" "DirecaoMensagem" NOT NULL,
    "meta_message_id" TEXT NOT NULL,
    "tipo" "TipoMensagem" NOT NULL,
    "conteudo" JSONB NOT NULL,
    "custo_tokens" INTEGER,
    "modelo_llm" TEXT,
    "enviada_em" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_template" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "categoria" "CategoriaTemplate" NOT NULL,
    "status" "StatusTemplate" NOT NULL DEFAULT 'pending',
    "componentes" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wa_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agente_acao_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "ferramenta" TEXT NOT NULL,
    "argumentos" JSONB NOT NULL,
    "resultado" JSONB,
    "sucesso" BOOLEAN NOT NULL,
    "erro" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agente_acao_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_key" (
    "chave" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "resposta" JSONB,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_key_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "assinatura" (
    "id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'trialing',
    "plano" TEXT NOT NULL DEFAULT 'trial',
    "periodo_inicio" TIMESTAMPTZ(6),
    "periodo_fim" TIMESTAMPTZ(6),
    "trial_fim" TIMESTAMPTZ(6),
    "cancela_no_fim_periodo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estabelecimento_slug_key" ON "estabelecimento"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "estabelecimento_whatsapp_phone_number_id_key" ON "estabelecimento"("whatsapp_phone_number_id");

-- CreateIndex
CREATE INDEX "estabelecimento_categoria_idx" ON "estabelecimento"("categoria");

-- CreateIndex
CREATE INDEX "estabelecimento_slug_idx" ON "estabelecimento"("slug");

-- CreateIndex
CREATE INDEX "profissional_estabelecimento_id_ativo_idx" ON "profissional"("estabelecimento_id", "ativo");

-- CreateIndex
CREATE INDEX "servico_estabelecimento_id_ativo_idx" ON "servico"("estabelecimento_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_telefone_e164_key" ON "cliente"("telefone_e164");

-- CreateIndex
CREATE INDEX "cliente_email_idx" ON "cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_gestor_email_key" ON "usuario_gestor"("email");

-- CreateIndex
CREATE INDEX "usuario_gestor_estabelecimento_id_idx" ON "usuario_gestor"("estabelecimento_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cliente_web_cliente_id_key" ON "usuario_cliente_web"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cliente_web_email_key" ON "usuario_cliente_web"("email");

-- CreateIndex
CREATE INDEX "agendamento_estabelecimento_id_inicio_em_idx" ON "agendamento"("estabelecimento_id", "inicio_em" DESC);

-- CreateIndex
CREATE INDEX "agendamento_cliente_id_inicio_em_idx" ON "agendamento"("cliente_id", "inicio_em" DESC);

-- CreateIndex
CREATE INDEX "agendamento_profissional_id_inicio_em_idx" ON "agendamento"("profissional_id", "inicio_em");

-- CreateIndex
CREATE INDEX "agendamento_status_inicio_em_idx" ON "agendamento"("status", "inicio_em");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_agendamento_id_key" ON "avaliacao"("agendamento_id");

-- CreateIndex
CREATE INDEX "avaliacao_estabelecimento_id_created_at_idx" ON "avaliacao"("estabelecimento_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notificacao_estabelecimento_id_lida_created_at_idx" ON "notificacao"("estabelecimento_id", "lida", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wa_session_wa_id_phone_number_id_idx" ON "wa_session"("wa_id", "phone_number_id");

-- CreateIndex
CREATE INDEX "wa_session_estabelecimento_id_status_idx" ON "wa_session"("estabelecimento_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wa_message_meta_message_id_key" ON "wa_message"("meta_message_id");

-- CreateIndex
CREATE INDEX "wa_message_session_id_enviada_em_idx" ON "wa_message"("session_id", "enviada_em" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "wa_template_nome_key" ON "wa_template"("nome");

-- CreateIndex
CREATE INDEX "agente_acao_log_session_id_created_at_idx" ON "agente_acao_log"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idempotency_key_expira_em_idx" ON "idempotency_key"("expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_estabelecimento_id_key" ON "assinatura"("estabelecimento_id");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_stripe_customer_id_key" ON "assinatura"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_stripe_subscription_id_key" ON "assinatura"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "assinatura_status_idx" ON "assinatura"("status");

-- AddForeignKey
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico" ADD CONSTRAINT "servico_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_servico" ADD CONSTRAINT "profissional_servico_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_servico" ADD CONSTRAINT "profissional_servico_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_gestor" ADD CONSTRAINT "usuario_gestor_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cliente_web" ADD CONSTRAINT "usuario_cliente_web_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_session" ADD CONSTRAINT "wa_session_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_session" ADD CONSTRAINT "wa_session_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_message" ADD CONSTRAINT "wa_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "wa_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agente_acao_log" ADD CONSTRAINT "agente_acao_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "wa_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
