import { LucideIcon } from 'lucide-react';
import styles from './statcard.module.css';

interface StatCardProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  icon: LucideIcon;
  cor?: 'purple' | 'cyan' | 'green' | 'yellow';
  animDelay?: number;
}

export default function StatCard({ titulo, valor, subtitulo, icon: Icon, cor = 'purple', animDelay = 0 }: StatCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[cor]}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className={styles.top}>
        <div className={styles.info}>
          <span className={styles.titulo}>{titulo}</span>
          <span className={styles.valor}>{valor}</span>
          {subtitulo && <span className={styles.subtitulo}>{subtitulo}</span>}
        </div>
        <div className={styles.iconWrap}>
          <Icon size={24} />
        </div>
      </div>
      <div className={styles.barWrap}>
        <div className={styles.bar} />
      </div>
    </div>
  );
}
