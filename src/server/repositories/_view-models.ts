/**
 * View models — projeções dos modelos Prisma para o que a UI consome.
 *
 * Mantém compatibilidade visual com o que o mock entregava (avatar de
 * iniciais computado, preço em reais decimais, etc) sem vazar Decimal e
 * tipos Prisma para Client Components.
 */
import type {
  Agendamento,
  Avaliacao,
  Cliente,
  Estabelecimento,
  Notificacao,
  Profissional,
  Servico,
} from "@prisma/client";

export type EstabelecimentoView = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  endereco: string;
  telefone: string;
  email: string;
  categoria: string;
  logo: string;
  notaMedia: number;
  totalAvaliacoes: number;
  locale: string;
  currency: string;
  timezone: string;
  janelaCancelamentoHoras: number;
  horarioFuncionamento: { abertura: string; fechamento: string; diasSemana: number[] };
};

export type ProfissionalView = {
  id: string;
  estabelecimentoId: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  avatar: string;
  ativo: boolean;
};

export type ServicoView = {
  id: string;
  estabelecimentoId: string;
  nome: string;
  descricao: string;
  preco: number;
  duracao: number;
  ativo: boolean;
};

export type AgendamentoView = {
  id: string;
  estabelecimentoId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  data: string;
  hora: string;
  inicioEm: string;
  fimEm: string;
  status: "pendente" | "confirmado" | "concluido" | "cancelado" | "no_show";
  observacoes?: string;
  motivoCancelamento?: string;
  servico: { id: string; nome: string; preco: number; duracao: number };
  profissional: { id: string; nome: string; avatar: string };
};

export type NotificacaoView = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: "info" | "sucesso" | "alerta" | "aviso";
  data: string;
  lida: boolean;
  icone?: string;
};

export type AvaliacaoView = {
  id: string;
  clienteNome: string;
  clienteAvatar: string;
  nota: number;
  comentario: string;
  data: string;
};

// ─── Helpers ───

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function toDateString(d: Date, timezone: string): string {
  // 'YYYY-MM-DD' no fuso do estabelecimento
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function toTimeString(d: Date, timezone: string): string {
  // 'HH:mm' no fuso do estabelecimento
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(d);
}

// ─── Transformers ───

export function toEstabelecimentoView(e: Estabelecimento): EstabelecimentoView {
  const horario = e.horarioFuncionamento as {
    abertura: string;
    fechamento: string;
    diasSemana: number[];
  };
  return {
    id: e.id,
    nome: e.nome,
    slug: e.slug,
    descricao: e.descricao,
    endereco: e.endereco,
    telefone: e.telefone,
    email: e.email,
    categoria: e.categoria,
    logo: iniciais(e.nome),
    notaMedia: Number(e.notaMedia),
    totalAvaliacoes: e.totalAvaliacoes,
    locale: e.locale,
    currency: e.currency,
    timezone: e.timezone,
    janelaCancelamentoHoras: e.janelaCancelamentoHoras,
    horarioFuncionamento: horario,
  };
}

export function toProfissionalView(p: Profissional): ProfissionalView {
  return {
    id: p.id,
    estabelecimentoId: p.estabelecimentoId,
    nome: p.nome,
    especialidade: p.especialidade,
    telefone: p.telefone,
    email: p.email,
    avatar: iniciais(p.nome),
    ativo: p.ativo,
  };
}

export function toServicoView(s: Servico): ServicoView {
  return {
    id: s.id,
    estabelecimentoId: s.estabelecimentoId,
    nome: s.nome,
    descricao: s.descricao,
    preco: s.precoCentavos / 100,
    duracao: s.duracaoMinutos,
    ativo: s.ativo,
  };
}

export type AgendamentoFull = Agendamento & {
  cliente: Pick<Cliente, "id" | "nome" | "telefoneE164" | "email">;
  servico: Pick<Servico, "id" | "nome" | "precoCentavos" | "duracaoMinutos">;
  profissional: Pick<Profissional, "id" | "nome">;
};

export function toAgendamentoView(
  a: AgendamentoFull,
  timezone: string,
): AgendamentoView {
  return {
    id: a.id,
    estabelecimentoId: a.estabelecimentoId,
    clienteId: a.clienteId,
    clienteNome: a.cliente.nome ?? "Cliente",
    clienteTelefone: a.cliente.telefoneE164,
    clienteEmail: a.cliente.email ?? "",
    data: toDateString(a.inicioEm, timezone),
    hora: toTimeString(a.inicioEm, timezone),
    inicioEm: a.inicioEm.toISOString(),
    fimEm: a.fimEm.toISOString(),
    status: a.status,
    observacoes: a.observacoes ?? undefined,
    motivoCancelamento: a.motivoCancelamento ?? undefined,
    servico: {
      id: a.servico.id,
      nome: a.servico.nome,
      preco: a.precoCentavosSnapshot / 100,
      duracao: a.duracaoMinutosSnapshot,
    },
    profissional: {
      id: a.profissional.id,
      nome: a.profissional.nome,
      avatar: iniciais(a.profissional.nome),
    },
  };
}

export function toNotificacaoView(n: Notificacao): NotificacaoView {
  return {
    id: n.id,
    titulo: n.titulo,
    mensagem: n.mensagem,
    tipo: n.tipo,
    data: n.createdAt.toISOString(),
    lida: n.lida,
    icone: n.icone ?? undefined,
  };
}

export type AvaliacaoFull = Avaliacao & {
  cliente: Pick<Cliente, "nome">;
};

export function toAvaliacaoView(a: AvaliacaoFull): AvaliacaoView {
  const nome = a.cliente.nome ?? "Anônimo";
  return {
    id: a.id,
    clienteNome: nome,
    clienteAvatar: iniciais(nome),
    nota: a.nota,
    comentario: a.comentario,
    data: a.createdAt.toISOString(),
  };
}

export { iniciais, toDateString, toTimeString };
