'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Clock, DollarSign } from 'lucide-react';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import { getServicosByEstabelecimento } from '@/data/mock';
import { Servico } from '@/types';
import styles from './servicos.module.css';

export default function ServicosPage() {
  const [servicosList, setServicosList] = useState<Servico[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [excluindo, setExcluindo] = useState<Servico | null>(null);
  const [estabelecimentoId, setEstabelecimentoId] = useState('');

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      setEstabelecimentoId(g.estabelecimentoId);
      setServicosList(getServicosByEstabelecimento(g.estabelecimentoId));
    }
  }, []);

  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  const abrirNovoServico = () => {
    setEditando(null);
    setNome('');
    setDescricao('');
    setPreco('');
    setDuracao('');
    setModalAberto(true);
  };

  const abrirEdicao = (servico: Servico) => {
    setEditando(servico);
    setNome(servico.nome);
    setDescricao(servico.descricao);
    setPreco(servico.preco.toString());
    setDuracao(servico.duracao.toString());
    setModalAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      setServicosList((prev) =>
        prev.map((s) =>
          s.id === editando.id
            ? { ...s, nome, descricao, preco: parseFloat(preco), duracao: parseInt(duracao) }
            : s
        )
      );
    } else {
      const novo: Servico = {
        id: Date.now().toString(),
        estabelecimentoId: estabelecimentoId,
        nome,
        descricao,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
      };
      setServicosList((prev) => [...prev, novo]);
    }
    setModalAberto(false);
  };

  const excluir = () => {
    if (!excluindo) return;
    setServicosList((prev) => prev.filter((s) => s.id !== excluindo.id));
    setExcluindo(null);
  };

  return (
    <>
      <Header titulo="Serviços" subtitulo="Cadastre e gerencie os serviços oferecidos" />

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
                  <span>R$ {servico.preco.toFixed(2)}</span>
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

      {/* Modal de Confirmação de Exclusão */}
      <Modal aberto={!!excluindo} onFechar={() => setExcluindo(null)} titulo="Excluir Serviço" largura="sm">
        {excluindo && (
          <div className={styles.excluirForm}>
            <p className={styles.excluirTexto}>
              Tem certeza que deseja excluir o serviço <strong>{excluindo.nome}</strong>?
            </p>
            <p className={styles.excluirAviso}>Esta ação não pode ser desfeita.</p>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecundario} onClick={() => setExcluindo(null)}>Cancelar</button>
              <button type="button" className={styles.btnPerigo} onClick={excluir}>Excluir</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Cadastro/Edição */}
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
          <div className={styles.formActions}>
            <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" id="btn-salvar-servico">
              {editando ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
