'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, ArrowRight, Scissors, Sparkles, Heart } from 'lucide-react';
import { estabelecimentos } from '@/data/mock';
import { CategoriaEstabelecimento } from '@/types';
import StarRating from '@/components/StarRating/StarRating';
import styles from './explorar.module.css';

const categoriaLabels: Record<CategoriaEstabelecimento, string> = {
  barbearia: 'Barbearia',
  salao: 'Salão de Beleza',
  clinica: 'Clínica Estética',
  estetica: 'Estética',
  outro: 'Outro',
};

const categoriaIcons: Record<CategoriaEstabelecimento, typeof Scissors> = {
  barbearia: Scissors,
  salao: Sparkles,
  clinica: Heart,
  estetica: Sparkles,
  outro: Sparkles,
};

export default function ExplorarPage() {
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaEstabelecimento | ''>('');

  const resultados = useMemo(() => {
    return estabelecimentos.filter((e) => {
      const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase()) ||
        e.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = !filtroCategoria || e.categoria === filtroCategoria;
      return matchBusca && matchCategoria;
    });
  }, [busca, filtroCategoria]);

  const categorias = Array.from(new Set(estabelecimentos.map((e) => e.categoria)));

  return (
    <div className={styles.page}>
      <div className={styles.heroSection}>
        <h1 className={styles.title}>Encontre o lugar perfeito</h1>
        <p className={styles.subtitle}>Descubra estabelecimentos e agende serviços com um toque</p>

        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nome ou serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.searchInput}
            id="input-busca-estabelecimentos"
          />
        </div>

        <div className={styles.filtros}>
          <button
            className={`${styles.filtroBtn} ${filtroCategoria === '' ? styles.filtroBtnAtivo : ''}`}
            onClick={() => setFiltroCategoria('')}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`${styles.filtroBtn} ${filtroCategoria === cat ? styles.filtroBtnAtivo : ''}`}
              onClick={() => setFiltroCategoria(cat)}
            >
              {categoriaLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.resultados}>
        <span className={styles.count}>{resultados.length} estabelecimento{resultados.length !== 1 ? 's' : ''}</span>

        <div className={styles.grid}>
          {resultados.map((est, i) => {
            const CatIcon = categoriaIcons[est.categoria];
            return (
              <div key={est.id} className={styles.card} style={{ animationDelay: `${i * 80}ms` }}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLogo}>{est.logo}</div>
                  <span className={styles.cardCategoria}>
                    <CatIcon size={12} />
                    {categoriaLabels[est.categoria]}
                  </span>
                </div>

                <h3 className={styles.cardNome}>{est.nome}</h3>
                <p className={styles.cardDesc}>{est.descricao}</p>

                <div className={styles.cardMeta}>
                  <StarRating nota={est.notaMedia} tamanho={14} />
                  <span className={styles.cardAvaliacoes}>({est.totalAvaliacoes})</span>
                </div>

                <div className={styles.cardEndereco}>
                  <MapPin size={14} />
                  <span>{est.endereco}</span>
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/cliente/estabelecimento/${est.id}`} className={styles.btnPerfil}>
                    Ver Perfil
                  </Link>
                  <Link href={`/cliente/agendar/${est.id}`} className={styles.btnAgendar}>
                    Agendar
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
