import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './gestor.module.css';

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
