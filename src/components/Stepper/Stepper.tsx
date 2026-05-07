import styles from './stepper.module.css';

interface StepperProps {
  etapas: string[];
  etapaAtual: number;
}

export default function Stepper({ etapas, etapaAtual }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {etapas.map((etapa, i) => (
        <div key={i} className={`${styles.step} ${i <= etapaAtual ? styles.active : ''} ${i < etapaAtual ? styles.completed : ''}`}>
          <div className={styles.circle}>
            {i < etapaAtual ? '✓' : i + 1}
          </div>
          <span className={styles.label}>{etapa}</span>
          {i < etapas.length - 1 && <div className={`${styles.line} ${i < etapaAtual ? styles.lineActive : ''}`} />}
        </div>
      ))}
    </div>
  );
}
