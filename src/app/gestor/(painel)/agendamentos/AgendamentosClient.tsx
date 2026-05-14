'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Calendar, Clock, User, Phone, Mail, FileText, Plus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import Modal from '@/components/Modal/Modal';
import { maskTelefoneBR, unmaskTelefone, iniciaisAvatar } from '@/lib/format';
import { apiFetch, describeApiError } from '@/lib/api-client';
import type { StatusAgendamento } from '@/types';
import type {
  AgendamentoView,
  ProfissionalView,
  ServicoView,
} from '@/server/repositories/_view-models';
import styles from './agendamentos.module.css';

interface Props {
  agendamentos: AgendamentoView[];
  profissionais: ProfissionalView[];
  servicos: ServicoView[];
  locale: string;
  currency: string;
}

export default function AgendamentosClient({
  agendamentos: initial,
  profissionais,
  servicos,
  locale,
  currency,
}: Props) {
  const [agendamentosList, setAgendamentosList] = useState<AgendamentoView[]>(initial);
  const [busca, setBusca] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusAgendamento | ''>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoView | null>(null);
  const [modalDesmarcar, setModalDesmarcar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalNovo, setModalNovo] = useState(false);
  const [novoCliNome, setNovoCliNome] = useState('');
  const [novoCliTel, setNovoCliTel] = useState('');
  const [novoCliEmail, setNovoCliEmail] = useState('');
  const [novoServicoId, setNovoServicoId] = useState('');
  const [novoProfId, setNovoProfId] = useState('');
  const [novoData, setNovoData] = useState('');
  const [novoHora, setNovoHora] = useState('');
  const [novoObs, setNovoObs] = useState('');
  const [novoErro, setNovoErro] = useState('');

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentosList.filter((ag) => {
      const matchBusca = ag.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
        ag.servico.nome.toLowerCase().includes(busca.toLowerCase());
      const matchProfissional = !filtroProfissional || ag.profissional.id === filtroProfissional;
      const matchStatus = !filtroStatus || ag.status === filtroStatus;
      return matchBusca && matchProfissional && matchStatus;
    });
  }, [busca, filtroProfissional, filtroStatus, agendamentosList]);

  const abrirDetalhes = (ag: AgendamentoView) => {
    setAgendamentoSelecionado(ag);
    setMotivo('');
    setModalAberto(true);
  };

  const abrirDesmarcar = () => {
    setMotivo('');
    setModalAberto(false);
    setModalDesmarcar(true);
  };

  const [erroCancel, setErroCancel] = useState('');

  const confirmarCancelamento = async () => {
    setErroCancel('');
    if (!motivo.trim()) {
      setErroCancel('Informe o motivo da desmarcação.');
      return;
    }
    if (!agendamentoSelecionado) return;
    setSalvando(true);
    try {
      await apiFetch(
        `/api/gestor/agendamentos/${agendamentoSelecionado.id}/cancelar`,
        { method: 'POST', json: { motivo } },
      );
      setAgendamentosList((prev) =>
        prev.map((a) =>
          a.id === agendamentoSelecionado.id
            ? { ...a, status: 'cancelado', motivoCancelamento: motivo }
            : a,
        ),
      );
      setAgendamentoSelecionado((prev) =>
        prev ? { ...prev, status: 'cancelado', motivoCancelamento: motivo } : null,
      );
      setModalDesmarcar(false);
    } catch (err) {
      setErroCancel(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const abrirNovoAgendamento = () => {
    setNovoCliNome('');
    setNovoCliTel('');
    setNovoCliEmail('');
    setNovoServicoId(servicos[0]?.id ?? '');
    setNovoProfId(profissionais[0]?.id ?? '');
    setNovoData('');
    setNovoHora('');
    setNovoObs('');
    setNovoErro('');
    setModalNovo(true);
  };

  const criarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setNovoErro('');
    if (!novoServicoId || !novoProfId || !novoData || !novoHora) {
      setNovoErro('Preencha todos os campos obrigatórios.');
      return;
    }
    const telDigits = unmaskTelefone(novoCliTel);
    if (telDigits.length < 10 || telDigits.length > 11) {
      setNovoErro('Telefone inválido. Use (XX) XXXXX-XXXX.');
      return;
    }
    setSalvando(true);
    try {
      const created = await apiFetch<AgendamentoView>('/api/gestor/agendamentos', {
        method: 'POST',
        json: {
          clienteNome: novoCliNome,
          clienteTelefone: novoCliTel,
          clienteEmail: novoCliEmail || undefined,
          servicoId: novoServicoId,
          profissionalId: novoProfId,
          data: novoData,
          hora: novoHora,
          observacoes: novoObs || undefined,
        },
      });
      setAgendamentosList((prev) => [created, ...prev]);
      setModalNovo(false);
    } catch (err) {
      setNovoErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div className={styles.content}>
        <div className={styles.topActions} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn-primary" onClick={abrirNovoAgendamento} id="btn-novo-agendamento">
            <Plus size={18} />
            Novo Agendamento
          </button>
        </div>
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
                {profissionais.map((p) => (
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

        <div className={styles.contagem}>
          <span>{agendamentosFiltrados.length} agendamento{agendamentosFiltrados.length !== 1 ? 's' : ''} encontrado{agendamentosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>

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
                          {iniciaisAvatar(ag.clienteNome)}
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
                        {new Date(ag.data + 'T12:00:00').toLocaleDateString(locale)}
                        <Clock size={14} />
                        {ag.hora}
                      </div>
                    </td>
                    <td className={styles.valorCell}>{fmtMoney(ag.servico.preco)}</td>
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
                {iniciaisAvatar(agendamentoSelecionado.clienteNome)}
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
                  <span className={styles.detalheValor}>{agendamentoSelecionado.clienteEmail || '—'}</span>
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
                  <span className={styles.detalheValor}>{new Date(agendamentoSelecionado.data + 'T12:00:00').toLocaleDateString(locale)}</span>
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
                <span className={styles.detalheTotalValor}>{fmtMoney(agendamentoSelecionado.servico.preco)}</span>
              </div>
              {agendamentoSelecionado.observacoes && (
                <div className={styles.detalheObs} style={{ marginTop: '1rem' }}>
                  <span className={styles.detalheLabel}>Observações</span>
                  <p>{agendamentoSelecionado.observacoes}</p>
                </div>
              )}
              {agendamentoSelecionado.motivoCancelamento && (
                <div className={styles.detalheObs} style={{ marginTop: '1rem', color: '#ff7675' }}>
                  <span className={styles.detalheLabel} style={{ color: '#ff7675' }}>Motivo da Desmarcação</span>
                  <p>{agendamentoSelecionado.motivoCancelamento}</p>
                </div>
              )}

              {(agendamentoSelecionado.status === 'pendente' || agendamentoSelecionado.status === 'confirmado') && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <button className={styles.btnDesmarcar} onClick={abrirDesmarcar}>
                    Desmarcar Atendimento
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        aberto={modalNovo}
        onFechar={() => setModalNovo(false)}
        titulo="Novo Agendamento"
        largura="md"
      >
        <form onSubmit={criarAgendamento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Nome do cliente</label>
              <input
                className="input-field"
                type="text"
                value={novoCliNome}
                onChange={(e) => setNovoCliNome(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                className="input-field"
                type="tel"
                value={novoCliTel}
                onChange={(e) => setNovoCliTel(maskTelefoneBR(e.target.value))}
                placeholder="(11) 98765-0000"
                inputMode="numeric"
                maxLength={15}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">E-mail (opcional)</label>
            <input
              className="input-field"
              type="email"
              value={novoCliEmail}
              onChange={(e) => setNovoCliEmail(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Serviço</label>
              <select
                className="input-field"
                value={novoServicoId}
                onChange={(e) => setNovoServicoId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome} — {s.duracao}min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Profissional</label>
              <select
                className="input-field"
                value={novoProfId}
                onChange={(e) => setNovoProfId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Data</label>
              <input
                className="input-field"
                type="date"
                value={novoData}
                onChange={(e) => setNovoData(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Horário</label>
              <input
                className="input-field"
                type="time"
                value={novoHora}
                onChange={(e) => setNovoHora(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea
              className="input-field"
              value={novoObs}
              onChange={(e) => setNovoObs(e.target.value)}
              rows={2}
            />
          </div>
          {novoErro && <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{novoErro}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setModalNovo(false)} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar Agendamento'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={modalDesmarcar}
        onFechar={() => setModalDesmarcar(false)}
        titulo="Desmarcar Atendimento"
        largura="sm"
      >
        {agendamentoSelecionado && (
          <div className={styles.desmarcarForm}>
            <p className={styles.desmarcarTexto}>
              Desmarcando atendimento de <strong>{agendamentoSelecionado.clienteNome}</strong> —{' '}
              {agendamentoSelecionado.servico.nome} às {agendamentoSelecionado.hora}.
            </p>
            <div className={styles.desmarcarField}>
              <label className={styles.desmarcarLabel}>Motivo da desmarcação</label>
              <textarea
                className={styles.desmarcarTextarea}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Profissional teve imprevisto..."
                rows={3}
              />
            </div>
            <p className={styles.desmarcarAviso}>Esta ação não pode ser desfeita.</p>
            {erroCancel && (
              <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erroCancel}</p>
            )}
            <div className={styles.desmarcarAcoes}>
              <button type="button" className={styles.btnSecundario} onClick={() => setModalDesmarcar(false)} disabled={salvando}>Cancelar</button>
              <button type="button" className={styles.btnPerigo} onClick={confirmarCancelamento} disabled={salvando}>
                {salvando ? 'Desmarcando...' : 'Confirmar Desmarcação'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
