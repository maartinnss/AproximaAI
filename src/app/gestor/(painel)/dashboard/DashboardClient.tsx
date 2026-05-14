'use client';

import { CalendarDays, DollarSign, TrendingUp, Award } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '@/components/StatCard/StatCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import type { AgendamentoView } from '@/server/repositories/_view-models';
import type {
  ResumoDashboard,
  DadosGrafico,
  DadosServicosGrafico,
} from '@/server/services/dashboard.service';
import styles from './dashboard.module.css';

interface Props {
  resumo: ResumoDashboard;
  graficoSemanal: DadosGrafico[];
  receitaProf: DadosGrafico[];
  distServicos: DadosServicosGrafico[];
  ultimosAgendamentos: AgendamentoView[];
  locale: string;
  currency: string;
}

export default function DashboardClient({
  resumo,
  graficoSemanal,
  receitaProf,
  distServicos,
  ultimosAgendamentos,
  locale,
  currency,
}: Props) {
  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);

  return (
    <div className={styles.content}>
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
          valor={resumo.destaque?.nome ?? '—'}
          subtitulo={resumo.destaque?.valor ?? 'Sem dados no mês'}
          icon={Award}
          cor="yellow"
          animDelay={300}
        />
      </section>

      <section className={styles.graficos}>
        <div className={`${styles.graficoCard} ${styles.graficoLinha}`}>
          <h3 className={styles.graficoTitulo}>Atendimentos — Últimos 7 dias</h3>
          <div className={styles.graficoWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={graficoSemanal}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="nome" stroke="#94A3B8" fontSize={12} fontWeight={500} />
                <YAxis stroke="#94A3B8" fontSize={12} fontWeight={500} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(15,23,42,0.08)',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 12px 32px -8px rgba(99,102,241,0.30)',
                  }}
                  itemStyle={{ color: '#0F172A' }}
                />
                <Line
                  type="monotone"
                  dataKey="atendimentos"
                  stroke="url(#lineGrad)"
                  strokeWidth={3}
                  dot={{ fill: '#A855F7', stroke: '#fff', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#EC4899', stroke: '#fff', strokeWidth: 2 }}
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
                <defs>
                  {[
                    ['#6366F1', '#A855F7'],
                    ['#A855F7', '#EC4899'],
                    ['#EC4899', '#F43F5E'],
                    ['#06B6D4', '#6366F1'],
                    ['#10B981', '#06B6D4'],
                    ['#F59E0B', '#EC4899'],
                  ].map(([from, to], i) => (
                    <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={from} />
                      <stop offset="100%" stopColor={to} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="nome" stroke="#94A3B8" fontSize={12} fontWeight={500} />
                <YAxis stroke="#94A3B8" fontSize={12} fontWeight={500} />
                <Tooltip
                  cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(15,23,42,0.08)',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 12px 32px -8px rgba(99,102,241,0.30)',
                  }}
                  itemStyle={{ color: '#0F172A' }}
                  formatter={(value) => [fmtMoney(Number(value)), 'Receita']}
                />
                <Bar dataKey="receita" radius={[8, 8, 0, 0]} name="Receita">
                  {receitaProf.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % 6})`} />
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
                  innerRadius={62}
                  outerRadius={104}
                  paddingAngle={3}
                  dataKey="valor"
                  nameKey="nome"
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {distServicos.map((_entry, index) => {
                    const palette = ['#6366F1', '#A855F7', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
                    return <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(15,23,42,0.08)',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 12px 32px -8px rgba(99,102,241,0.30)',
                  }}
                  itemStyle={{ color: '#0F172A' }}
                  formatter={(value) => [`${value}%`, 'Participação']}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

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
                        {ag.clienteNome.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                      </div>
                      <span>{ag.clienteNome}</span>
                    </div>
                  </td>
                  <td>{ag.servico.nome}</td>
                  <td>{ag.profissional.nome}</td>
                  <td>{new Date(ag.data + 'T12:00:00').toLocaleDateString(locale)} às {ag.hora}</td>
                  <td className={styles.valor}>{fmtMoney(ag.servico.preco)}</td>
                  <td><StatusBadge status={ag.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
