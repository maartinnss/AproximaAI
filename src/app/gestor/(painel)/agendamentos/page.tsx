import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { estabelecimentoRepo } from '@/server/repositories/estabelecimento.repo';
import { agendamentoRepo } from '@/server/repositories/agendamento.repo';
import { profissionalRepo } from '@/server/repositories/profissional.repo';
import { servicoRepo } from '@/server/repositories/servico.repo';
import AgendamentosClient from './AgendamentosClient';

export default async function AgendamentosPage() {
  const ctx = await requireGestor();
  const est = await estabelecimentoRepo.requireById(ctx.estabelecimentoId);

  const [agendamentos, profissionais, servicos] = await Promise.all([
    agendamentoRepo.listByEstabelecimento(est.id, est.timezone),
    profissionalRepo.listByEstabelecimento(est.id, { ativos: true }),
    servicoRepo.listByEstabelecimento(est.id, { ativos: true }),
  ]);

  return (
    <>
      <Header
        titulo="Agendamentos"
        subtitulo="Gerencie todos os agendamentos do seu estabelecimento"
      />
      <AgendamentosClient
        agendamentos={agendamentos}
        profissionais={profissionais}
        servicos={servicos}
        locale={est.locale}
        currency={est.currency}
      />
    </>
  );
}
