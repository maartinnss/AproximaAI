'use client';

import { use } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Phone, Mail, ArrowLeft, ArrowRight, DollarSign, Users } from 'lucide-react';
import { getEstabelecimentoById, getServicosByEstabelecimento, getProfissionaisByEstabelecimento, getAvaliacoesByEstabelecimento } from '@/data/mock';
import StarRating from '@/components/StarRating/StarRating';
import styles from './perfil.module.css';

export default function PerfilEstabelecimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const est = getEstabelecimentoById(id);
  const servicos = getServicosByEstabelecimento(id);
  const profissionais = getProfissionaisByEstabelecimento(id).filter((p) => p.ativo);
  const avaliacoes = getAvaliacoesByEstabelecimento(id);

  if (!est) {
    return (
      <div className={styles.page}>
        <p>Estabelecimento não encontrado.</p>
        <Link href="/cliente/explorar">Voltar</Link>
      </div>
    );
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasAberto = est.horarioFuncionamento.diasSemana.map((d) => diasSemana[d]).join(', ');

  return (
    <div className={styles.page}>
      <Link href="/cliente/explorar" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Voltar</span>
      </Link>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLogo}>{est.logo}</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroNome}>{est.nome}</h1>
          <div className={styles.heroRating}>
            <StarRating nota={est.notaMedia} tamanho={18} />
            <span className={styles.heroAvaliacoes}>({est.totalAvaliacoes} avaliações)</span>
          </div>
          <p className={styles.heroDesc}>{est.descricao}</p>
          <div className={styles.heroMeta}>
            <span><MapPin size={14} /> {est.endereco}</span>
            <span><Phone size={14} /> {est.telefone}</span>
            <span><Clock size={14} /> {est.horarioFuncionamento.abertura} - {est.horarioFuncionamento.fechamento}</span>
            <span><Mail size={14} /> {est.email}</span>
          </div>
          <p className={styles.heroDias}>{diasAberto}</p>
        </div>
        <Link href={`/cliente/agendar/${est.id}`} className={styles.heroBtnAgendar}>
          Agendar Agora <ArrowRight size={18} />
        </Link>
      </div>

      {/* Serviços */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><DollarSign size={20} /> Serviços Oferecidos</h2>
        <div className={styles.servicosGrid}>
          {servicos.map((s) => (
            <div key={s.id} className={styles.servicoCard}>
              <div className={styles.servicoTop}>
                <h3>{s.nome}</h3>
                <span className={styles.servicoPreco}>R$ {s.preco.toFixed(2)}</span>
              </div>
              <p className={styles.servicoDesc}>{s.descricao}</p>
              <span className={styles.servicoDuracao}><Clock size={12} /> {s.duracao} min</span>
            </div>
          ))}
        </div>
      </section>

      {/* Profissionais */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Users size={20} /> Nossa Equipe</h2>
        <div className={styles.profGrid}>
          {profissionais.map((p) => (
            <div key={p.id} className={styles.profCard}>
              <div className={styles.profAvatar}>{p.avatar}</div>
              <h3 className={styles.profNome}>{p.nome}</h3>
              <span className={styles.profEsp}>{p.especialidade}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Avaliações */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⭐ Avaliações dos Clientes</h2>
        <div className={styles.avaliacoesLista}>
          {avaliacoes.map((av) => (
            <div key={av.id} className={styles.avaliacaoCard}>
              <div className={styles.avaliacaoTop}>
                <div className={styles.avaliacaoAvatar}>{av.clienteAvatar}</div>
                <div>
                  <span className={styles.avaliacaoNome}>{av.clienteNome}</span>
                  <StarRating nota={av.nota} tamanho={12} mostrarNumero={false} />
                </div>
                <span className={styles.avaliacaoData}>{new Date(av.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className={styles.avaliacaoComentario}>{av.comentario}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Botão flutuante mobile */}
      <Link href={`/cliente/agendar/${est.id}`} className={styles.fabAgendar}>
        Agendar <ArrowRight size={16} />
      </Link>
    </div>
  );
}
