import styles from './header.module.css';
import NotificationPanel from '@/components/NotificationPanel/NotificationPanel';
import { requireGestor } from '@/server/auth/session';
import { estabelecimentoRepo } from '@/server/repositories/estabelecimento.repo';
import { notificacaoRepo } from '@/server/repositories/notificacao.repo';
import { iniciais } from '@/server/repositories/_view-models';

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
}

export default async function Header({ titulo, subtitulo }: HeaderProps) {
  const ctx = await requireGestor();
  const [est, notificacoes] = await Promise.all([
    estabelecimentoRepo.findById(ctx.estabelecimentoId),
    notificacaoRepo.listByEstabelecimento(ctx.estabelecimentoId, { limit: 20 }),
  ]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{titulo}</h1>
        {subtitulo && <p className={styles.subtitle}>{subtitulo}</p>}
      </div>
      <div className={styles.right}>
        <NotificationPanel notificacoes={notificacoes} />
        <div className={styles.profile}>
          <div className={styles.avatar}>{iniciais(ctx.nome)}</div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{ctx.nome}</span>
            <span className={styles.profileRole}>{est?.nome ?? 'Estabelecimento'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
