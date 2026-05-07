'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './modal.module.css';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  largura?: 'sm' | 'md' | 'lg';
}

export default function Modal({ aberto, onFechar, titulo, children, largura = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    if (aberto) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onFechar();
      }}
    >
      <div className={`${styles.modal} ${styles[largura]}`}>
        <div className={styles.header}>
          <h2 className={styles.titulo}>{titulo}</h2>
          <button className={styles.closeBtn} onClick={onFechar} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
