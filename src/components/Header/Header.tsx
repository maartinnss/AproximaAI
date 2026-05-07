'use client';

import { useState, useEffect } from 'react';
import styles from './header.module.css';
import { getEstabelecimentoById } from '@/data/mock';
import NotificationPanel from '@/components/NotificationPanel/NotificationPanel';

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
}

export default function Header({ titulo, subtitulo }: HeaderProps) {
  const [gestor, setGestor] = useState({ nome: 'Gestor', estNome: 'Estabelecimento' });

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      const est = getEstabelecimentoById(g.estabelecimentoId);
      setGestor({
        nome: g.nomeGestor || 'Gestor',
        estNome: est ? est.nome : 'Estabelecimento'
      });
    }
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{titulo}</h1>
        {subtitulo && <p className={styles.subtitle}>{subtitulo}</p>}
      </div>
      <div className={styles.right}>
        <NotificationPanel />
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {gestor.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{gestor.nome}</span>
            <span className={styles.profileRole}>{gestor.estNome}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
