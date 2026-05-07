'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Phone, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import { getProfissionaisByEstabelecimento } from '@/data/mock';
import { Profissional } from '@/types';
import styles from './profissionais.module.css';

export default function ProfissionaisPage() {
  const [profissionaisList, setProfissionaisList] = useState<Profissional[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Profissional | null>(null);
  const [estabelecimentoId, setEstabelecimentoId] = useState('');

  useEffect(() => {
    const data = sessionStorage.getItem('gestorLogado');
    if (data) {
      const g = JSON.parse(data);
      setEstabelecimentoId(g.estabelecimentoId);
      setProfissionaisList(getProfissionaisByEstabelecimento(g.estabelecimentoId));
    }
  }, []);

  // Form state
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
    setModalAberto(true);
  };

  const abrirEdicao = (profissional: Profissional) => {
    setEditando(profissional);
    setNome(profissional.nome);
    setEspecialidade(profissional.especialidade);
    setTelefone(profissional.telefone);
    setEmail(profissional.email);
    setModalAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      setProfissionaisList((prev) =>
        prev.map((p) =>
          p.id === editando.id
            ? { ...p, nome, especialidade, telefone, email }
            : p
        )
      );
    } else {
      const novo: Profissional = {
        id: Date.now().toString(),
        estabelecimentoId: estabelecimentoId,
        nome,
        especialidade,
        telefone,
        email,
        avatar: nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(),
        ativo: true,
      };
      setProfissionaisList((prev) => [...prev, novo]);
    }
    setModalAberto(false);
  };

  const excluir = (id: string) => {
    setProfissionaisList((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleAtivo = (id: string) => {
    setProfissionaisList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p))
    );
  };

  return (
    <>
      <Header titulo="Profissionais" subtitulo="Cadastre e gerencie sua equipe de profissionais" />

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
                    onClick={() => excluir(prof.id)}
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
                  onClick={() => toggleAtivo(prof.id)}
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

      {/* Modal de Cadastro/Edição */}
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
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-0000"
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
          <div className={styles.formActions}>
            <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" id="btn-salvar-profissional">
              {editando ? 'Salvar Alterações' : 'Cadastrar Profissional'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
