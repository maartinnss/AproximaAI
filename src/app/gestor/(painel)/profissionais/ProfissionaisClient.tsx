'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Phone, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { maskTelefoneBR, unmaskTelefone } from '@/lib/format';
import { apiFetch, describeApiError } from '@/lib/api-client';
import type { ProfissionalView } from '@/server/repositories/_view-models';
import styles from './profissionais.module.css';

interface Props {
  profissionais: ProfissionalView[];
}

export default function ProfissionaisClient({ profissionais: initial }: Props) {
  const [profissionaisList, setProfissionaisList] = useState<ProfissionalView[]>(initial);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProfissionalView | null>(null);
  const [excluindo, setExcluindo] = useState<ProfissionalView | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const abrirNovoProfissional = () => {
    setEditando(null);
    setNome('');
    setEspecialidade('');
    setTelefone('');
    setEmail('');
    setErro('');
    setModalAberto(true);
  };

  const abrirEdicao = (profissional: ProfissionalView) => {
    setEditando(profissional);
    setNome(profissional.nome);
    setEspecialidade(profissional.especialidade);
    setTelefone(maskTelefoneBR(profissional.telefone));
    setEmail(profissional.email);
    setErro('');
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const telDigits = unmaskTelefone(telefone);
    if (telDigits.length < 10 || telDigits.length > 11) {
      setErro('Telefone inválido. Use (XX) XXXXX-XXXX.');
      return;
    }
    setSalvando(true);
    try {
      const url = editando
        ? `/api/gestor/profissionais/${editando.id}`
        : '/api/gestor/profissionais';
      const method = editando ? 'PATCH' : 'POST';
      const data = await apiFetch<ProfissionalView>(url, {
        method,
        json: { nome, especialidade, telefone, email },
      });
      if (editando) {
        setProfissionaisList((prev) => prev.map((p) => (p.id === editando.id ? data : p)));
      } else {
        setProfissionaisList((prev) => [...prev, data]);
      }
      setModalAberto(false);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!excluindo) return;
    setSalvando(true);
    setErro('');
    try {
      await apiFetch(`/api/gestor/profissionais/${excluindo.id}`, { method: 'DELETE' });
      setProfissionaisList((prev) => prev.filter((p) => p.id !== excluindo.id));
      setExcluindo(null);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    const snapshot = profissionaisList;
    setProfissionaisList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)),
    );
    try {
      await apiFetch(`/api/gestor/profissionais/${id}`, {
        method: 'PATCH',
        json: { ativo: !ativo },
      });
    } catch (err) {
      // Rollback otimista
      setProfissionaisList(snapshot);
      setErro(describeApiError(err));
    }
  };

  return (
    <>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <span className={styles.count}>
            {profissionaisList.length} profissiona{profissionaisList.length !== 1 ? 'is' : 'l'} cadastrado{profissionaisList.length !== 1 ? 's' : ''}
          </span>
          <button className="btn-primary" onClick={abrirNovoProfissional} id="btn-novo-profissional">
            <Plus size={18} />
            Novo Profissional
          </button>
        </div>

        {erro && !modalAberto && !excluindo && (
          <p style={{ color: '#ff7675', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{erro}</p>
        )}

        <div className={styles.grid}>
          {profissionaisList.map((prof, index) => (
            <div
              key={prof.id}
              className={`${styles.card} ${!prof.ativo ? styles.inativo : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={styles.cardTop}>
                <div className={styles.avatarWrap}>
                  <div className={`${styles.avatar} ${prof.ativo ? styles.avatarAtivo : ''}`}>
                    {prof.avatar}
                  </div>
                  <span className={`${styles.statusDot} ${prof.ativo ? styles.online : styles.offline}`} />
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => abrirEdicao(prof)}
                    aria-label={`Editar ${prof.nome}`}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => setExcluindo(prof)}
                    aria-label={`Excluir ${prof.nome}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardNome}>{prof.nome}</h3>
                <span className={styles.cardEspecialidade}>{prof.especialidade}</span>
              </div>

              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <Phone size={14} />
                  <span>{prof.telefone}</span>
                </div>
                <div className={styles.infoItem}>
                  <Mail size={14} />
                  <span>{prof.email}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={`${styles.toggleBtn} ${prof.ativo ? styles.toggleAtivo : styles.toggleInativo}`}
                  onClick={() => toggleAtivo(prof.id, prof.ativo)}
                  aria-label={prof.ativo ? 'Desativar profissional' : 'Ativar profissional'}
                >
                  {prof.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>{prof.ativo ? 'Ativo' : 'Inativo'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal aberto={!!excluindo} onFechar={() => setExcluindo(null)} titulo="Excluir Profissional" largura="sm">
        {excluindo && (
          <div className={styles.excluirForm}>
            <p className={styles.excluirTexto}>
              Tem certeza que deseja excluir o profissional <strong>{excluindo.nome}</strong>?
            </p>
            <p className={styles.excluirAviso}>Esta ação não pode ser desfeita.</p>
            {erro && <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erro}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecundario} onClick={() => setExcluindo(null)} disabled={salvando}>Cancelar</button>
              <button type="button" className={styles.btnPerigo} onClick={excluir} disabled={salvando}>
                {salvando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? 'Editar Profissional' : 'Novo Profissional'}
      >
        <form className={styles.form} onSubmit={salvar} id="form-profissional">
          <div className={styles.field}>
            <label className="label" htmlFor="prof-nome">Nome completo</label>
            <input
              id="prof-nome"
              className="input-field"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="prof-especialidade">Especialidade</label>
            <input
              id="prof-especialidade"
              className="input-field"
              type="text"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex: Corte Masculino"
              required
            />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className="label" htmlFor="prof-telefone">Telefone</label>
              <input
                id="prof-telefone"
                className="input-field"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(maskTelefoneBR(e.target.value))}
                placeholder="(11) 99999-0000"
                inputMode="numeric"
                maxLength={15}
                required
              />
            </div>
            <div className={styles.field}>
              <label className="label" htmlFor="prof-email">E-mail</label>
              <input
                id="prof-email"
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>
          {erro && <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erro}</p>}
          <div className={styles.formActions}>
            <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)} disabled={salvando}>Cancelar</button>
            <button type="submit" className="btn-primary" id="btn-salvar-profissional" disabled={salvando}>
              {salvando ? 'Salvando...' : (editando ? 'Salvar Alterações' : 'Cadastrar Profissional')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
