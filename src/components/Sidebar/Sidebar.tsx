'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Scissors,
  Users,
  MessageCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import VennLogo from '@/components/VennLogo';
import styles from './sidebar.module.css';

const menuItems = [
  { href: '/gestor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gestor/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/gestor/calendario', label: 'Calendário', icon: CalendarCheck },
  { href: '/gestor/servicos', label: 'Serviços', icon: Scissors },
  { href: '/gestor/profissionais', label: 'Profissionais', icon: Users },
  { href: '/gestor/whatsapp', label: 'WhatsApp & IA', icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const handleSair = async () => {
    if (saindo) return;
    setSaindo(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Botão hamburguer mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setAberta(true)}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop mobile */}
      {aberta && <div className={styles.backdrop} onClick={() => setAberta(false)} />}

      <aside className={`${styles.sidebar} ${aberta ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <VennLogo size={22} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoBrand}>Aproxima</span>
            <span className={styles.logoAccent}>AI</span>
          </div>
          <button className={styles.closeBtn} onClick={() => setAberta(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                    onClick={() => setAberta(false)}
                  >
                    <div className={styles.menuIconWrap}>
                      <Icon size={20} />
                    </div>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {isActive && <div className={styles.activeIndicator} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleSair}
            disabled={saindo}
            style={{ opacity: saindo ? 0.6 : 1, cursor: saindo ? 'wait' : 'pointer' }}
          >
            <LogOut size={18} />
            <span>{saindo ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
