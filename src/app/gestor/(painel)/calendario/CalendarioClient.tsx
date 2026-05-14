'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, CalendarDays, Clock } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import Modal from '@/components/Modal/Modal';
import { iniciaisAvatar } from '@/lib/format';
import { apiFetch, describeApiError } from '@/lib/api-client';
import type { StatusAgendamento } from '@/types';
import type {
  AgendamentoView,
  ProfissionalView,
} from '@/server/repositories/_view-models';
import styles from './calendario.module.css';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_COR: Record<StatusAgendamento, string> = {
  confirmado: '#3B82F6',
  pendente: '#F59E0B',
  concluido: '#94A3B8',
  cancelado: '#EF4444',
  no_show: '#7F1D1D',
};

function gerarGradeDias(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();

  const grade: { dia: number; mes: number; ano: number; atual: boolean }[] = [];

  for (let i = primeiroDia - 1; i >= 0; i--) {
    const mesPrev = mes - 1 < 0 ? 11 : mes - 1;
    const anoPrev = mes - 1 < 0 ? ano - 1 : ano;
    grade.push({ dia: diasMesAnterior - i, mes: mesPrev, ano: anoPrev, atual: false });
  }

  for (let d = 1; d <= ultimoDia; d++) {
    grade.push({ dia: d, mes, ano, atual: true });
  }

  let extra = 1;
  const mesNext = mes + 1 > 11 ? 0 : mes + 1;
  const anoNext = mes + 1 > 11 ? ano + 1 : ano;
  while (grade.length % 7 !== 0) {
    grade.push({ dia: extra++, mes: mesNext, ano: anoNext, atual: false });
  }

  return grade;
}

function toDateStr(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

interface Props {
  agendamentos: AgendamentoView[];
  profissionais: ProfissionalView[];
  locale: string;
  currency: string;
}

export default function CalendarioClient({
  agendamentos: initial,
  profissionais,
  locale,
  currency,
}: Props) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [diaSelecionado, setDiaSelecionado] = useState(
    toDateStr(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  );
  const [agendamentosList, setAgendamentosList] = useState<AgendamentoView[]>(initial);
  const [salvando, setSalvando] = useState(false);

  const [modalEditar, setModalEditar] = useState<AgendamentoView | null>(null);
  const [editData, setEditData] = useState('');
  const [editHora, setEditHora] = useState('');
  const [editStatus, setEditStatus] = useState<StatusAgendamento>('pendente');
  const [editProfId, setEditProfId] = useState('');
  const [editObs, setEditObs] = useState('');

  const [modalExcluir, setModalExcluir] = useState<AgendamentoView | null>(null);
  const [erro, setErro] = useState('');

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);

  const grade = useMemo(() => gerarGradeDias(mesAtual.ano, mesAtual.mes), [mesAtual]);

  const agPorDia = useMemo(() => {
    const mapa: Record<string, AgendamentoView[]> = {};
    agendamentosList.forEach((ag) => {
      if (!mapa[ag.data]) mapa[ag.data] = [];
      mapa[ag.data].push(ag);
    });
    return mapa;
  }, [agendamentosList]);

  const agsDoDia = useMemo(
    () => (agPorDia[diaSelecionado] || []).slice().sort((a, b) => a.hora.localeCompare(b.hora)),
    [diaSelecionado, agPorDia]
  );

  const navegarMes = (dir: number) => {
    setMesAtual((prev) => {
      let m = prev.mes + dir;
      let a = prev.ano;
      if (m < 0) { m = 11; a--; }
      if (m > 11) { m = 0; a++; }
      return { mes: m, ano: a };
    });
  };

  const abrirEditar = (ag: AgendamentoView) => {
    setEditData(ag.data);
    setEditHora(ag.hora);
    setEditStatus(ag.status);
    setEditProfId(ag.profissional.id);
    setEditObs(ag.observacoes || '');
    setModalEditar(ag);
  };

  const salvarEdicao = async () => {
    if (!modalEditar) return;
    setSalvando(true);
    setErro('');
    try {
      const updated = await apiFetch<AgendamentoView>(
        `/api/gestor/agendamentos/${modalEditar.id}`,
        {
          method: 'PATCH',
          json: {
            data: editData,
            hora: editHora,
            status: editStatus,
            profissionalId: editProfId,
            observacoes: editObs,
          },
        },
      );
      setAgendamentosList((prev) =>
        prev.map((a) => (a.id === modalEditar.id ? updated : a)),
      );
      if (editData !== modalEditar.data) setDiaSelecionado(editData);
      setModalEditar(null);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!modalExcluir) return;
    setSalvando(true);
    setErro('');
    try {
      await apiFetch(`/api/gestor/agendamentos/${modalExcluir.id}`, { method: 'DELETE' });
      setAgendamentosList((prev) => prev.filter((a) => a.id !== modalExcluir.id));
      setModalExcluir(null);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const hodieStr = toDateStr(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const diaSelecionadoFormatado = new Date(diaSelecionado + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className={styles.content}>
        <section className={styles.calendarioCard}>
          <div className={styles.mesNav}>
            <button className={styles.navBtn} onClick={() => navegarMes(-1)} aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </button>
            <h2 className={styles.mesLabel}>
              {MESES[mesAtual.mes]} {mesAtual.ano}
            </h2>
            <button className={styles.navBtn} onClick={() => navegarMes(1)} aria-label="Próximo mês">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.grade}>
            {DIAS_SEMANA.map((d) => (
              <div key={d} className={styles.diaHeader}>{d}</div>
            ))}

            {grade.map((cell, i) => {
              const dateStr = toDateStr(cell.ano, cell.mes, cell.dia);
              const ags = agPorDia[dateStr] || [];
              const isHoje = dateStr === hodieStr;
              const isSel = dateStr === diaSelecionado;

              return (
                <button
                  key={i}
                  className={[
                    styles.diaCell,
                    !cell.atual ? styles.outromes : '',
                    isHoje ? styles.hoje : '',
                    isSel ? styles.selecionado : '',
                  ].join(' ')}
                  onClick={() => setDiaSelecionado(dateStr)}
                  aria-label={`Selecionar dia ${cell.dia}`}
                  aria-pressed={isSel}
                >
                  <span className={styles.diaNum}>{cell.dia}</span>
                  {ags.length > 0 && (
                    <div className={styles.dots}>
                      {ags.slice(0, 3).map((ag, j) => (
                        <span
                          key={j}
                          className={styles.dot}
                          style={{ background: STATUS_COR[ag.status] }}
                        />
                      ))}
                      {ags.length > 3 && (
                        <span className={styles.dotMais}>+{ags.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.legenda}>
            {(['confirmado', 'pendente', 'concluido', 'cancelado'] as StatusAgendamento[]).map((s) => (
              <div key={s} className={styles.legendaItem}>
                <span className={styles.dot} style={{ background: STATUS_COR[s] }} />
                <span className={styles.legendaLabel}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.painelDia}>
          <div className={styles.painelHeader}>
            <CalendarDays size={18} className={styles.painelIcon} />
            <div>
              <h3 className={styles.painelTitulo}>{diaSelecionadoFormatado}</h3>
              <span className={styles.painelContagem}>
                {agsDoDia.length} agendamento{agsDoDia.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {agsDoDia.length === 0 ? (
            <div className={styles.vazio}>
              <CalendarDays size={36} />
              <p>Nenhum agendamento neste dia</p>
            </div>
          ) : (
            <div className={styles.agLista}>
              {agsDoDia.map((ag) => (
                <div key={ag.id} className={styles.agCard}>
                  <div className={styles.agHoraCol}>
                    <Clock size={13} />
                    <span className={styles.agHoraText}>{ag.hora}</span>
                    <span
                      className={styles.agStatusDot}
                      style={{ background: STATUS_COR[ag.status] }}
                    />
                  </div>
                  <div className={styles.agBody}>
                    <div className={styles.agTop}>
                      <div className={styles.agAvatar}>
                        {iniciaisAvatar(ag.clienteNome)}
                      </div>
                      <div className={styles.agMeta}>
                        <span className={styles.agNome}>{ag.clienteNome}</span>
                        <span className={styles.agDetalhe}>
                          {ag.servico.nome} · {ag.profissional.nome}
                        </span>
                      </div>
                      <div className={styles.agRight}>
                        <StatusBadge status={ag.status} />
                        <span className={styles.agValor}>{fmtMoney(ag.servico.preco)}</span>
                      </div>
                    </div>
                    <div className={styles.agAcoes}>
                      <button
                        className={styles.btnEditar}
                        onClick={() => abrirEditar(ag)}
                        aria-label={`Editar agendamento de ${ag.clienteNome}`}
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                      <button
                        className={styles.btnExcluir}
                        onClick={() => setModalExcluir(ag)}
                        aria-label={`Excluir agendamento de ${ag.clienteNome}`}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal aberto={!!modalEditar} onFechar={() => setModalEditar(null)} titulo="Editar Agendamento" largura="md">
        {modalEditar && (
          <div className={styles.editForm}>
            <div className={styles.editHeader}>
              <div className={styles.agAvatar}>
                {iniciaisAvatar(modalEditar.clienteNome)}
              </div>
              <div>
                <span className={styles.agNome}>{modalEditar.clienteNome}</span>
                <span className={styles.agDetalhe}>{modalEditar.servico.nome}</span>
              </div>
            </div>

            <div className={styles.editGrid}>
              <div className={styles.editField}>
                <label className={styles.editLabel} htmlFor="edit-data">Data</label>
                <input
                  id="edit-data"
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel} htmlFor="edit-hora">Horário</label>
                <input
                  id="edit-hora"
                  type="time"
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel} htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as StatusAgendamento)}
                  className={styles.editInput}
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel} htmlFor="edit-prof">Profissional</label>
                <select
                  id="edit-prof"
                  value={editProfId}
                  onChange={(e) => setEditProfId(e.target.value)}
                  className={styles.editInput}
                >
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.editField}>
              <label className={styles.editLabel} htmlFor="edit-obs">Observações</label>
              <textarea
                id="edit-obs"
                value={editObs}
                onChange={(e) => setEditObs(e.target.value)}
                className={`${styles.editInput} ${styles.editTextarea}`}
                placeholder="Observações opcionais..."
              />
            </div>

            {erro && (
              <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erro}</p>
            )}
            <div className={styles.editAcoes}>
              <button className={styles.btnSecundario} onClick={() => setModalEditar(null)} disabled={salvando}>
                Cancelar
              </button>
              <button className={styles.btnPrimario} onClick={salvarEdicao} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal aberto={!!modalExcluir} onFechar={() => setModalExcluir(null)} titulo="Excluir Agendamento" largura="sm">
        {modalExcluir && (
          <div className={styles.excluirForm}>
            <p className={styles.excluirTexto}>
              Tem certeza que deseja excluir o agendamento de{' '}
              <strong>{modalExcluir.clienteNome}</strong> —{' '}
              {modalExcluir.servico.nome} às {modalExcluir.hora}?
            </p>
            <p className={styles.excluirAviso}>Esta ação não pode ser desfeita.</p>
            {erro && (
              <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erro}</p>
            )}
            <div className={styles.editAcoes}>
              <button className={styles.btnSecundario} onClick={() => setModalExcluir(null)} disabled={salvando}>
                Cancelar
              </button>
              <button className={styles.btnPerigo} onClick={confirmarExclusao} disabled={salvando}>
                {salvando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
