'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, CalendarPlus, CalendarX2, Star, AlertTriangle,
  Trophy, UserMinus, Package, Info, CheckCheck, BellOff,
} from 'lucide-react';
import styles from './notificationPanel.module.css';
import { getNotificacoesByEstabelecimento } from '@/data/mock';
import type { Notificacao } from '@/types';

// Mapeamento de ícones Lucide pelo nome salvo no mock
const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  CalendarPlus, CalendarX: CalendarX2, Star, AlertTriangle,
  Trophy, UserMinus, Package, Info,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function NotificationPanel() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      const lista = getNotificacoesByEstabelecimento(g.estabelecimentoId);
      setNotificacoes(lista);
    }
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarComoLida = useCallback((id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  }, []);

  const marcarTodasComoLidas = useCallback(() => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, []);

  const togglePanel = useCallback(() => setAberto((prev) => !prev), []);

  const tipoStyle: Record<string, string> = {
    info: styles.iconInfo,
    sucesso: styles.iconSucesso,
    alerta: styles.iconAlerta,
    aviso: styles.iconAviso,
  };

  return (
    <div className={styles.wrapper}>
      {/* Botão do sininho */}
      <button
        className={`${styles.bellBtn} ${aberto ? styles.bellBtnActive : ''}`}
        onClick={togglePanel}
        id="btn-notificacoes"
        aria-label="Notificações"
        aria-expanded={aberto}
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className={styles.bellBadge}>{naoLidas > 9 ? '9+' : naoLidas}</span>
        )}
      </button>

      {/* Overlay (click outside) */}
      {aberto && <div className={styles.overlay} onClick={() => setAberto(false)} />}

      {/* Painel dropdown */}
      {aberto && (
        <div className={styles.panel} role="region" aria-label="Painel de notificações">
          {/* Header */}
          <div className={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={styles.panelTitle}>Notificações</span>
              {naoLidas > 0 && <span className={styles.badgeCount}>{naoLidas}</span>}
            </div>
            {naoLidas > 0 && (
              <button className={styles.markAllBtn} onClick={marcarTodasComoLidas}>
                <CheckCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Body */}
          <div className={styles.panelBody}>
            {notificacoes.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <BellOff size={22} />
                </div>
                <span className={styles.emptyText}>Nenhuma notificação</span>
              </div>
            ) : (
              notificacoes.map((notif) => {
                const IconComp = iconMap[notif.icone || ''] || Info;
                return (
                  <div
                    key={notif.id}
                    className={`${styles.notifItem} ${!notif.lida ? styles.notifItemUnread : ''}`}
                    onClick={() => marcarComoLida(notif.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') marcarComoLida(notif.id); }}
                  >
                    <div className={`${styles.notifIcon} ${tipoStyle[notif.tipo]}`}>
                      <IconComp size={18} />
                    </div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifTitle}>{notif.titulo}</div>
                      <div className={styles.notifMsg}>{notif.mensagem}</div>
                      <div className={styles.notifTime}>{timeAgo(notif.data)}</div>
                    </div>
                    {!notif.lida && <div className={styles.unreadDot} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
