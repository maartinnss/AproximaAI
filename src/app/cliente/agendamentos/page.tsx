'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { getAgendamentosByCliente, getEstabelecimentoById } from '@/data/mock';
import { Agendamento } from '@/types';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './meusagendamentos.module.css';

export default function MeusAgendamentosPage() {
  const [clienteId, setClienteId] = useState('');
  const [lista, setLista] = useState<Agendamento[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem('clienteLogado');
    if (data) {
      const c = JSON.parse(data);
      setClienteId(c.id);
      
      const doMock = getAgendamentosByCliente(c.id);
      const novosStr = sessionStorage.getItem('novosAgendamentos');
      const novos = novosStr ? JSON.parse(novosStr) : [];
      const doCliente = novos.filter((a: Agendamento) => a.clienteId === c.id);
      
      setLista([...doCliente, ...doMock]);
    }
  }, []);

  const cancelar = (id: string) => {
    setLista((prev) => prev.map((a) => a.id === id ? { ...a, status: 'cancelado' as const } : a));
  };

  const proximos = useMemo(() => lista.filter((a) => a.status === 'confirmado' || a.status === 'pendente'), [lista]);
  const historico = useMemo(() => lista.filter((a) => a.status === 'concluido' || a.status === 'cancelado'), [lista]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Meus Agendamentos</h1>
      <p className={styles.subtitle}>Acompanhe e gerencie seus horários</p>

      {/* Próximos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Próximos</h2>
        {proximos.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhum agendamento pendente</p>
            <Link href="/cliente/explorar" className={styles.emptyLink}>Explorar estabelecimentos</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {proximos.map((ag) => {
              const est = getEstabelecimentoById(ag.estabelecimentoId);
              return (
                <div key={ag.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardLogo}>{est?.logo}</div>
                    <div>
                      <h3 className={styles.cardEstNome}>{est?.nome}</h3>
                      <span className={styles.cardServico}>{ag.servico.nome}</span>
                    </div>
                    <StatusBadge status={ag.status} />
                  </div>
                  <div className={styles.cardBody}>
                    <span><Calendar size={14} /> {new Date(ag.data).toLocaleDateString('pt-BR')}</span>
                    <span><Clock size={14} /> {ag.hora}</span>
                    <span>Profissional: {ag.profissional.nome}</span>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardPreco}>R$ {ag.servico.preco.toFixed(2)}</span>
                    <button className={styles.btnCancelar} onClick={() => cancelar(ag.id)} type="button">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Histórico</h2>
        {historico.length === 0 ? (
          <p className={styles.emptyText}>Nenhum agendamento anterior</p>
        ) : (
          <div className={styles.grid}>
            {historico.map((ag) => {
              const est = getEstabelecimentoById(ag.estabelecimentoId);
              return (
                <div key={ag.id} className={`${styles.card} ${styles.cardHistorico}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardLogo}>{est?.logo}</div>
                    <div>
                      <h3 className={styles.cardEstNome}>{est?.nome}</h3>
                      <span className={styles.cardServico}>{ag.servico.nome}</span>
                    </div>
                    <StatusBadge status={ag.status} />
                  </div>
                  <div className={styles.cardBody}>
                    <span><Calendar size={14} /> {new Date(ag.data).toLocaleDateString('pt-BR')}</span>
                    <span><Clock size={14} /> {ag.hora}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
