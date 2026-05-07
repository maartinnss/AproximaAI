'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock, DollarSign, Calendar, User } from 'lucide-react';
import { getEstabelecimentoById, getServicosByEstabelecimento, getProfissionaisByEstabelecimento } from '@/data/mock';
import { Servico, Profissional, Agendamento } from '@/types';
import Stepper from '@/components/Stepper/Stepper';
import styles from './agendar.module.css';

const ETAPAS = ['Serviço', 'Profissional', 'Data / Hora', 'Confirmar'];

function gerarDatas(): { label: string; valor: string }[] {
  const datas: { label: string; valor: string }[] = [];
  const hoje = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    datas.push({
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      valor: d.toISOString().split('T')[0],
    });
  }
  return datas;
}

function gerarHorarios(): string[] {
  const h: string[] = [];
  for (let i = 9; i <= 18; i++) {
    h.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 18) h.push(`${String(i).padStart(2, '0')}:30`);
  }
  return h;
}

export default function AgendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const est = getEstabelecimentoById(id);
  const servicos = getServicosByEstabelecimento(id);
  const profs = getProfissionaisByEstabelecimento(id).filter((p) => p.ativo);

  const [etapa, setEtapa] = useState(0);
  const [servicoSel, setServicoSel] = useState<Servico | null>(null);
  const [profSel, setProfSel] = useState<Profissional | null>(null);
  const [dataSel, setDataSel] = useState('');
  const [horaSel, setHoraSel] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  const datas = useMemo(() => gerarDatas(), []);
  const horarios = useMemo(() => gerarHorarios(), []);

  if (!est) return <div className={styles.page}><p>Estabelecimento não encontrado.</p></div>;

  const podeAvancar = () => {
    if (etapa === 0) return !!servicoSel;
    if (etapa === 1) return !!profSel;
    if (etapa === 2) return !!dataSel && !!horaSel;
    return true;
  };

  const avancar = () => { if (podeAvancar() && etapa < 3) setEtapa(etapa + 1); };
  const voltar = () => { if (etapa > 0) setEtapa(etapa - 1); };

  const confirmar = () => {
    const clienteData = sessionStorage.getItem('clienteLogado');
    // Fallback caso não encontre (o padrão do mock cli-1)
    let cliente = { id: 'cli-1', nome: 'João Pedro Almeida', telefone: '(11) 98765-1001', email: 'joao@email.com' };
    if (clienteData) {
      cliente = JSON.parse(clienteData);
    }

    if (servicoSel && profSel) {
      const novoAgendamento: Agendamento = {
        id: `novo-${Date.now()}`,
        estabelecimentoId: est?.id || '',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone,
        clienteEmail: cliente.email,
        servico: servicoSel,
        profissional: profSel,
        data: dataSel,
        hora: horaSel,
        status: 'confirmado',
      };

      const existentesStr = sessionStorage.getItem('novosAgendamentos');
      const existentes = existentesStr ? JSON.parse(existentesStr) : [];
      sessionStorage.setItem('novosAgendamentos', JSON.stringify([...existentes, novoAgendamento]));
    }

    setConfirmado(true);
    setTimeout(() => router.push('/cliente/agendamentos'), 2000);
  };

  if (confirmado) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmadoBox}>
          <div className={styles.confirmadoIcon}><Check size={40} /></div>
          <h2>Agendamento Confirmado!</h2>
          <p>Você será redirecionado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href={`/cliente/estabelecimento/${id}`} className={styles.backLink}>
        <ArrowLeft size={16} /> Voltar para {est.nome}
      </Link>

      <h1 className={styles.title}>Agendar em {est.nome}</h1>

      <Stepper etapas={ETAPAS} etapaAtual={etapa} />

      <div className={styles.content}>
        {/* Step 1: Serviço */}
        {etapa === 0 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Escolha o serviço</h2>
            <div className={styles.servicosGrid}>
              {servicos.map((s) => (
                <button key={s.id} className={`${styles.servicoCard} ${servicoSel?.id === s.id ? styles.selecionado : ''}`} onClick={() => setServicoSel(s)} type="button">
                  <h3>{s.nome}</h3>
                  <p>{s.descricao}</p>
                  <div className={styles.servicoMeta}>
                    <span><DollarSign size={14} /> R$ {s.preco.toFixed(2)}</span>
                    <span><Clock size={14} /> {s.duracao} min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Profissional */}
        {etapa === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Escolha o profissional</h2>
            <div className={styles.profsGrid}>
              {profs.map((p) => (
                <button key={p.id} className={`${styles.profCard} ${profSel?.id === p.id ? styles.selecionado : ''}`} onClick={() => setProfSel(p)} type="button">
                  <div className={styles.profAvatar}>{p.avatar}</div>
                  <h3>{p.nome}</h3>
                  <span>{p.especialidade}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Data e Hora */}
        {etapa === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Escolha data e horário</h2>
            <div className={styles.datasGrid}>
              {datas.map((d) => (
                <button key={d.valor} className={`${styles.dataBtn} ${dataSel === d.valor ? styles.selecionado : ''}`} onClick={() => setDataSel(d.valor)} type="button">
                  <Calendar size={14} />
                  {d.label}
                </button>
              ))}
            </div>
            {dataSel && (
              <>
                <h3 className={styles.horariosLabel}>Horários disponíveis</h3>
                <div className={styles.horariosGrid}>
                  {horarios.map((h) => (
                    <button key={h} className={`${styles.horaBtn} ${horaSel === h ? styles.selecionado : ''}`} onClick={() => setHoraSel(h)} type="button">{h}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Confirmação */}
        {etapa === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Confirme seu agendamento</h2>
            <div className={styles.resumo}>
              <div className={styles.resumoItem}><DollarSign size={16} /><div><span className={styles.resumoLabel}>Serviço</span><span className={styles.resumoValor}>{servicoSel?.nome} — R$ {servicoSel?.preco.toFixed(2)}</span></div></div>
              <div className={styles.resumoItem}><User size={16} /><div><span className={styles.resumoLabel}>Profissional</span><span className={styles.resumoValor}>{profSel?.nome}</span></div></div>
              <div className={styles.resumoItem}><Calendar size={16} /><div><span className={styles.resumoLabel}>Data</span><span className={styles.resumoValor}>{dataSel && new Date(dataSel + 'T12:00').toLocaleDateString('pt-BR')}</span></div></div>
              <div className={styles.resumoItem}><Clock size={16} /><div><span className={styles.resumoLabel}>Horário</span><span className={styles.resumoValor}>{horaSel}</span></div></div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className={styles.nav}>
        {etapa > 0 && (
          <button className={styles.btnVoltar} onClick={voltar} type="button">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
        <div className={styles.navSpacer} />
        {etapa < 3 ? (
          <button className={styles.btnAvancar} onClick={avancar} disabled={!podeAvancar()} type="button">
            Avançar <ArrowRight size={16} />
          </button>
        ) : (
          <button className={styles.btnConfirmar} onClick={confirmar} type="button">
            <Check size={16} /> Confirmar Agendamento
          </button>
        )}
      </div>
    </div>
  );
}
