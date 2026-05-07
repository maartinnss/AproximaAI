import {
  Estabelecimento, Profissional, Servico, Agendamento,
  Cliente, Avaliacao, CredenciaisGestor, CredenciaisCliente,
  DadosGrafico, DadosServicosGrafico, Notificacao,
} from '@/types';

// ═══════════════════════════════════════
// ESTABELECIMENTOS
// ═══════════════════════════════════════

export const estabelecimentos: Estabelecimento[] = [
  {
    id: 'est-1',
    nome: 'Barbearia Premium',
    slug: 'barbearia-premium',
    descricao: 'A melhor experiência em cortes masculinos e barba da cidade. Ambiente premium com atendimento personalizado e produtos de alta qualidade.',
    endereco: 'Rua Augusta, 1200 - São Paulo, SP',
    telefone: '(11) 3333-1111',
    email: 'contato@barbeariapremium.com',
    categoria: 'barbearia',
    horarioFuncionamento: { abertura: '09:00', fechamento: '20:00', diasSemana: [1, 2, 3, 4, 5, 6] },
    logo: 'BP',
    notaMedia: 4.8,
    totalAvaliacoes: 127,
  },
  {
    id: 'est-2',
    nome: 'Salão Beleza & Arte',
    slug: 'salao-beleza-arte',
    descricao: 'Transforme seu visual com nossos especialistas em coloração, cortes modernos e tratamentos capilares. Beleza é arte!',
    endereco: 'Av. Paulista, 800 - São Paulo, SP',
    telefone: '(11) 3333-2222',
    email: 'contato@belezaearte.com',
    categoria: 'salao',
    horarioFuncionamento: { abertura: '08:00', fechamento: '19:00', diasSemana: [1, 2, 3, 4, 5, 6] },
    logo: 'BA',
    notaMedia: 4.5,
    totalAvaliacoes: 89,
  },
  {
    id: 'est-3',
    nome: 'Clínica Estética Vita',
    slug: 'clinica-estetica-vita',
    descricao: 'Tratamentos estéticos avançados com tecnologia de ponta. Limpeza de pele, peeling, drenagem linfática e muito mais.',
    endereco: 'Rua Oscar Freire, 500 - São Paulo, SP',
    telefone: '(11) 3333-3333',
    email: 'contato@clinicavita.com',
    categoria: 'clinica',
    horarioFuncionamento: { abertura: '08:00', fechamento: '18:00', diasSemana: [1, 2, 3, 4, 5] },
    logo: 'CV',
    notaMedia: 4.9,
    totalAvaliacoes: 64,
  },
];

// ═══════════════════════════════════════
// PROFISSIONAIS
// ═══════════════════════════════════════

export const profissionais: Profissional[] = [
  // Barbearia Premium
  { id: 'p1', estabelecimentoId: 'est-1', nome: 'Carlos Silva', especialidade: 'Corte Masculino', telefone: '(11) 99999-1111', email: 'carlos@filaai.com', avatar: 'CS', ativo: true },
  { id: 'p2', estabelecimentoId: 'est-1', nome: 'André Oliveira', especialidade: 'Barba & Bigode', telefone: '(11) 99999-2222', email: 'andre@filaai.com', avatar: 'AO', ativo: true },
  { id: 'p3', estabelecimentoId: 'est-1', nome: 'Rafael Costa', especialidade: 'Corte & Barba', telefone: '(11) 99999-3333', email: 'rafael@filaai.com', avatar: 'RC', ativo: true },
  // Salão Beleza & Arte
  { id: 'p4', estabelecimentoId: 'est-2', nome: 'Juliana Mendes', especialidade: 'Coloração', telefone: '(11) 99999-4444', email: 'juliana@filaai.com', avatar: 'JM', ativo: true },
  { id: 'p5', estabelecimentoId: 'est-2', nome: 'Fernanda Lima', especialidade: 'Corte Feminino', telefone: '(11) 99999-5555', email: 'fernanda@filaai.com', avatar: 'FL', ativo: true },
  { id: 'p6', estabelecimentoId: 'est-2', nome: 'Patricia Santos', especialidade: 'Tratamentos Capilares', telefone: '(11) 99999-6666', email: 'patricia@filaai.com', avatar: 'PS', ativo: false },
  // Clínica Estética Vita
  { id: 'p7', estabelecimentoId: 'est-3', nome: 'Dra. Camila Rocha', especialidade: 'Limpeza de Pele', telefone: '(11) 99999-7777', email: 'camila@filaai.com', avatar: 'CR', ativo: true },
  { id: 'p8', estabelecimentoId: 'est-3', nome: 'Dra. Beatriz Alves', especialidade: 'Peeling & Drenagem', telefone: '(11) 99999-8888', email: 'beatriz@filaai.com', avatar: 'BA', ativo: true },
];

// ═══════════════════════════════════════
// SERVIÇOS
// ═══════════════════════════════════════

export const servicos: Servico[] = [
  // Barbearia Premium
  { id: 's1', estabelecimentoId: 'est-1', nome: 'Corte Masculino', descricao: 'Corte tradicional com máquina e tesoura', preco: 45, duracao: 30 },
  { id: 's2', estabelecimentoId: 'est-1', nome: 'Barba Completa', descricao: 'Barba com navalha, toalha quente e hidratação', preco: 35, duracao: 25 },
  { id: 's3', estabelecimentoId: 'est-1', nome: 'Corte + Barba', descricao: 'Combo completo de corte e barba', preco: 70, duracao: 50 },
  { id: 's4', estabelecimentoId: 'est-1', nome: 'Sobrancelha', descricao: 'Design e acabamento de sobrancelha', preco: 20, duracao: 15 },
  // Salão Beleza & Arte
  { id: 's5', estabelecimentoId: 'est-2', nome: 'Corte Feminino', descricao: 'Corte moderno com lavagem e finalização', preco: 80, duracao: 45 },
  { id: 's6', estabelecimentoId: 'est-2', nome: 'Coloração Completa', descricao: 'Coloração profissional com produtos premium', preco: 150, duracao: 90 },
  { id: 's7', estabelecimentoId: 'est-2', nome: 'Hidratação Capilar', descricao: 'Tratamento profundo com queratina e vitaminas', preco: 60, duracao: 40 },
  { id: 's8', estabelecimentoId: 'est-2', nome: 'Escova Progressiva', descricao: 'Alisamento progressivo com tratamento', preco: 200, duracao: 120 },
  // Clínica Estética Vita
  { id: 's9', estabelecimentoId: 'est-3', nome: 'Limpeza de Pele', descricao: 'Limpeza profunda com extração e máscara', preco: 120, duracao: 60 },
  { id: 's10', estabelecimentoId: 'est-3', nome: 'Peeling Químico', descricao: 'Renovação celular com ácidos controlados', preco: 180, duracao: 45 },
  { id: 's11', estabelecimentoId: 'est-3', nome: 'Drenagem Linfática', descricao: 'Massagem terapêutica para redução de inchaço', preco: 100, duracao: 50 },
  { id: 's12', estabelecimentoId: 'est-3', nome: 'Microagulhamento', descricao: 'Estímulo de colágeno com microagulhas', preco: 250, duracao: 60 },
];

// ═══════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════

export const clientes: Cliente[] = [
  { id: 'cli-1', nome: 'João Pedro Almeida', email: 'joao@email.com', telefone: '(11) 98765-1001', avatar: 'JP' },
  { id: 'cli-2', nome: 'Marcos Vinícius', email: 'marcos@email.com', telefone: '(11) 98765-1002', avatar: 'MV' },
  { id: 'cli-3', nome: 'Gabriela Ferreira', email: 'gabriela@email.com', telefone: '(11) 98765-1003', avatar: 'GF' },
  { id: 'cli-4', nome: 'Thiago Nascimento', email: 'thiago@email.com', telefone: '(11) 98765-1004', avatar: 'TN' },
  { id: 'cli-5', nome: 'Ana Clara Souza', email: 'anaclara@email.com', telefone: '(11) 98765-1005', avatar: 'AC' },
];

// ═══════════════════════════════════════
// AGENDAMENTOS
// ═══════════════════════════════════════

export const agendamentos: Agendamento[] = [
  { id: 'a1', estabelecimentoId: 'est-1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[0], profissional: profissionais[0], data: '2026-04-29', hora: '09:00', status: 'confirmado', observacoes: 'Cliente preferencial' },
  { id: 'a2', estabelecimentoId: 'est-1', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[2], profissional: profissionais[1], data: '2026-04-29', hora: '09:30', status: 'pendente' },
  { id: 'a3', estabelecimentoId: 'est-1', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[1], profissional: profissionais[0], data: '2026-04-28', hora: '10:00', status: 'concluido' },
  { id: 'a4', estabelecimentoId: 'est-1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[0], profissional: profissionais[2], data: '2026-04-27', hora: '14:00', status: 'concluido' },
  { id: 'a5', estabelecimentoId: 'est-1', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[3], profissional: profissionais[1], data: '2026-04-26', hora: '11:00', status: 'cancelado' },
  { id: 'a6', estabelecimentoId: 'est-2', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteTelefone: '(11) 98765-1003', clienteEmail: 'gabriela@email.com', servico: servicos[4], profissional: profissionais[3], data: '2026-04-29', hora: '10:00', status: 'confirmado' },
  { id: 'a7', estabelecimentoId: 'est-2', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[5], profissional: profissionais[3], data: '2026-04-28', hora: '14:00', status: 'concluido' },
  { id: 'a8', estabelecimentoId: 'est-2', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteTelefone: '(11) 98765-1003', clienteEmail: 'gabriela@email.com', servico: servicos[6], profissional: profissionais[4], data: '2026-04-27', hora: '09:00', status: 'concluido' },
  { id: 'a9', estabelecimentoId: 'est-3', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[8], profissional: profissionais[6], data: '2026-04-29', hora: '11:00', status: 'pendente' },
  { id: 'a10', estabelecimentoId: 'est-3', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteTelefone: '(11) 98765-1003', clienteEmail: 'gabriela@email.com', servico: servicos[9], profissional: profissionais[7], data: '2026-04-28', hora: '15:00', status: 'concluido' },
  { id: 'a11', estabelecimentoId: 'est-1', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[2], profissional: profissionais[0], data: '2026-04-25', hora: '10:00', status: 'concluido' },
  { id: 'a12', estabelecimentoId: 'est-1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[0], profissional: profissionais[1], data: '2026-04-24', hora: '09:00', status: 'concluido' },
  { id: 'a13', estabelecimentoId: 'est-2', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[4], profissional: profissionais[4], data: '2026-04-26', hora: '16:00', status: 'concluido' },
  { id: 'a14', estabelecimentoId: 'est-3', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[10], profissional: profissionais[7], data: '2026-04-25', hora: '13:00', status: 'concluido' },
  { id: 'a15', estabelecimentoId: 'est-1', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[0], profissional: profissionais[2], data: '2026-04-23', hora: '15:00', status: 'concluido' },
  
  // Agendamentos de teste de desmarcação (Pendentes/Confirmados fáceis de identificar)
  { id: 't1', estabelecimentoId: 'est-1', clienteId: 'cli-3', clienteNome: 'TESTE DESMARCAÇÃO', clienteTelefone: '(11) 99999-9999', clienteEmail: 'teste@email.com', servico: servicos[0], profissional: profissionais[0], data: '2026-05-10', hora: '10:00', status: 'pendente' },
  { id: 't2', estabelecimentoId: 'est-2', clienteId: 'cli-3', clienteNome: 'TESTE DESMARCAÇÃO', clienteTelefone: '(11) 99999-9999', clienteEmail: 'teste@email.com', servico: servicos[5], profissional: profissionais[3], data: '2026-05-11', hora: '14:00', status: 'pendente' },
  { id: 't3', estabelecimentoId: 'est-3', clienteId: 'cli-3', clienteNome: 'TESTE DESMARCAÇÃO', clienteTelefone: '(11) 99999-9999', clienteEmail: 'teste@email.com', servico: servicos[8], profissional: profissionais[6], data: '2026-05-12', hora: '09:00', status: 'pendente' },

  // Agendamentos maio 2026 (calendário)
  { id: 'm1', estabelecimentoId: 'est-1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[0], profissional: profissionais[0], data: '2026-05-07', hora: '09:00', status: 'confirmado' },
  { id: 'm2', estabelecimentoId: 'est-1', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[2], profissional: profissionais[1], data: '2026-05-07', hora: '10:30', status: 'pendente' },
  { id: 'm3', estabelecimentoId: 'est-1', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[1], profissional: profissionais[2], data: '2026-05-07', hora: '14:00', status: 'confirmado' },
  { id: 'm4', estabelecimentoId: 'est-1', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[3], profissional: profissionais[0], data: '2026-05-08', hora: '11:00', status: 'pendente' },
  { id: 'm5', estabelecimentoId: 'est-1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[2], profissional: profissionais[1], data: '2026-05-09', hora: '09:30', status: 'confirmado' },
  { id: 'm6', estabelecimentoId: 'est-1', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[0], profissional: profissionais[0], data: '2026-05-13', hora: '15:00', status: 'pendente' },
  { id: 'm7', estabelecimentoId: 'est-1', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[1], profissional: profissionais[2], data: '2026-05-14', hora: '10:00', status: 'confirmado' },
  { id: 'm8', estabelecimentoId: 'est-1', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteTelefone: '(11) 98765-1003', clienteEmail: 'gabriela@email.com', servico: servicos[3], profissional: profissionais[1], data: '2026-05-14', hora: '16:00', status: 'cancelado', motivoCancelamento: 'Cliente solicitou cancelamento.' },
  { id: 'm9', estabelecimentoId: 'est-2', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteTelefone: '(11) 98765-1003', clienteEmail: 'gabriela@email.com', servico: servicos[4], profissional: profissionais[3], data: '2026-05-07', hora: '10:00', status: 'confirmado' },
  { id: 'm10', estabelecimentoId: 'est-2', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[5], profissional: profissionais[4], data: '2026-05-08', hora: '14:30', status: 'pendente' },
  { id: 'm11', estabelecimentoId: 'est-3', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[8], profissional: profissionais[6], data: '2026-05-07', hora: '11:00', status: 'confirmado' },
  { id: 'm12', estabelecimentoId: 'est-3', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[10], profissional: profissionais[7], data: '2026-05-09', hora: '09:00', status: 'pendente' },

  // Mais agendamentos est-2
  { id: 'a16', estabelecimentoId: 'est-2', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[5], profissional: profissionais[3], data: '2026-04-29', hora: '15:00', status: 'confirmado' },
  { id: 'a17', estabelecimentoId: 'est-2', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[6], profissional: profissionais[4], data: '2026-04-30', hora: '11:00', status: 'pendente' },
  { id: 'a18', estabelecimentoId: 'est-2', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteTelefone: '(11) 98765-1004', clienteEmail: 'thiago@email.com', servico: servicos[7], profissional: profissionais[4], data: '2026-04-24', hora: '14:30', status: 'concluido' },
  // Mais agendamentos est-3
  { id: 'a19', estabelecimentoId: 'est-3', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteTelefone: '(11) 98765-1002', clienteEmail: 'marcos@email.com', servico: servicos[8], profissional: profissionais[6], data: '2026-04-30', hora: '09:00', status: 'confirmado' },
  { id: 'a20', estabelecimentoId: 'est-3', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteTelefone: '(11) 98765-1001', clienteEmail: 'joao@email.com', servico: servicos[11], profissional: profissionais[7], data: '2026-04-29', hora: '14:00', status: 'pendente' },
  { id: 'a21', estabelecimentoId: 'est-3', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteTelefone: '(11) 98765-1005', clienteEmail: 'anaclara@email.com', servico: servicos[9], profissional: profissionais[6], data: '2026-04-27', hora: '16:00', status: 'cancelado', motivoCancelamento: 'Cliente relatou imprevisto.' },
];

// ═══════════════════════════════════════
// AVALIAÇÕES
// ═══════════════════════════════════════

export const avaliacoes: Avaliacao[] = [
  { id: 'av1', clienteId: 'cli-1', clienteNome: 'João Pedro Almeida', clienteAvatar: 'JP', estabelecimentoId: 'est-1', nota: 5, comentario: 'Melhor barbearia da cidade! Carlos é um mestre no corte.', data: '2026-04-27' },
  { id: 'av2', clienteId: 'cli-2', clienteNome: 'Marcos Vinícius', clienteAvatar: 'MV', estabelecimentoId: 'est-1', nota: 5, comentario: 'Ambiente incrível e atendimento nota 10.', data: '2026-04-23' },
  { id: 'av3', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteAvatar: 'TN', estabelecimentoId: 'est-1', nota: 4, comentario: 'Ótimo corte, só a espera que foi um pouco longa.', data: '2026-04-25' },
  { id: 'av4', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteAvatar: 'GF', estabelecimentoId: 'est-2', nota: 5, comentario: 'Juliana fez um trabalho maravilhoso na minha coloração!', data: '2026-04-27' },
  { id: 'av5', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteAvatar: 'AC', estabelecimentoId: 'est-2', nota: 4, comentario: 'Adorei o resultado do corte. Voltarei com certeza.', data: '2026-04-26' },
  { id: 'av6', clienteId: 'cli-5', clienteNome: 'Ana Clara Souza', clienteAvatar: 'AC', estabelecimentoId: 'est-3', nota: 5, comentario: 'Limpeza de pele maravilhosa! Minha pele ficou renovada.', data: '2026-04-28' },
  { id: 'av7', clienteId: 'cli-3', clienteNome: 'Gabriela Ferreira', clienteAvatar: 'GF', estabelecimentoId: 'est-3', nota: 5, comentario: 'Peeling incrível, resultado visível em uma sessão.', data: '2026-04-28' },
  { id: 'av8', clienteId: 'cli-4', clienteNome: 'Thiago Nascimento', clienteAvatar: 'TN', estabelecimentoId: 'est-3', nota: 5, comentario: 'Drenagem relaxante e profissional excelente.', data: '2026-04-25' },
];

// ═══════════════════════════════════════
// CREDENCIAIS
// ═══════════════════════════════════════

export const credenciaisGestores: CredenciaisGestor[] = [
  { email: 'admin@barbearia.com', senha: '123456', nomeGestor: 'Ricardo Martins', estabelecimentoId: 'est-1' },
  { email: 'admin@belezaearte.com', senha: '123456', nomeGestor: 'Marina Oliveira', estabelecimentoId: 'est-2' },
  { email: 'admin@clinicavita.com', senha: '123456', nomeGestor: 'Dr. Lucas Ferreira', estabelecimentoId: 'est-3' },
];

export const credenciaisClientes: CredenciaisCliente[] = [
  { email: 'joao@email.com', senha: '123456', clienteId: 'cli-1' },
  { email: 'marcos@email.com', senha: '123456', clienteId: 'cli-2' },
  { email: 'gabriela@email.com', senha: '123456', clienteId: 'cli-3' },
  { email: 'thiago@email.com', senha: '123456', clienteId: 'cli-4' },
  { email: 'anaclara@email.com', senha: '123456', clienteId: 'cli-5' },
];

// Compat — usado pelo Header do gestor
export const credenciais = {
  email: 'admin@barbearia.com',
  senha: '123456',
  nomeGestor: 'Ricardo Martins',
  nomeEstabelecimento: 'Barbearia Premium',
};

// ═══════════════════════════════════════
// DADOS DE GRÁFICO (gestor)
// ═══════════════════════════════════════

export const getDadosGraficoSemanal = (estId: string): DadosGrafico[] => {
  if (estId === 'est-2') {
    return [
      { nome: 'Seg', atendimentos: 15, receita: 1200 },
      { nome: 'Ter', atendimentos: 18, receita: 1450 },
      { nome: 'Qua', atendimentos: 20, receita: 1600 },
      { nome: 'Qui', atendimentos: 25, receita: 2000 },
      { nome: 'Sex', atendimentos: 30, receita: 2400 },
      { nome: 'Sáb', atendimentos: 40, receita: 3200 },
      { nome: 'Dom', atendimentos: 0, receita: 0 },
    ];
  }
  if (estId === 'est-3') {
    return [
      { nome: 'Seg', atendimentos: 10, receita: 1500 },
      { nome: 'Ter', atendimentos: 12, receita: 1800 },
      { nome: 'Qua', atendimentos: 14, receita: 2100 },
      { nome: 'Qui', atendimentos: 15, receita: 2250 },
      { nome: 'Sex', atendimentos: 20, receita: 3000 },
      { nome: 'Sáb', atendimentos: 5, receita: 750 },
      { nome: 'Dom', atendimentos: 0, receita: 0 },
    ];
  }
  return [
    { nome: 'Seg', atendimentos: 32, receita: 1680 },
    { nome: 'Ter', atendimentos: 28, receita: 1540 },
    { nome: 'Qua', atendimentos: 35, receita: 1890 },
    { nome: 'Qui', atendimentos: 40, receita: 2200 },
    { nome: 'Sex', atendimentos: 45, receita: 2520 },
    { nome: 'Sáb', atendimentos: 52, receita: 2860 },
    { nome: 'Dom', atendimentos: 15, receita: 660 },
  ];
};

export const getReceitaPorProfissional = (estId: string): DadosGrafico[] => {
  if (estId === 'est-2') {
    return [
      { nome: 'Juliana M.', atendimentos: 40, receita: 3800 },
      { nome: 'Fernanda L.', atendimentos: 35, receita: 2800 },
    ];
  }
  if (estId === 'est-3') {
    return [
      { nome: 'Dra. Camila', atendimentos: 30, receita: 4500 },
      { nome: 'Dra. Beatriz', atendimentos: 28, receita: 4000 },
    ];
  }
  return [
    { nome: 'Carlos S.', atendimentos: 85, receita: 4250 },
    { nome: 'André O.', atendimentos: 62, receita: 2790 },
    { nome: 'Rafael C.', atendimentos: 45, receita: 2700 },
  ];
};

export const getDistribuicaoServicos = (estId: string): DadosServicosGrafico[] => {
  if (estId === 'est-2') {
    return [
      { nome: 'Corte Feminino', valor: 40, cor: '#27272a' },
      { nome: 'Coloração', valor: 30, cor: '#00cec9' },
      { nome: 'Escova', valor: 20, cor: '#00b894' },
      { nome: 'Hidratação', valor: 10, cor: '#fdcb6e' },
    ];
  }
  if (estId === 'est-3') {
    return [
      { nome: 'Limpeza de Pele', valor: 45, cor: '#27272a' },
      { nome: 'Peeling', valor: 25, cor: '#00cec9' },
      { nome: 'Drenagem', valor: 20, cor: '#00b894' },
      { nome: 'Microagulhamento', valor: 10, cor: '#fdcb6e' },
    ];
  }
  return [
    { nome: 'Corte Masculino', valor: 35, cor: '#27272a' },
    { nome: 'Corte + Barba', valor: 25, cor: '#00cec9' },
    { nome: 'Barba Completa', valor: 15, cor: '#00b894' },
    { nome: 'Sobrancelha', valor: 10, cor: '#fdcb6e' },
    { nome: 'Outros', valor: 15, cor: '#3f3f46' },
  ];
};

export const getResumoDashboard = (estId: string) => {
  if (estId === 'est-2') {
    return {
      atendimentos: '148',
      atendimentosVariacao: '+5% vs mês anterior',
      receita: 'R$ 11.850',
      receitaVariacao: '+12% vs mês anterior',
      ticketMedio: 'R$ 80,00',
      destaque: { nome: 'Juliana M.', valor: '40 atendimentos' }
    };
  }
  if (estId === 'est-3') {
    return {
      atendimentos: '76',
      atendimentosVariacao: '+15% vs mês anterior',
      receita: 'R$ 11.400',
      receitaVariacao: '+10% vs mês anterior',
      ticketMedio: 'R$ 150,00',
      destaque: { nome: 'Dra. Camila', valor: '30 atendimentos' }
    };
  }
  return {
    atendimentos: '247',
    atendimentosVariacao: '+12% vs mês anterior',
    receita: 'R$ 12.350',
    receitaVariacao: '+8% vs mês anterior',
    ticketMedio: 'R$ 50,00',
    destaque: { nome: 'Carlos S.', valor: '85 atendimentos' }
  };
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

export function getEstabelecimentoById(id: string) {
  return estabelecimentos.find((e) => e.id === id);
}

export function getServicosByEstabelecimento(estabelecimentoId: string) {
  return servicos.filter((s) => s.estabelecimentoId === estabelecimentoId);
}

export function getProfissionaisByEstabelecimento(estabelecimentoId: string) {
  return profissionais.filter((p) => p.estabelecimentoId === estabelecimentoId);
}

export function getAgendamentosByEstabelecimento(estabelecimentoId: string) {
  return agendamentos.filter((a) => a.estabelecimentoId === estabelecimentoId);
}

export function getAgendamentosByCliente(clienteId: string) {
  return agendamentos.filter((a) => a.clienteId === clienteId);
}

export function getAvaliacoesByEstabelecimento(estabelecimentoId: string) {
  return avaliacoes.filter((a) => a.estabelecimentoId === estabelecimentoId);
}

export function getClienteById(id: string) {
  return clientes.find((c) => c.id === id);
}

// ═══════════════════════════════════════
// NOTIFICAÇÕES (mock)
// ═══════════════════════════════════════

export const notificacoes: Notificacao[] = [
  // ─── Barbearia Premium (est-1) ───
  { id: 'n1', titulo: 'Novo agendamento', mensagem: 'João Pedro agendou Corte Masculino para 29/04 às 09:00.', tipo: 'info', data: '2026-05-05T16:30:00', lida: false, icone: 'CalendarPlus' },
  { id: 'n2', titulo: 'Cancelamento', mensagem: 'Marcos Vinícius cancelou o agendamento de Sobrancelha em 26/04.', tipo: 'alerta', data: '2026-05-05T14:15:00', lida: false, icone: 'CalendarX' },
  { id: 'n3', titulo: 'Avaliação recebida', mensagem: 'João Pedro deu ★★★★★ — "Melhor barbearia da cidade!"', tipo: 'sucesso', data: '2026-05-05T10:00:00', lida: false, icone: 'Star' },
  { id: 'n4', titulo: 'Horário de pico', mensagem: 'Sexta-feira às 17h tem 3 agendamentos simultâneos. Considere reforçar a equipe.', tipo: 'aviso', data: '2026-05-04T18:00:00', lida: true, icone: 'AlertTriangle' },
  { id: 'n5', titulo: 'Meta atingida!', mensagem: 'Parabéns! 247 atendimentos este mês — novo recorde! 🎉', tipo: 'sucesso', data: '2026-05-04T09:00:00', lida: true, icone: 'Trophy' },
  { id: 'n6', titulo: 'Profissional desativado', mensagem: 'O cadastro de Rafael Costa foi marcado como inativo.', tipo: 'aviso', data: '2026-05-03T11:30:00', lida: true, icone: 'UserMinus' },

  // ─── Salão Beleza & Arte (est-2) ───
  { id: 'n7', titulo: 'Novo agendamento', mensagem: 'Gabriela Ferreira agendou Corte Feminino para 29/04 às 10:00.', tipo: 'info', data: '2026-05-05T15:00:00', lida: false, icone: 'CalendarPlus' },
  { id: 'n8', titulo: 'Avaliação recebida', mensagem: 'Gabriela deu ★★★★★ — "Juliana fez um trabalho maravilhoso!"', tipo: 'sucesso', data: '2026-05-05T12:00:00', lida: false, icone: 'Star' },
  { id: 'n9', titulo: 'Produto acabando', mensagem: 'Estoque de tinta loiro platinado está baixo. Repor em breve.', tipo: 'aviso', data: '2026-05-04T16:00:00', lida: true, icone: 'Package' },

  // ─── Clínica Estética Vita (est-3) ───
  { id: 'n10', titulo: 'Novo agendamento', mensagem: 'Ana Clara agendou Limpeza de Pele para 29/04 às 11:00.', tipo: 'info', data: '2026-05-05T17:00:00', lida: false, icone: 'CalendarPlus' },
  { id: 'n11', titulo: 'Cancelamento', mensagem: 'Ana Clara cancelou Peeling Químico em 27/04 — "imprevisto".', tipo: 'alerta', data: '2026-05-05T08:30:00', lida: false, icone: 'CalendarX' },
  { id: 'n12', titulo: 'Avaliação recebida', mensagem: 'Gabriela deu ★★★★★ — "Peeling incrível, resultado visível!"', tipo: 'sucesso', data: '2026-05-04T20:00:00', lida: true, icone: 'Star' },
];

// Map notificações por estabelecimento
const notificacaoEstabelecimentoMap: Record<string, string[]> = {
  'est-1': ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'],
  'est-2': ['n7', 'n8', 'n9'],
  'est-3': ['n10', 'n11', 'n12'],
};

export function getNotificacoesByEstabelecimento(estabelecimentoId: string): Notificacao[] {
  const ids = notificacaoEstabelecimentoMap[estabelecimentoId] || [];
  return notificacoes.filter((n) => ids.includes(n.id));
}
