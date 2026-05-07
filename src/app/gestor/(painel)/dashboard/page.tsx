'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, DollarSign, TrendingUp, Award } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Header from '@/components/Header/Header';
import StatCard from '@/components/StatCard/StatCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import {
  getAgendamentosByEstabelecimento,
  getDadosGraficoSemanal,
  getReceitaPorProfissional,
  getDistribuicaoServicos,
  getResumoDashboard
} from '@/data/mock';
import { Agendamento } from '@/types';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [estabelecimentoId, setEstabelecimentoId] = useState('');
  const [ultimosAgendamentos, setUltimosAgendamentos] = useState<Agendamento[]>([]);
  const [graficoSemanal, setGraficoSemanal] = useState<any[]>([]);
  const [receitaProf, setReceitaProf] = useState<any[]>([]);
  const [distServicos, setDistServicos] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      const estId = g.estabelecimentoId;
      setEstabelecimentoId(estId);
      
      const doMock = getAgendamentosByEstabelecimento(estId);
      const novosStr = sessionStorage.getItem('novosAgendamentos');
      const novos = novosStr ? JSON.parse(novosStr) : [];
      const doGestor = novos.filter((a: any) => a.estabelecimentoId === estId);
      
      const todosAgendamentos = [...doGestor, ...doMock];
      setUltimosAgendamentos(todosAgendamentos.slice(0, 5));
      
      setGraficoSemanal(getDadosGraficoSemanal(estId));
      setReceitaProf(getReceitaPorProfissional(estId));
      setDistServicos(getDistribuicaoServicos(estId));
      setResumo(getResumoDashboard(estId));
    }
  }, []);

  return (
    <>
      <Header titulo="Dashboard" subtitulo="Visão geral do seu estabelecimento" />

      <div className={styles.content}>
        {/* Métricas */}
        {/* Métricas */}
        {resumo && (
          <section className={styles.metricas}>
            <StatCard
              titulo="Atendimentos do mês"
              valor={resumo.atendimentos}
              subtitulo={resumo.atendimentosVariacao}
              icon={CalendarDays}
              cor="purple"
              animDelay={0}
            />
            <StatCard
              titulo="Receita do mês"
              valor={resumo.receita}
              subtitulo={resumo.receitaVariacao}
              icon={DollarSign}
              cor="cyan"
              animDelay={100}
            />
            <StatCard
              titulo="Ticket médio"
              valor={resumo.ticketMedio}
              subtitulo="Por atendimento"
              icon={TrendingUp}
              cor="green"
              animDelay={200}
            />
            <StatCard
              titulo="Profissional destaque"
              valor={resumo.destaque.nome}
              subtitulo={resumo.destaque.valor}
              icon={Award}
              cor="yellow"
              animDelay={300}
            />
          </section>
        )}

        {/* Gráficos */}
        <section className={styles.graficos}>
          <div className={`${styles.graficoCard} ${styles.graficoLinha}`}>
            <h3 className={styles.graficoTitulo}>Atendimentos — Últimos 7 dias</h3>
            <div className={styles.graficoWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={graficoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nome" stroke="#8b8b9e" fontSize={12} />
                  <YAxis stroke="#8b8b9e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="atendimentos"
                    stroke="#e4e4e7"
                    strokeWidth={3}
                    dot={{ fill: '#e4e4e7', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#f4f4f5' }}
                    name="Atendimentos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${styles.graficoCard} ${styles.graficoBarra}`}>
            <h3 className={styles.graficoTitulo}>Receita por Profissional</h3>
            <div className={styles.graficoWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={receitaProf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nome" stroke="#8b8b9e" fontSize={12} />
                  <YAxis stroke="#8b8b9e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Bar dataKey="receita" radius={[6, 6, 0, 0]} name="Receita">
                    {receitaProf.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#e4e4e7' : index === 1 ? '#a1a1aa' : index === 2 ? '#52525b' : index === 3 ? '#27272a' : '#18181b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${styles.graficoCard} ${styles.graficoPizza}`}>
            <h3 className={styles.graficoTitulo}>Distribuição por Serviço</h3>
            <div className={styles.graficoWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distServicos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="valor"
                    nameKey="nome"
                    strokeWidth={0}
                  >
                    {distServicos.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`${value}%`, 'Participação']}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '0.75rem', color: '#8b8b9e' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Últimos Agendamentos */}
        <section className={styles.tabelaSection}>
          <h3 className={styles.tabelaTitulo}>Últimos Agendamentos</h3>
          <div className={styles.tabelaWrap}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Profissional</th>
                  <th>Data / Hora</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimosAgendamentos.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <div className={styles.clienteCell}>
                        <div className={styles.clienteAvatar}>
                          {ag.clienteNome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                        <span>{ag.clienteNome}</span>
                      </div>
                    </td>
                    <td>{ag.servico.nome}</td>
                    <td>{ag.profissional.nome}</td>
                    <td>{new Date(ag.data).toLocaleDateString('pt-BR')} às {ag.hora}</td>
                    <td className={styles.valor}>R$ {ag.servico.preco.toFixed(2)}</td>
                    <td><StatusBadge status={ag.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
