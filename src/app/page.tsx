'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import {
  credenciaisGestores,
  credenciaisClientes,
  getEstabelecimentoById,
  getClienteById,
} from '@/data/mock';
import styles from './page.module.css';

export default function LoginPage() {
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

    // 1) Tenta autenticar como gestor
    const gestor = credenciaisGestores.find(
      (g) => g.email === email && g.senha === senha
    );

    if (gestor) {
      const est = getEstabelecimentoById(gestor.estabelecimentoId);
      sessionStorage.setItem(
        'gestorLogado',
        JSON.stringify({
          email: gestor.email,
          nome: gestor.nomeGestor,
          estabelecimentoId: gestor.estabelecimentoId,
          nomeEstabelecimento: est?.nome || '',
        })
      );
      router.push('/gestor/dashboard');
      return;
    }

    // 2) Tenta autenticar como cliente
    const cred = credenciaisClientes.find(
      (c) => c.email === email && c.senha === senha
    );

    if (cred) {
      const cliente = getClienteById(cred.clienteId);
      sessionStorage.setItem(
        'clienteLogado',
        JSON.stringify({
          id: cred.clienteId,
          nome: cliente?.nome || '',
          email: cred.email,
          avatar: cliente?.avatar || '',
        })
      );
      router.push('/cliente/explorar');
      return;
    }

    // 3) Nenhum match
    setErro('E-mail ou senha incorretos.');
    setCarregando(false);
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
              <Zap size={26} />
            </div>
            <h1 className={styles.logoText}>
              <span>Fila</span>
              <span className={styles.logoAccent}>AI</span>
            </h1>
            <p className={styles.subtitle}>
              Agendamento inteligente para o seu negócio
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} id="login-form">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">
                E-mail
              </label>
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
              <label className={styles.label} htmlFor="login-senha">
                Senha
              </label>
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
            <p><strong>Demo — Gestor</strong></p>
            <p>admin@barbearia.com / 123456</p>
            <p>admin@belezaearte.com / 123456</p>
            <p>admin@clinicavita.com / 123456</p>
            <div className={styles.demoDivider} />
            <p><strong>Demo — Cliente</strong></p>
            <p>joao@email.com / 123456</p>
            <p>marcos@email.com / 123456</p>
          </div>

          <div className={styles.cardFooter}>
            <button
              type="button"
              className={styles.toLanding}
              onClick={() => router.push('/landing')}
            >
              <Sparkles size={14} />
              Conhecer o FilaAI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
