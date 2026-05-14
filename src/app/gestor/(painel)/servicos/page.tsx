import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { estabelecimentoRepo } from '@/server/repositories/estabelecimento.repo';
import { servicoRepo } from '@/server/repositories/servico.repo';
import ServicosClient from './ServicosClient';

export default async function ServicosPage() {
  const ctx = await requireGestor();
  const est = await estabelecimentoRepo.requireById(ctx.estabelecimentoId);
  const servicos = await servicoRepo.listByEstabelecimento(est.id);

  return (
    <>
      <Header titulo="Serviços" subtitulo="Cadastre e gerencie os serviços oferecidos" />
      <ServicosClient servicos={servicos} locale={est.locale} currency={est.currency} />
    </>
  );
}
