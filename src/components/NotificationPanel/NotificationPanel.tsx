'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Bell, CalendarPlus, CalendarX2, Star, AlertTriangle,
  Trophy, UserMinus, Package, Info, CheckCheck, BellOff,
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './notificationPanel.module.css';
import type { NotificacaoView } from '@/server/repositories/_view-models';

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

interface Props {
  notificacoes: NotificacaoView[];
}

export default function NotificationPanel({ notificacoes: initial }: Props) {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoView[]>(initial);

  useEffect(() => {
    const es = new EventSource('/api/gestor/notificacoes/stream');
    es.addEventListener('notificacao', (ev) => {
      try {
        const novo: NotificacaoView = JSON.parse((ev as MessageEvent).data);
        setNotificacoes((prev) => {
          if (prev.some((n) => n.id === novo.id)) return prev;
          return [novo, ...prev];
        });
      } catch {
        // ignore
      }
    });
    es.onerror = () => {
      // Auto-reconnect by browser; nothing to do.
    };
    return () => es.close();
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarComoLida = useCallback(async (id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    
    try {
      const res = await fetch('/api/gestor/notificacoes/marcar-lida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Falha da API');
    } catch (err) {
      console.error('Falha ao marcar como lida', err);
      // Reversão pontual e segura do ID afetado, sem depender de "estadoAnterior"
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: false } : n)));
      toast.error('Não foi possível marcar a notificação como lida. Tente novamente.');
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    const idsNaoLidos = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidos.length === 0) return;

    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    
    try {
      const res = await fetch('/api/gestor/notificacoes/marcar-todas-lidas', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Falha da API');
    } catch (err) {
      console.error('Falha ao marcar todas como lidas', err);
      setNotificacoes((prev) => 
        prev.map((n) => (idsNaoLidos.includes(n.id) ? { ...n, lida: false } : n))
      );
      toast.error('Não foi possível atualizar as notificações. Tente novamente mais tarde.');
    }
  }, [notificacoes]);

  const togglePanel = useCallback(() => setAberto((prev) => !prev), []);

  const tipoStyle: Record<string, string> = {
    info: styles.iconInfo,
    sucesso: styles.iconSucesso,
    alerta: styles.iconAlerta,
    aviso: styles.iconAviso,
  };

  return (
    <div className={styles.wrapper}>
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

      {aberto && <div className={styles.overlay} onClick={() => setAberto(false)} />}

      {aberto && (
        <div className={styles.panel} role="region" aria-label="Painel de notificações">
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
