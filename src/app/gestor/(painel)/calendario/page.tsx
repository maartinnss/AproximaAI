import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { estabelecimentoRepo } from '@/server/repositories/estabelecimento.repo';
import { agendamentoRepo } from '@/server/repositories/agendamento.repo';
import { profissionalRepo } from '@/server/repositories/profissional.repo';
import CalendarioClient from './CalendarioClient';

export default async function CalendarioPage() {
  const ctx = await requireGestor();
  const est = await estabelecimentoRepo.requireById(ctx.estabelecimentoId);

  const [agendamentos, profissionais] = await Promise.all([
    agendamentoRepo.listByEstabelecimento(est.id, est.timezone),
    profissionalRepo.listByEstabelecimento(est.id),
  ]);

  return (
    <>
      <Header titulo="Calendário" subtitulo="Visualize e gerencie seus agendamentos por dia" />
      <CalendarioClient
        agendamentos={agendamentos}
        profissionais={profissionais}
        locale={est.locale}
        currency={est.currency}
      />
    </>
  );
}
