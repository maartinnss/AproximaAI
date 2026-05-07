import { Star } from 'lucide-react';
import styles from './starrating.module.css';

interface StarRatingProps {
  nota: number;
  tamanho?: number;
  mostrarNumero?: boolean;
}

export default function StarRating({ nota, tamanho = 16, mostrarNumero = true }: StarRatingProps) {
  return (
    <div className={styles.wrap}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={tamanho}
          className={i <= Math.round(nota) ? styles.filled : styles.empty}
          fill={i <= Math.round(nota) ? 'currentColor' : 'none'}
        />
      ))}
      {mostrarNumero && <span className={styles.numero}>{nota.toFixed(1)}</span>}
    </div>
  );
}
