import { redirect } from 'next/navigation';
import { requireGestor } from '@/server/auth/session';
import { db } from '@/server/db/client';
import OnboardingClient from './OnboardingClient';

export const metadata = { title: 'Configuração inicial — AproximaAI' };

export default async function OnboardingPage() {
  const ctx = await requireGestor();

  // Se já tem serviços E profissionais, setup completo — vai pro dashboard
  const [totalServicos, totalProfissionais] = await Promise.all([
    db.servico.count({ where: { estabelecimentoId: ctx.estabelecimentoId, ativo: true } }),
    db.profissional.count({ where: { estabelecimentoId: ctx.estabelecimentoId, ativo: true } }),
  ]);

  if (totalServicos > 0 && totalProfissionais > 0) {
    redirect('/gestor/dashboard');
  }

  return <OnboardingClient />;
}
