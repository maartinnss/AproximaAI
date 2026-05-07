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
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
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
                    {distServicos.map((_entry: any, index: number) => {
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
