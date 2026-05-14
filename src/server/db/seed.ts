/**
 * Seed do banco a partir de src/data/mock.ts
 *
 * - UUIDs determinísticos via uuidv5(seed, NAMESPACE) → re-rodar é idempotente.
 * - Preços convertidos de reais (mock) para centavos.
 * - data + hora (string) combinados em inicio_em (timestamptz America/Sao_Paulo).
 * - Cada profissional habilitado em todos os serviços do seu estabelecimento.
 * - Credenciais de gestor/cliente recebem hash argon2id.
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) loadEnv({ path: ".env.local" });
loadEnv();

// Gate de segurança: mock contém senhas demo "123456". Nunca rodar em prod
// sem flag explícita. Se necessário (staging com credenciais demo), defina
// `ALLOW_DEMO_SEED=true` no ambiente.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error(
    "[seed] bloqueado em NODE_ENV=production. Defina ALLOW_DEMO_SEED=true para forçar.",
  );
  process.exit(1);
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { v5 as uuidv5 } from "uuid";

import {
  estabelecimentos,
  profissionais,
  servicos,
  clientes,
  agendamentos,
  avaliacoes,
  notificacoes,
  credenciaisGestores,
  credenciaisClientes,
} from "../../data/mock";

const NAMESPACE = "6f9b7c2e-1d8a-4e3b-9c5f-2a3b4c5d6e7f";
const id = (seed: string) => uuidv5(seed, NAMESPACE);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// 'YYYY-MM-DD' + 'HH:mm' (assume tz America/Sao_Paulo, offset -03:00)
function toUTC(dataStr: string, horaStr: string): Date {
  return new Date(`${dataStr}T${horaStr}:00-03:00`);
}

/**
 * Normaliza telefone do mock para E.164.
 * Mock pode entregar:
 *   - "(11) 98765-0001" (sem DDI)
 *   - "11987650001" (sem DDI)
 *   - "5511987650001" (com DDI já)
 *   - "+5511987650001" (já E.164)
 * Sem essa função, `replace(/^/, "+55")` em "5511..." viraria "+555511..." (bug).
 */
function toE164BR(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  return `+55${digits}`;
}

const STATUS_MAP = {
  confirmado: "confirmado",
  pendente: "pendente",
  concluido: "concluido",
  cancelado: "cancelado",
} as const;

async function main() {
  console.log("→ limpando tabelas operacionais (mantém schema)…");
  await db.$transaction([
    db.agenteAcaoLog.deleteMany(),
    db.waMessage.deleteMany(),
    db.waSession.deleteMany(),
    db.waTemplate.deleteMany(),
    db.idempotencyKey.deleteMany(),
    db.assinatura.deleteMany(),
    db.notificacao.deleteMany(),
    db.avaliacao.deleteMany(),
    db.agendamento.deleteMany(),
    db.usuarioClienteWeb.deleteMany(),
    db.cliente.deleteMany(),
    db.usuarioGestor.deleteMany(),
    db.profissionalServico.deleteMany(),
    db.servico.deleteMany(),
    db.profissional.deleteMany(),
    db.estabelecimento.deleteMany(),
  ]);

  // ─── Estabelecimentos ───
  console.log("→ estabelecimentos");
  for (const e of estabelecimentos) {
    await db.estabelecimento.create({
      data: {
        id: id(`est:${e.id}`),
        slug: e.slug,
        nome: e.nome,
        descricao: e.descricao,
        endereco: e.endereco,
        telefone: e.telefone,
        email: e.email,
        categoria: e.categoria as never,
        horarioFuncionamento: e.horarioFuncionamento as never,
        notaMedia: e.notaMedia,
        totalAvaliacoes: e.totalAvaliacoes,
      },
    });
  }

  // ─── Profissionais ───
  console.log("→ profissionais");
  for (const p of profissionais) {
    await db.profissional.create({
      data: {
        id: id(`prof:${p.id}`),
        estabelecimentoId: id(`est:${p.estabelecimentoId}`),
        nome: p.nome,
        especialidade: p.especialidade,
        telefone: p.telefone,
        email: p.email,
        ativo: p.ativo,
      },
    });
  }

  // ─── Serviços ───
  console.log("→ serviços");
  for (const s of servicos) {
    await db.servico.create({
      data: {
        id: id(`serv:${s.id}`),
        estabelecimentoId: id(`est:${s.estabelecimentoId}`),
        nome: s.nome,
        descricao: s.descricao,
        precoCentavos: Math.round(s.preco * 100),
        duracaoMinutos: s.duracao,
      },
    });
  }

  // ─── ProfissionalServico (N:N) — todos × todos por estabelecimento ───
  console.log("→ profissional × serviço");
  for (const p of profissionais) {
    const servsDoEst = servicos.filter(
      (s) => s.estabelecimentoId === p.estabelecimentoId,
    );
    for (const s of servsDoEst) {
      await db.profissionalServico.create({
        data: {
          profissionalId: id(`prof:${p.id}`),
          servicoId: id(`serv:${s.id}`),
        },
      });
    }
  }

  // ─── Clientes ───
  console.log("→ clientes");
  for (const c of clientes) {
    await db.cliente.create({
      data: {
        id: id(`cli:${c.id}`),
        nome: c.nome,
        email: c.email,
        telefoneE164: toE164BR(c.telefone),
        origem: "web",
      },
    });
  }

  // ─── Usuários gestores (com hash argon2id) ───
  console.log("→ credenciais gestores");
  for (const g of credenciaisGestores) {
    const senhaHash = await hash(g.senha);
    await db.usuarioGestor.create({
      data: {
        id: id(`gestor:${g.email}`),
        estabelecimentoId: id(`est:${g.estabelecimentoId}`),
        nome: g.nomeGestor,
        email: g.email,
        senhaHash,
        role: "owner",
        emailVerificadoEm: new Date(),
      },
    });
  }

  // ─── Usuários cliente web ───
  console.log("→ credenciais clientes web");
  for (const cw of credenciaisClientes) {
    const senhaHash = await hash(cw.senha);
    await db.usuarioClienteWeb.create({
      data: {
        id: id(`cw:${cw.email}`),
        clienteId: id(`cli:${cw.clienteId}`),
        email: cw.email,
        senhaHash,
        emailVerificadoEm: new Date(),
      },
    });
  }

  // ─── Agendamentos ───
  console.log("→ agendamentos");
  for (const a of agendamentos) {
    const servicoMock = servicos.find((s) => s.id === a.servico.id)!;
    const inicio = toUTC(a.data, a.hora);
    const fim = new Date(inicio.getTime() + servicoMock.duracao * 60_000);
    const status = STATUS_MAP[a.status as keyof typeof STATUS_MAP];

    await db.agendamento.create({
      data: {
        id: id(`agd:${a.id}`),
        estabelecimentoId: id(`est:${a.estabelecimentoId}`),
        clienteId: id(`cli:${a.clienteId}`),
        servicoId: id(`serv:${a.servico.id}`),
        profissionalId: id(`prof:${a.profissional.id}`),
        inicioEm: inicio,
        fimEm: fim,
        status,
        origem: "web",
        precoCentavosSnapshot: Math.round(servicoMock.preco * 100),
        duracaoMinutosSnapshot: servicoMock.duracao,
        observacoes: a.observacoes ?? null,
        motivoCancelamento: a.motivoCancelamento ?? null,
        canceladoPor: a.motivoCancelamento ? "cliente" : null,
        canceladoEm: a.motivoCancelamento ? new Date() : null,
      },
    });
  }

  // ─── Avaliações ───
  console.log("→ avaliações");
  // Mock não vincula avaliação a agendamento; precisamos de um agendamento
  // concluído desse cliente nesse estabelecimento. Pegamos o mais recente.
  for (const av of avaliacoes) {
    const concluidoDoCliente = agendamentos.find(
      (a) =>
        a.clienteId === av.clienteId &&
        a.estabelecimentoId === av.estabelecimentoId &&
        a.status === "concluido",
    );
    if (!concluidoDoCliente) {
      console.warn(`  ! avaliação ${av.id} sem agendamento concluído — pulada`);
      continue;
    }
    await db.avaliacao.create({
      data: {
        id: id(`av:${av.id}`),
        agendamentoId: id(`agd:${concluidoDoCliente.id}`),
        clienteId: id(`cli:${av.clienteId}`),
        estabelecimentoId: id(`est:${av.estabelecimentoId}`),
        nota: av.nota,
        comentario: av.comentario,
        createdAt: new Date(av.data),
      },
    });
  }

  // ─── Notificações ───
  console.log("→ notificações");
  // Map mock → estabelecimento via mesmo mapeamento do mock.ts
  const notifMap: Record<string, string[]> = {
    "est-1": ["n1", "n2", "n3", "n4", "n5", "n6"],
    "est-2": ["n7", "n8", "n9"],
    "est-3": ["n10", "n11", "n12"],
  };
  for (const [estMockId, ids] of Object.entries(notifMap)) {
    for (const nid of ids) {
      const n = notificacoes.find((x) => x.id === nid);
      if (!n) continue;
      await db.notificacao.create({
        data: {
          id: id(`notif:${n.id}`),
          estabelecimentoId: id(`est:${estMockId}`),
          tipo: n.tipo as never,
          titulo: n.titulo,
          mensagem: n.mensagem,
          icone: n.icone ?? null,
          lida: n.lida,
          createdAt: new Date(n.data),
        },
      });
    }
  }

  // ─── Assinatura trial pra cada estabelecimento ───
  console.log("→ assinaturas (trial 14d)");
  const agora = new Date();
  const trialFim = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000);
  for (const e of estabelecimentos) {
    await db.assinatura.create({
      data: {
        id: id(`asg:${e.id}`),
        estabelecimentoId: id(`est:${e.id}`),
        status: "trialing",
        plano: "trial",
        trialFim,
      },
    });
  }

  console.log("✓ seed concluído.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
