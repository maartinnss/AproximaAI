import { StatusAgendamento } from '@/types';
import styles from './statusbadge.module.css';

interface StatusBadgeProps {
  status: StatusAgendamento;
}

const statusConfig: Record<StatusAgendamento, { label: string; className: string }> = {
  confirmado: { label: 'Confirmado', className: 'confirmado' },
  pendente: { label: 'Pendente', className: 'pendente' },
  concluido: { label: 'Concluído', className: 'concluido' },
  cancelado: { label: 'Cancelado', className: 'cancelado' },
  no_show: { label: 'Não compareceu', className: 'cancelado' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      <span className={styles.dot} />
      {config.label}
    </span>
  );
}
