'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, CalendarDays, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import styles from './cliente.module.css';

interface ClienteInfo {
  id: string;
  nome: string;
  email: string;
  avatar: string;
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('clienteLogado');
    if (!data && !pathname.includes('/login')) {
      router.push('/');
      return;
    }
    if (data) setCliente(JSON.parse(data));
  }, [pathname, router]);

  if (pathname.includes('/login')) return <>{children}</>;

  const navItems = [
    { href: '/cliente/explorar', label: 'Explorar', icon: Search },
    { href: '/cliente/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('clienteLogado');
    router.push('/');
  };

  return (
    <div className={styles.layout}>
      {/* Header Desktop + Mobile */}
      <header className={styles.header}>
        <Link href="/cliente/explorar" className={styles.logo}>
          <div className={styles.logoIcon}><Image src="/logo.png" alt="FilaAI Logo" width={18} height={18} style={{ borderRadius: '2px' }} /></div>
          <span className={styles.logoBrand}>Fila</span>
          <span className={styles.logoAccent}>AI</span>
        </Link>

        <nav className={styles.desktopNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`${styles.navLink} ${isActive ? styles.navActive : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.headerRight}>
          {cliente && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{cliente.avatar}</div>
              <span className={styles.userName}>{cliente.nome.split(' ')[0]}</span>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className={styles.main}>{children}</main>

      {/* Navbar inferior mobile */}
      <nav className={styles.mobileNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavActive : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button className={styles.mobileNavItem} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}
