'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import styles from './sidebar.module.css';

const menuItems = [
  { href: '/gestor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gestor/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/gestor/servicos', label: 'Serviços', icon: Scissors },
  { href: '/gestor/profissionais', label: 'Profissionais', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);

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
            <Zap size={22} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoBrand}>Fila</span>
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
          <Link href="/" className={styles.logoutBtn} onClick={() => { sessionStorage.removeItem('gestorLogado'); }}>
            <LogOut size={18} />
            <span>Sair</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
