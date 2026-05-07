'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, Calendar, Clock, User, Phone, Mail, FileText } from 'lucide-react';
import Header from '@/components/Header/Header';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import Modal from '@/components/Modal/Modal';
import { getAgendamentosByEstabelecimento, getProfissionaisByEstabelecimento } from '@/data/mock';
import { Agendamento, Profissional, StatusAgendamento } from '@/types';
import styles from './agendamentos.module.css';

export default function AgendamentosPage() {
  const [busca, setBusca] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusAgendamento | ''>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [estabelecimentoId, setEstabelecimentoId] = useState('');
  const [agendamentosList, setAgendamentosList] = useState<Agendamento[]>([]);
  const [profissionaisList, setProfissionaisList] = useState<Profissional[]>([]);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      setEstabelecimentoId(g.estabelecimentoId);
      
      const doMock = getAgendamentosByEstabelecimento(g.estabelecimentoId);
      const novosStr = sessionStorage.getItem('novosAgendamentos');
      const novos = novosStr ? JSON.parse(novosStr) : [];
      const novosDoEst = novos.filter((a: Agendamento) => a.estabelecimentoId === g.estabelecimentoId);
      
      setAgendamentosList([...novosDoEst, ...doMock]);
      setProfissionaisList(getProfissionaisByEstabelecimento(g.estabelecimentoId));
    }
  }, []);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentosList.filter((ag) => {
      const matchBusca = ag.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
        ag.servico.nome.toLowerCase().includes(busca.toLowerCase());
      const matchProfissional = !filtroProfissional || ag.profissional.id === filtroProfissional;
      const matchStatus = !filtroStatus || ag.status === filtroStatus;
      return matchBusca && matchProfissional && matchStatus;
    });
  }, [busca, filtroProfissional, filtroStatus, agendamentosList]);

  const abrirDetalhes = (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    setCancelando(false);
    setMotivo('');
    setModalAberto(true);
  };

  const confirmarCancelamento = () => {
    if (!motivo.trim()) return alert('Informe o motivo da desmarcação.');
    
    const novaLista = agendamentosList.map(a => 
      a.id === agendamentoSelecionado?.id 
        ? { ...a, status: 'cancelado' as StatusAgendamento, motivoCancelamento: motivo } 
        : a
    );
    setAgendamentosList(novaLista);
    
    setAgendamentoSelecionado(prev => prev ? { ...prev, status: 'cancelado', motivoCancelamento: motivo } : null);
    setCancelando(false);
  };

  return (
    <>
      <Header titulo="Agendamentos" subtitulo="Gerencie todos os agendamentos do seu estabelecimento" />

      <div className={styles.content}>
        {/* Filtros */}
        <section className={styles.filtros}>
          <div className={styles.searchWrap}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por cliente ou serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.searchInput}
              id="input-busca-agendamentos"
            />
          </div>
          <div className={styles.filtrosRight}>
            <div className={styles.selectWrap}>
              <Filter size={16} className={styles.selectIcon} />
              <select
                value={filtroProfissional}
                onChange={(e) => setFiltroProfissional(e.target.value)}
                className={styles.select}
                id="filtro-profissional"
              >
                <option value="">Todos profissionais</option>
                {profissionaisList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className={styles.selectWrap}>
              <Filter size={16} className={styles.selectIcon} />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as StatusAgendamento | '')}
                className={styles.select}
                id="filtro-status"
              >
                <option value="">Todos status</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contagem */}
        <div className={styles.contagem}>
          <span>{agendamentosFiltrados.length} agendamento{agendamentosFiltrados.length !== 1 ? 's' : ''} encontrado{agendamentosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabela */}
        <section className={styles.tabelaSection}>
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
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentosFiltrados.map((ag, index) => (
                  <tr key={ag.id} style={{ animationDelay: `${index * 30}ms` }} className={styles.row}>
                    <td>
                      <div className={styles.clienteCell}>
                        <div className={styles.clienteAvatar}>
                          {ag.clienteNome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                        <div className={styles.clienteInfo}>
                          <span className={styles.clienteNome}>{ag.clienteNome}</span>
                          <span className={styles.clienteTel}>{ag.clienteTelefone}</span>
                        </div>
                      </div>
                    </td>
                    <td>{ag.servico.nome}</td>
                    <td>{ag.profissional.nome}</td>
                    <td>
                      <div className={styles.dataCell}>
                        <Calendar size={14} />
                        {new Date(ag.data).toLocaleDateString('pt-BR')}
                        <Clock size={14} />
                        {ag.hora}
                      </div>
                    </td>
                    <td className={styles.valorCell}>R$ {ag.servico.preco.toFixed(2)}</td>
                    <td><StatusBadge status={ag.status} /></td>
                    <td>
                      <button
                        className={styles.btnDetalhes}
                        onClick={() => abrirDetalhes(ag)}
                        aria-label={`Ver detalhes de ${ag.clienteNome}`}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal de Detalhes */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo="Detalhes do Agendamento"
        largura="md"
      >
        {agendamentoSelecionado && (
          <div className={styles.detalhes}>
            <div className={styles.detalheHeader}>
              <div className={styles.detalheAvatar}>
                {agendamentoSelecionado.clienteNome.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className={styles.detalheNome}>{agendamentoSelecionado.clienteNome}</h3>
                <StatusBadge status={agendamentoSelecionado.status} />
              </div>
            </div>

            <div className={styles.detalheGrid}>
              <div className={styles.detalheItem}>
                <Phone size={16} />
                <div>
                  <span className={styles.detalheLabel}>Telefone</span>
                  <span className={styles.detalheValor}>{agendamentoSelecionado.clienteTelefone}</span>
                </div>
              </div>
              <div className={styles.detalheItem}>
                <Mail size={16} />
                <div>
                  <span className={styles.detalheLabel}>E-mail</span>
                  <span className={styles.detalheValor}>{agendamentoSelecionado.clienteEmail}</span>
                </div>
              </div>
              <div className={styles.detalheItem}>
                <FileText size={16} />
                <div>
                  <span className={styles.detalheLabel}>Serviço</span>
                  <span className={styles.detalheValor}>{agendamentoSelecionado.servico.nome}</span>
                </div>
              </div>
              <div className={styles.detalheItem}>
                <User size={16} />
                <div>
                  <span className={styles.detalheLabel}>Profissional</span>
                  <span className={styles.detalheValor}>{agendamentoSelecionado.profissional.nome}</span>
                </div>
              </div>
              <div className={styles.detalheItem}>
                <Calendar size={16} />
                <div>
                  <span className={styles.detalheLabel}>Data</span>
                  <span className={styles.detalheValor}>{new Date(agendamentoSelecionado.data).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className={styles.detalheItem}>
                <Clock size={16} />
                <div>
                  <span className={styles.detalheLabel}>Horário</span>
                  <span className={styles.detalheValor}>{agendamentoSelecionado.hora}</span>
                </div>
              </div>
            </div>

            <div className={styles.detalheFooter}>
              <div className={styles.detalheTotal}>
                <span>Valor total</span>
                <span className={styles.detalheTotalValor}>R$ {agendamentoSelecionado.servico.preco.toFixed(2)}</span>
              </div>
              {agendamentoSelecionado.observacoes && (
                <div className={styles.detalheObs} style={{marginTop: '1rem'}}>
                  <span className={styles.detalheLabel}>Observações</span>
                  <p>{agendamentoSelecionado.observacoes}</p>
                </div>
              )}
              {agendamentoSelecionado.motivoCancelamento && (
                <div className={styles.detalheObs} style={{marginTop: '1rem', color: '#ff7675'}}>
                  <span className={styles.detalheLabel} style={{color: '#ff7675'}}>Motivo da Desmarcação</span>
                  <p>{agendamentoSelecionado.motivoCancelamento}</p>
                </div>
              )}

              {(agendamentoSelecionado.status === 'pendente' || agendamentoSelecionado.status === 'confirmado') && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  {!cancelando ? (
                    <button 
                      onClick={() => setCancelando(true)}
                      style={{ background: 'transparent', border: '1px solid #d63031', color: '#d63031', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Desmarcar Atendimento
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#8b8b9e' }}>Motivo da desmarcação:</label>
                      <textarea 
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
                        placeholder="Ex: Profissional teve imprevisto..."
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setCancelando(false)} style={{ background: 'transparent', color: '#8b8b9e', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                        <button onClick={confirmarCancelamento} style={{ background: '#d63031', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Confirmar Desmarcação</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
