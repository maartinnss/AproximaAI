'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Scissors, User, Phone, Mail, DollarSign, Clock, FileText,
  ArrowRight, CheckCircle2, Wifi, WifiOff, SkipForward,
} from 'lucide-react';
import VennLogo from '@/components/VennLogo';
import { maskBRL, unmaskBRLCentavos, maskMinutos } from '@/lib/format';
import { apiFetch, describeApiError } from '@/lib/api-client';
import { maskTelefoneBR, unmaskTelefone } from '@/lib/format';
import styles from './onboarding.module.css';

type Step = 1 | 2 | 3 | 4;

interface QrResponse {
  conectado: boolean;
  estado: string;
  qrcode?: { base64?: string };
}

function resolveBase64(raw: string): string {
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
}

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Step 1 — Serviço
  const [nomeServico, setNomeServico] = useState('');
  const [descServico, setDescServico] = useState('');
  const [precoStr, setPrecoStr] = useState('');
  const [duracaoStr, setDuracaoStr] = useState('');

  // Step 2 — Profissional
  const [nomeProfissional, setNomeProfissional] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [telefoneProfissional, setTelefoneProfissional] = useState('');
  const [emailProfissional, setEmailProfissional] = useState('');

  // Step 3 — WhatsApp
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [waConectado, setWaConectado] = useState(false);
  const [waCarregando, setWaCarregando] = useState(false);

  const fetchQr = useCallback(async () => {
    setWaCarregando(true);
    try {
      const data = await apiFetch<QrResponse>('/api/gestor/whatsapp/conectar');
      if (data.conectado) {
        setWaConectado(true);
        setQrcode(null);
      } else {
        const b64 = data.qrcode?.base64;
        setQrcode(b64 ? resolveBase64(b64) : null);
      }
    } catch {
      // Evolution não configurado — ok
    } finally {
      setWaCarregando(false);
    }
  }, []);

  // Poll connection state while on step 3
  useEffect(() => {
    if (step !== 3) return;
    const kickoff = setTimeout(() => {
      void fetchQr();
    }, 0);
    const id = setInterval(async () => {
      if (waConectado) return;
      try {
        const data = await apiFetch<{ conectado: boolean }>('/api/gestor/whatsapp/status');
        if (data.conectado) {
          setWaConectado(true);
          setQrcode(null);
        }
      } catch { /* silencia */ }
    }, 5000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, [step, fetchQr, waConectado]);

  const criarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const preco = unmaskBRLCentavos(precoStr);
    const duracao = parseInt(duracaoStr, 10);
    if (isNaN(preco) || preco < 0) { setErro('Preço inválido.'); return; }
    if (isNaN(duracao) || duracao < 5) { setErro('Duração mínima: 5 minutos.'); return; }
    setSalvando(true);
    try {
      await apiFetch('/api/gestor/servicos', {
        method: 'POST',
        json: {
          nome: nomeServico.trim(),
          descricao: descServico.trim() || 'Serviço',
          precoCentavos: preco,
          duracaoMinutos: duracao,
        },
      });
      setStep(2);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const criarProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const telDigits = unmaskTelefone(telefoneProfissional);
    if (telDigits.length < 10 || telDigits.length > 11) {
      setErro('Telefone inválido. Use (XX) XXXXX-XXXX.');
      return;
    }
    setSalvando(true);
    try {
      await apiFetch('/api/gestor/profissionais', {
        method: 'POST',
        json: {
          nome: nomeProfissional.trim(),
          especialidade: especialidade.trim(),
          telefone: telDigits,
          email: emailProfissional.trim().toLowerCase(),
        },
      });
      setStep(3);
    } catch (err) {
      setErro(describeApiError(err));
    } finally {
      setSalvando(false);
    }
  };

  const irParaDashboard = () => {
    setStep(4);
    setTimeout(() => {
      router.push('/gestor/dashboard');
      router.refresh();
    }, 900);
  };

  const stepLabels = ['Serviço', 'Profissional', 'WhatsApp', ''];

  return (
    <div className={styles.page}>
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.shape1} />
        <div className={styles.shape2} />
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          {step < 4 && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.logoWrap}>
                  <VennLogo size={38} />
                </div>
                <h1 className={styles.logoText}>
                  <span>Aproxima</span>
                  <span className={styles.logoAccent}>AI</span>
                </h1>
                <p className={styles.welcome}>Configure seu negócio em 3 passos</p>
              </div>

              <div className={styles.stepper}>
                {[1, 2, 3].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div className={styles.stepItem}>
                      <div className={`${styles.stepCircle} ${step === s ? styles.active : step > s ? styles.done : ''}`}>
                        {step > s ? '✓' : s}
                      </div>
                      <span className={`${styles.stepLabel} ${step === s ? styles.active : ''}`}>
                        {stepLabels[i]}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={`${styles.stepConnector} ${step > s ? styles.done : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 1 — Serviço */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepHeading}>Adicione seu primeiro serviço</h2>
              <p className={styles.stepSub}>O agente IA vai usar isso para agendar via WhatsApp.</p>
              <form className={styles.form} onSubmit={criarServico}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-servico-nome">Nome do serviço</label>
                  <div className={styles.inputWrap}>
                    <Scissors size={15} className={styles.inputIcon} />
                    <input
                      id="ob-servico-nome"
                      type="text"
                      className={styles.input}
                      placeholder="Ex: Corte de cabelo"
                      value={nomeServico}
                      onChange={(e) => setNomeServico(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-servico-desc">Descrição (opcional)</label>
                  <textarea
                    id="ob-servico-desc"
                    className={styles.textarea}
                    placeholder="Descreva o serviço brevemente..."
                    value={descServico}
                    onChange={(e) => setDescServico(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ob-servico-preco">Preço (R$)</label>
                    <div className={styles.inputWrap}>
                      <DollarSign size={14} className={styles.inputIcon} />
                      <input
                        id="ob-servico-preco"
                        type="text"
                        inputMode="numeric"
                        className={styles.input}
                        placeholder="0,00"
                        value={precoStr}
                        onChange={(e) => setPrecoStr(maskBRL(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ob-servico-duracao">Duração (min)</label>
                    <div className={styles.inputWrap}>
                      <Clock size={14} className={styles.inputIcon} />
                      <input
                        id="ob-servico-duracao"
                        type="text"
                        inputMode="numeric"
                        className={styles.input}
                        placeholder="30"
                        value={duracaoStr}
                        onChange={(e) => setDuracaoStr(maskMinutos(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <div className={styles.actions}>
                  <button type="submit" className={styles.btnPrimary} disabled={salvando}>
                    {salvando ? <span className={styles.spinner} /> : <>Próximo <ArrowRight size={15} /></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2 — Profissional */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepHeading}>Adicione um profissional</h2>
              <p className={styles.stepSub}>Quem vai realizar os atendimentos?</p>
              <form className={styles.form} onSubmit={criarProfissional}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-prof-nome">Nome</label>
                  <div className={styles.inputWrap}>
                    <User size={15} className={styles.inputIcon} />
                    <input
                      id="ob-prof-nome"
                      type="text"
                      className={styles.input}
                      placeholder="Ex: Carlos Silva"
                      value={nomeProfissional}
                      onChange={(e) => setNomeProfissional(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-prof-esp">Especialidade</label>
                  <div className={styles.inputWrap}>
                    <FileText size={15} className={styles.inputIcon} />
                    <input
                      id="ob-prof-esp"
                      type="text"
                      className={styles.input}
                      placeholder="Ex: Barbeiro"
                      value={especialidade}
                      onChange={(e) => setEspecialidade(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-prof-tel">Telefone</label>
                  <div className={styles.inputWrap}>
                    <Phone size={15} className={styles.inputIcon} />
                    <input
                      id="ob-prof-tel"
                      type="tel"
                      className={styles.input}
                      placeholder="(11) 99999-9999"
                      value={telefoneProfissional}
                      onChange={(e) => setTelefoneProfissional(maskTelefoneBR(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ob-prof-email">E-mail</label>
                  <div className={styles.inputWrap}>
                    <Mail size={15} className={styles.inputIcon} />
                    <input
                      id="ob-prof-email"
                      type="email"
                      className={styles.input}
                      placeholder="profissional@email.com"
                      value={emailProfissional}
                      onChange={(e) => setEmailProfissional(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {erro && <p className={styles.erro}>{erro}</p>}

                <div className={styles.actions}>
                  <button type="submit" className={styles.btnPrimary} disabled={salvando}>
                    {salvando ? <span className={styles.spinner} /> : <>Próximo <ArrowRight size={15} /></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3 — WhatsApp */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepHeading}>Conectar WhatsApp</h2>
              <p className={styles.stepSub}>
                Escaneie o QR code com seu WhatsApp para ativar o agente IA.
              </p>

              <div className={styles.qrWrap}>
                {waConectado ? (
                  <p className={styles.qrStatusConnected}>
                    <CheckCircle2 size={18} /> WhatsApp conectado!
                  </p>
                ) : waCarregando ? (
                  <div className={styles.qrBox}>
                    <div className={styles.qrLoading}>
                      <span className={styles.spinner} style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: 'var(--accent-primary)' }} />
                      <span>Gerando QR...</span>
                    </div>
                  </div>
                ) : qrcode ? (
                  <div className={styles.qrBox}>
                    <Image src={qrcode} alt="QR Code WhatsApp" width={260} height={260} unoptimized />
                  </div>
                ) : (
                  <div className={styles.qrBox}>
                    <div className={styles.qrLoading}>
                      <WifiOff size={22} />
                      <span>Evolution API não configurada</span>
                    </div>
                  </div>
                )}
                {!waConectado && !waCarregando && (
                  <p className={styles.qrStatus}>
                    Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                  </p>
                )}
              </div>

              <div className={styles.actions}>
                {waConectado ? (
                  <button className={styles.btnPrimary} onClick={irParaDashboard}>
                    Ir para o dashboard <ArrowRight size={15} />
                  </button>
                ) : (
                  <>
                    <button className={styles.btnSkip} onClick={irParaDashboard}>
                      <SkipForward size={14} /> Pular por agora
                    </button>
                    <button className={styles.btnPrimary} onClick={irParaDashboard} style={{ opacity: 0.5 }}>
                      <Wifi size={14} /> Aguardando conexão...
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Sucesso */}
          {step === 4 && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={28} />
              </div>
              <p className={styles.successTitle}>Tudo pronto!</p>
              <p className={styles.successSub}>Redirecionando para o dashboard...</p>
              <span className={styles.spinner} style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: 'var(--accent-primary)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
