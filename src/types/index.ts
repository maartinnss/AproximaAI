// ─── Estabelecimento ───

export type CategoriaEstabelecimento = 'barbearia' | 'salao' | 'clinica' | 'estetica' | 'outro';

export interface HorarioFuncionamento {
  abertura: string;
  fechamento: string;
  diasSemana: number[]; // 0 = dom, 1 = seg, ...6 = sab
}

export interface Estabelecimento {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  endereco: string;
  telefone: string;
  email: string;
  categoria: CategoriaEstabelecimento;
  horarioFuncionamento: HorarioFuncionamento;
  logo: string; // iniciais
  notaMedia: number;
  totalAvaliacoes: number;
}

// ─── Profissional ───

export interface Profissional {
  id: string;
  estabelecimentoId: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  avatar: string;
  ativo: boolean;
}

// ─── Serviço ───

export interface Servico {
  id: string;
  estabelecimentoId: string;
  nome: string;
  descricao: string;
  preco: number;
  duracao: number; // em minutos
}

// ─── Agendamento ───

export type StatusAgendamento = 'confirmado' | 'pendente' | 'concluido' | 'cancelado' | 'no_show';

export interface Agendamento {
  id: string;
  estabelecimentoId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  servico: Servico;
  profissional: Profissional;
  data: string;
  hora: string;
  status: StatusAgendamento;
  observacoes?: string;
  motivoCancelamento?: string;
}

// ─── Cliente ───

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  avatar: string;
}

// ─── Avaliação ───

export interface Avaliacao {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteAvatar: string;
  estabelecimentoId: string;
  nota: number; // 1–5
  comentario: string;
  data: string;
}

// ─── Notificação ───

export type TipoNotificacao = 'info' | 'sucesso' | 'alerta' | 'aviso';

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  data: string; // ISO date string
  lida: boolean;
  icone?: string; // nome do ícone lucide
}

// ─── Credenciais ───

export interface CredenciaisGestor {
  email: string;
  senha: string;
  nomeGestor: string;
  estabelecimentoId: string;
}

export interface CredenciaisCliente {
  email: string;
  senha: string;
  clienteId: string;
}

// ─── Gráficos (gestor) ───

export interface DadosGrafico {
  nome: string;
  atendimentos: number;
  receita: number;
}

export interface DadosServicosGrafico {
  nome: string;
  valor: number;
  cor: string;
}
