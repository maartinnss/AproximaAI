'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  User, Mail, Lock, Eye, EyeOff, Building2, Phone,
  MapPin, ChevronDown, ArrowRight, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import VennLogo from '@/components/VennLogo';
import styles from './page.module.css';

const CATEGORIAS = [
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'salao', label: 'Salão de Beleza' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'estetica', label: 'Estética' },
  { value: 'outro', label: 'Outro' },
] as const;

type Step = 1 | 2 | 3;

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Step 1 — Conta
  const [nomeGestor, setNomeGestor] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Step 2 — Negócio
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  const validarStep1 = (): string | null => {
    if (!nomeGestor.trim() || nomeGestor.trim().length < 2) return 'Nome precisa ter pelo menos 2 caracteres.';
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (senha.length < 8) return 'Senha precisa ter pelo menos 8 caracteres.';
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    return null;
  };

  const avancar = () => {
    setErro('');
    if (step === 1) {
      const err = validarStep1();
      if (err) { setErro(err); return; }
      setStep(2);
    }
  };

  const voltar = () => {
    setErro('');
    if (step === 2) setStep(1);
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nomeEstabelecimento.trim() || nomeEstabelecimento.trim().length < 2) {
      setErro('Nome do estabelecimento precisa ter pelo menos 2 caracteres.');
      return;
    }
    if (!categoria) {
      setErro('Selecione a categoria do estabelecimento.');
      return;
    }
    if (!telefone.trim() || telefone.trim().length < 8) {
      setErro('Telefone inválido.');
      return;
    }
    if (!endereco.trim() || endereco.trim().length < 5) {
      setErro('Endereço precisa ter pelo menos 5 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeGestor: nomeGestor.trim(),
          email: email.trim().toLowerCase(),
          senha,
          nomeEstabelecimento: nomeEstabelecimento.trim(),
          categoria,
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message ?? 'Erro ao criar conta. Tente novamente.';
        setErro(msg);
        setCarregando(false);
        return;
      }

      // Auto-login após registro
      const login = await signIn('gestor-credentials', {
        email: email.trim().toLowerCase(),
        senha,
        redirect: false,
      });

      if (login?.error) {
        setErro('Conta criada! Faça login para continuar.');
        setCarregando(false);
        router.push('/');
        return;
      }

      setStep(3);
      setTimeout(() => {
        router.push('/gestor/onboarding');
        router.refresh();
      }, 1200);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
      setCarregando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.shape4} />
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoIcon}>
              <VennLogo size={44} />
            </div>
            <h1 className={styles.logoText}>
              <span>Aproxima</span>
              <span className={styles.logoAccent}>AI</span>
            </h1>
          </div>

          {/* Stepper */}
          <div className={styles.stepper}>
            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${step >= 1 ? (step > 1 ? styles.done : styles.active) : ''}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`${styles.stepLabel} ${step === 1 ? styles.active : ''}`}>Conta</span>
            </div>
            <div className={`${styles.stepConnector} ${step > 1 ? styles.done : ''}`} />
            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${step >= 2 ? (step > 2 ? styles.done : styles.active) : ''}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className={`${styles.stepLabel} ${step === 2 ? styles.active : ''}`}>Negócio</span>
            </div>
            <div className={`${styles.stepConnector} ${step > 2 ? styles.done : ''}`} />
            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${step >= 3 ? styles.done : ''}`}>
                {step >= 3 ? '✓' : '3'}
              </div>
              <span className={`${styles.stepLabel} ${step === 3 ? styles.active : ''}`}>Pronto</span>
            </div>
          </div>

          {/* Step 3 — Sucesso */}
          {step === 3 && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={26} />
              </div>
              <p className={styles.successTitle}>Conta criada!</p>
              <p className={styles.successSub}>Redirecionando para configuração...</p>
              <span className={styles.spinner} style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: 'var(--accent-primary)' }} />
            </div>
          )}

          {/* Step 1 — Conta */}
          {step === 1 && (
            <>
              <p className={styles.stepTitle}>Sua conta</p>
              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); avancar(); }}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-nome">Nome completo</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      id="reg-nome"
                      type="text"
                      className={styles.input}
                      placeholder="Seu nome"
                      value={nomeGestor}
                      onChange={(e) => setNomeGestor(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-email">E-mail</label>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      id="reg-email"
                      type="email"
                      className={styles.input}
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-senha">Senha</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      id="reg-senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Mín. 8 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-confirmar">Confirmar senha</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      id="reg-confirmar"
                      type={mostrarSenha ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Repita a senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <div className={styles.actions}>
                  <button type="submit" className={styles.btnPrimary}>
                    Continuar <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 2 — Negócio */}
          {step === 2 && (
            <>
              <p className={styles.stepTitle}>Seu negócio</p>
              <form className={styles.form} onSubmit={submeter}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-estab">Nome do estabelecimento</label>
                  <div className={styles.inputWrap}>
                    <Building2 size={16} className={styles.inputIcon} />
                    <input
                      id="reg-estab"
                      type="text"
                      className={styles.input}
                      placeholder="Ex: Barbearia do João"
                      value={nomeEstabelecimento}
                      onChange={(e) => setNomeEstabelecimento(e.target.value)}
                      autoComplete="organization"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-categoria">Categoria</label>
                  <div className={styles.inputWrap}>
                    <Building2 size={16} className={styles.inputIcon} />
                    <select
                      id="reg-categoria"
                      className={styles.select}
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className={styles.selectChevron} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-telefone">Telefone</label>
                  <div className={styles.inputWrap}>
                    <Phone size={16} className={styles.inputIcon} />
                    <input
                      id="reg-telefone"
                      type="tel"
                      className={styles.input}
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reg-endereco">Endereço</label>
                  <div className={styles.inputWrap}>
                    <MapPin size={16} className={styles.inputIcon} />
                    <input
                      id="reg-endereco"
                      type="text"
                      className={styles.input}
                      placeholder="Rua, número, cidade"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      autoComplete="street-address"
                      required
                    />
                  </div>
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <div className={styles.actions}>
                  <button type="button" className={styles.btnSecondary} onClick={voltar}>
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  <button type="submit" className={styles.btnPrimary} disabled={carregando}>
                    {carregando ? <span className={styles.spinner} /> : <>Criar conta <ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className={styles.cardFooter}>
            <span>Já tem conta?</span>
            <button className={styles.linkLogin} onClick={() => router.push('/')}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
