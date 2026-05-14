import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { profissionalRepo } from '@/server/repositories/profissional.repo';
import ProfissionaisClient from './ProfissionaisClient';

export default async function ProfissionaisPage() {
  const ctx = await requireGestor();
  const profissionais = await profissionalRepo.listByEstabelecimento(ctx.estabelecimentoId);

  return (
    <>
      <Header titulo="Profissionais" subtitulo="Cadastre e gerencie sua equipe de profissionais" />
      <ProfissionaisClient profissionais={profissionais} />
    </>
  );
}
