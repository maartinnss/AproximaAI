import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { db } from '@/server/db/client';
import WhatsappClient from './WhatsappClient';

export default async function WhatsappPage() {
  const ctx = await requireGestor();
  const est = await db.estabelecimento.findFirst({
    where: { id: ctx.estabelecimentoId },
    select: {
      telefone: true,
      aiEnabled: true,
      aiPersona: true,
    },
  });

  return (
    <>
      <Header titulo="WhatsApp & IA" subtitulo="Link de contato e configuração do assistente virtual" />
      <WhatsappClient
        telefone={est?.telefone ?? ''}
        aiEnabled={est?.aiEnabled ?? true}
        aiPersona={est?.aiPersona ?? null}
      />
    </>
  );
}
