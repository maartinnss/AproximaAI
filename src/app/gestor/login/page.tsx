'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { credenciaisGestores, getEstabelecimentoById } from '@/data/mock';
import styles from './login.module.css';

export default function GestorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const gestor = credenciaisGestores.find(
      (g) => g.email === email && g.senha === senha
    );

    if (gestor) {
      const est = getEstabelecimentoById(gestor.estabelecimentoId);
      sessionStorage.setItem('gestorLogado', JSON.stringify({
        email: gestor.email,
        nome: gestor.nomeGestor,
        estabelecimentoId: gestor.estabelecimentoId,
        nomeEstabelecimento: est?.nome || '',
      }));
      router.push('/gestor/dashboard');
    } else {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgDecoration}>
        <div className={styles.orbe1} />
        <div className={styles.orbe2} />
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Link>

          <div className={styles.header}>
            <div className={styles.logoIcon}>
              <Zap size={28} />
            </div>
            <h1 className={styles.logoText}>
              <span>Fila</span>
              <span className={styles.logoAccent}>AI</span>
            </h1>
            <p className={styles.subtitle}>Acesse o painel do seu comércio</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} id="login-form">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">E-mail</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-senha">Senha</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.input}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && <p className={styles.erro}>{erro}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={carregando}
              id="btn-login"
            >
              {carregando ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className={styles.demoInfo}>
            <p><strong>Demo — escolha um:</strong></p>
            <p>admin@barbearia.com / 123456</p>
            <p>admin@belezaearte.com / 123456</p>
            <p>admin@clinicavita.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
