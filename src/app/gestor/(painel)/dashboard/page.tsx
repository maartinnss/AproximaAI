import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { estabelecimentoRepo } from '@/server/repositories/estabelecimento.repo';
import { dashboardService } from '@/server/services/dashboard.service';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const ctx = await requireGestor();
  const est = await estabelecimentoRepo.requireById(ctx.estabelecimentoId);

  const [resumo, graficoSemanal, receitaProf, distServicos, ultimosAgendamentos] =
    await Promise.all([
      dashboardService.getResumo(est.id, est.timezone, est.locale, est.currency),
      dashboardService.getDadosGraficoSemanal(est.id, est.timezone),
      dashboardService.getReceitaPorProfissional(est.id, est.timezone),
      dashboardService.getDistribuicaoServicos(est.id, est.timezone),
      dashboardService.getUltimosAgendamentos(est.id, est.timezone, 5),
    ]);

  return (
    <>
      <Header titulo="Dashboard" subtitulo="Visão geral do seu estabelecimento" />
      <DashboardClient
        resumo={resumo}
        graficoSemanal={graficoSemanal}
        receitaProf={receitaProf}
        distServicos={distServicos}
        ultimosAgendamentos={ultimosAgendamentos}
        locale={est.locale}
        currency={est.currency}
      />
    </>
  );
}
