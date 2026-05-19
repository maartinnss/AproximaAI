import Header from '@/components/Header/Header';
import { requireGestor } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { env } from '@/server/lib/env';
import WhatsappClient from './WhatsappClient';

export default async function WhatsappPage() {
  const ctx = await requireGestor();
  const est = await db.estabelecimento.findFirst({
    where: { id: ctx.estabelecimentoId },
    select: {
      aiEnabled: true,
      aiPersona: true,
      whatsappPhoneNumberId: true,
      whatsappDisplayPhone: true,
    },
  });

  return (
    <>
      <Header titulo="WhatsApp & IA" subtitulo="Conexão e configuração do assistente virtual" />
      <WhatsappClient
        aiEnabled={est?.aiEnabled ?? true}
        aiPersona={est?.aiPersona ?? null}
        webhookUrl={`${env.APP_URL}/api/webhook/whatsapp`}
        metaPhoneNumberId={est?.whatsappPhoneNumberId ?? null}
        metaDisplayPhone={est?.whatsappDisplayPhone ?? null}
      />
    </>
  );
}
