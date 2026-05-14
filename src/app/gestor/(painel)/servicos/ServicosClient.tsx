'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Clock, DollarSign } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { apiFetch, describeApiError } from '@/lib/api-client';
import type { ServicoView } from '@/server/repositories/_view-models';
import styles from './servicos.module.css';

interface Props {
  servicos: ServicoView[];
  locale: string;
  currency: string;
}

export default function ServicosClient({ servicos: initial, locale, currency }: Props) {
  const [servicosList, setServicosList] = useState<ServicoView[]>(initial);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ServicoView | null>(null);
  const [excluindo, setExcluindo] = useState<ServicoView | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);

  const abrirNovoServico = () => {
    setEditando(null);
    setNome('');
    setDescricao('');
    setPreco('');
    setDuracao('');
    setErro('');
    setModalAberto(true);
  };

  const abrirEdicao = (servico: ServicoView) => {
    setEditando(servico);
    setNome(servico.nome);
    setDescricao(servico.descricao);
    setPreco(servico.preco.toString());
    setDuracao(servico.duracao.toString());
    setErro('');
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = {
        nome,
        descricao,
        precoCentavos: Math.round(parseFloat(preco) * 100),
        duracaoMinutos: parseInt(duracao, 10),
      };
      const url = editando ? `/api/gestor/servicos/${editando.id}` : '/api/gestor/servicos';
      const method = editando ? 'PATCH' : 'POST';
      const data = await apiFetch<ServicoView>(url, { method, json: payload });
      if (editando) {
        setServicosList((prev) => prev.map((s) => (s.id === editando.id ? data : s)));
      } else {
        setServicosList((prev) => [...prev, data]);
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
      await apiFetch(`/api/gestor/servicos/${excluindo.id}`, { method: 'DELETE' });
      setServicosList((prev) => prev.filter((s) => s.id !== excluindo.id));
      setExcluindo(null);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <span className={styles.count}>{servicosList.length} serviço{servicosList.length !== 1 ? 's' : ''} cadastrado{servicosList.length !== 1 ? 's' : ''}</span>
          <button className="btn-primary" onClick={abrirNovoServico} id="btn-novo-servico">
            <Plus size={18} />
            Novo Serviço
          </button>
        </div>

        <div className={styles.grid}>
          {servicosList.map((servico, index) => (
            <div
              key={servico.id}
              className={styles.card}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardNome}>{servico.nome}</h3>
                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => abrirEdicao(servico)}
                    aria-label={`Editar ${servico.nome}`}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => setExcluindo(servico)}
                    aria-label={`Excluir ${servico.nome}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className={styles.cardDescricao}>{servico.descricao}</p>
              <div className={styles.cardFooter}>
                <div className={styles.cardTag}>
                  <DollarSign size={14} />
                  <span>{fmtMoney(servico.preco)}</span>
                </div>
                <div className={styles.cardTag}>
                  <Clock size={14} />
                  <span>{servico.duracao} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal aberto={!!excluindo} onFechar={() => setExcluindo(null)} titulo="Excluir Serviço" largura="sm">
        {excluindo && (
          <div className={styles.excluirForm}>
            <p className={styles.excluirTexto}>
              Tem certeza que deseja excluir o serviço <strong>{excluindo.nome}</strong>?
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
        titulo={editando ? 'Editar Serviço' : 'Novo Serviço'}
      >
        <form className={styles.form} onSubmit={salvar} id="form-servico">
          <div className={styles.field}>
            <label className="label" htmlFor="servico-nome">Nome do serviço</label>
            <input
              id="servico-nome"
              className="input-field"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Corte Masculino"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="servico-descricao">Descrição</label>
            <textarea
              id="servico-descricao"
              className={`input-field ${styles.textarea}`}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o serviço..."
              rows={3}
              required
            />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className="label" htmlFor="servico-preco">Preço (R$)</label>
              <input
                id="servico-preco"
                className="input-field"
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className={styles.field}>
              <label className="label" htmlFor="servico-duracao">Duração (min)</label>
              <input
                id="servico-duracao"
                className="input-field"
                type="number"
                min="5"
                step="5"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>
          {erro && <p style={{ color: '#ff7675', fontSize: '0.85rem' }}>{erro}</p>}
          <div className={styles.formActions}>
            <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)} disabled={salvando}>Cancelar</button>
            <button type="submit" className="btn-primary" id="btn-salvar-servico" disabled={salvando}>
              {salvando ? 'Salvando...' : (editando ? 'Salvar Alterações' : 'Cadastrar Serviço')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
