'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, Wifi, WifiOff, RefreshCw, Save, QrCode, Copy, Check } from 'lucide-react';
import { apiFetch, describeApiError } from '@/lib/api-client';
import styles from './whatsapp.module.css';

interface StatusResponse {
  conectado: boolean;
  estado: string;
  instancia: string;
}

interface ConectarResponse {
  conectado: boolean;
  estado: string;
  qrcode?: { base64?: string; code?: string };
  precisaReconectar?: boolean;
  evolutionNaoConfigurado?: boolean;
  evolutionIndisponivel?: boolean;
}

interface Props {
  aiEnabled: boolean;
  aiPersona: string | null;
  webhookUrl: string;
  metaPhoneNumberId: string | null;
  metaDisplayPhone: string | null;
}

function resolveBase64(raw: string): string {
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
}

export default function WhatsappClient({
  aiEnabled: initAiEnabled,
  aiPersona: initAiPersona,
  webhookUrl,
  metaPhoneNumberId: initMetaPhoneId,
  metaDisplayPhone: initMetaDisplay,
}: Props) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [precisaReconectar, setPrecisaReconectar] = useState(false);
  const [erroEvolution, setErroEvolution] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [reconectando, setReconectando] = useState(false);

  const [aiEnabledState, setAiEnabledState] = useState(initAiEnabled);
  const [aiPersonaState, setAiPersonaState] = useState(initAiPersona ?? '');
  const [salvandoIA, setSalvandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [sucessoIA, setSucessoIA] = useState(false);

  // Meta Cloud API
  const [metaPhoneId, setMetaPhoneId] = useState(initMetaPhoneId ?? '');
  const [metaDisplay, setMetaDisplay] = useState(initMetaDisplay ?? '');
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [erroMeta, setErroMeta] = useState('');
  const [sucessoMeta, setSucessoMeta] = useState(false);
  const [metaConfigurado, setMetaConfigurado] = useState(!!initMetaPhoneId);

  const [copiado, setCopiado] = useState(false);

  const fetchInicial = useCallback(async () => {
    setCarregando(true);
    setErroEvolution(null);
    try {
      const statusData = await apiFetch<StatusResponse>('/api/gestor/whatsapp/status');
      setStatus(statusData);
      if (statusData.conectado) return;

      // Só busca QR se desconectado — evita side-effect de createInstance desnecessário.
      const conectarData = await apiFetch<ConectarResponse>('/api/gestor/whatsapp/conectar');
      if (conectarData.evolutionNaoConfigurado) {
        setErroEvolution('EVOLUTION_API_URL não configurado. Adicione ao .env.local e reinicie.');
        return;
      }
      if (conectarData.evolutionIndisponivel) {
        setErroEvolution('Evolution API offline. Verifique se o Docker está rodando: docker compose up -d');
        return;
      }

      const b64 = conectarData.qrcode?.base64;
      setQrcode(b64 ? resolveBase64(b64) : null);
      setPrecisaReconectar(conectarData.precisaReconectar ?? false);
    } catch {
      setErroEvolution('Erro ao verificar conexão. Tente recarregar a página.');
    } finally {
      setCarregando(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const data = await apiFetch<StatusResponse>('/api/gestor/whatsapp/status');
      setStatus(data);
      if (data.conectado) { setQrcode(null); setPrecisaReconectar(false); }
    } catch {
      // silencia
    }
  }, []);

  useEffect(() => {
    if (metaConfigurado) { setCarregando(false); return; }
    fetchInicial();
  }, [fetchInicial, metaConfigurado]);

  // Polling de status enquanto desconectado. Para se Evolution offline ou Meta ativo.
  useEffect(() => {
    if (status?.conectado || carregando || !!erroEvolution || metaConfigurado) return;
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (attempts >= 24) { // 2 min max
        clearInterval(id);
        setPrecisaReconectar(true); // polling esgotado sem conexão → ação manual
        return;
      }
      checkStatus();
    }, 5000);
    return () => clearInterval(id);
  }, [status?.conectado, carregando, erroEvolution, metaConfigurado, checkStatus]);

  // Timeout de segurança: se ficar 30s em "connecting" sem resolver → mostra escape.
  useEffect(() => {
    if (status?.estado !== 'connecting' || status?.conectado) return;
    const id = setTimeout(() => setPrecisaReconectar(true), 30_000);
    return () => clearTimeout(id);
  }, [status?.estado, status?.conectado]);

  const reconectar = async () => {
    setReconectando(true);
    setPrecisaReconectar(false);
    setErroEvolution(null);
    try {
      const data = await apiFetch<{ qrcode?: { base64?: string } }>(
        '/api/gestor/whatsapp/conectar',
        { method: 'POST' },
      );
      const b64 = data.qrcode?.base64;
      if (b64) {
        setQrcode(resolveBase64(b64));
        setStatus((prev) => prev ? { ...prev, conectado: false, estado: 'close' } : null);
      } else {
        setErroEvolution('QR não retornado. Verifique se o Docker está rodando: docker compose up -d');
        setPrecisaReconectar(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar QR.';
      setErroEvolution(msg.includes('Evolution') ? msg : 'Evolution API offline. Verifique o Docker.');
      setPrecisaReconectar(true);
    } finally {
      setReconectando(false);
    }
  };

  const salvarIA = async () => {
    setErroIA('');
    setSucessoIA(false);
    setSalvandoIA(true);
    try {
      await apiFetch('/api/gestor/whatsapp/configurar', {
        method: 'PATCH',
        json: { aiEnabled: aiEnabledState, aiPersona: aiPersonaState.trim() || null },
      });
      setSucessoIA(true);
      setTimeout(() => setSucessoIA(false), 3000);
    } catch (err) {
      setErroIA(describeApiError(err));
    } finally {
      setSalvandoIA(false);
    }
  };

  const salvarMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMeta('');
    setSucessoMeta(false);
    if (!metaPhoneId.trim()) {
      setErroMeta('Phone Number ID é obrigatório.');
      return;
    }
    setSalvandoMeta(true);
    try {
      await apiFetch('/api/gestor/whatsapp/configurar', {
        method: 'PATCH',
        json: {
          whatsappPhoneNumberId: metaPhoneId.trim() || null,
          whatsappDisplayPhone: metaDisplay.trim() || null,
        },
      });
      setMetaConfigurado(true);
      setSucessoMeta(true);
      setTimeout(() => setSucessoMeta(false), 3000);
    } catch (err) {
      setErroMeta(describeApiError(err));
    } finally {
      setSalvandoMeta(false);
    }
  };

  const desconectarMeta = async () => {
    setSalvandoMeta(true);
    try {
      await apiFetch('/api/gestor/whatsapp/configurar', {
        method: 'PATCH',
        json: { whatsappPhoneNumberId: null, whatsappDisplayPhone: null },
      });
      setMetaPhoneId('');
      setMetaDisplay('');
      setMetaConfigurado(false);
      setSucessoMeta(false);
    } catch (err) {
      setErroMeta(describeApiError(err));
    } finally {
      setSalvandoMeta(false);
    }
  };

  const copiarWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const conectado = status?.conectado ?? false;

  return (
    <div className={styles.content}>

      {/* ─── Conexão ─── */}
      <div className={styles.card}>
        {metaConfigurado ? (
          /* ─── Provedor: Meta Cloud API ─── */
          <>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrap} ${styles.iconOnline}`}>
                <Wifi size={20} />
              </div>
              <div className={styles.cardTitleGroup}>
                <h2 className={styles.cardTitulo}>Conexão WhatsApp</h2>
                <p className={styles.cardSubtitulo}>
                  Ativo via Meta Cloud API
                  {initMetaDisplay ? ` — ${initMetaDisplay}` : ''}
                </p>
              </div>
              <span className={`${styles.badge} ${styles.badgeOnline}`}>Ativo (Meta)</span>
            </div>
            <div className={styles.cardFooter}>
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                Conexão gerenciada pela Meta — não requer QR code.
              </span>
            </div>
          </>
        ) : (
          /* ─── Provedor: Evolution API (QR code) ─── */
          <>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrap} ${conectado ? styles.iconOnline : styles.iconOffline}`}>
                {conectado ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div className={styles.cardTitleGroup}>
                <h2 className={styles.cardTitulo}>Conexão WhatsApp</h2>
                <p className={styles.cardSubtitulo}>
                  {carregando
                    ? 'Verificando conexão...'
                    : conectado
                      ? 'Número conectado e respondendo'
                      : status?.estado === 'connecting'
                        ? 'Reconectando com sessão salva...'
                        : 'Escaneie o QR code para ativar'}
                </p>
              </div>
              <span className={`${styles.badge} ${conectado ? styles.badgeOnline : styles.badgeOffline}`}>
                {carregando ? '—' : conectado ? 'Online' : status?.estado === 'connecting' ? 'Reconectando' : 'Offline'}
              </span>
            </div>

            {!carregando && !conectado && (
              <div className={styles.qrcodeSection}>
                {erroEvolution ? (
                  <div className={styles.qrcodePlaceholder} style={{ gap: '0.5rem' }}>
                    <WifiOff size={32} style={{ color: 'var(--color-danger)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>Sem conexão com Evolution API</span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.8, textAlign: 'center', lineHeight: 1.4 }}>
                      {erroEvolution}
                    </span>
                  </div>
                ) : qrcode ? (
                  <>
                    <img src={qrcode} alt="QR Code WhatsApp" className={styles.qrcodeImg} />
                    <p className={styles.qrcodeInstrucao}>
                      Abra o WhatsApp → <strong>Menu</strong> → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
                    </p>
                  </>
                ) : status?.estado === 'connecting' ? (
                  <div className={styles.qrcodePlaceholder}>
                    <RefreshCw size={32} className={styles.spinning} />
                    <span>Reconectando automaticamente...</span>
                  </div>
                ) : precisaReconectar ? (
                  <div className={styles.qrcodePlaceholder}>
                    <WifiOff size={36} />
                    <span>Sessão expirada.</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>
                      Clique em <strong>Gerar novo QR</strong> para reconectar.
                    </span>
                  </div>
                ) : (
                  <div className={styles.qrcodePlaceholder}>
                    <QrCode size={44} />
                    <span>Aguardando QR code...</span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.cardFooter}>
              <button className={styles.btnSecundario} onClick={reconectar} disabled={reconectando || carregando}>
                <RefreshCw size={14} className={reconectando ? styles.spinning : ''} />
                {reconectando ? 'Aguarde...' : conectado ? 'Forçar reconexão' : 'Gerar novo QR'}
              </button>
              {status?.instancia && (
                <span className={styles.instanciaTag}>instância: {status.instancia}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Meta Cloud API ─── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrap} ${styles.iconMeta}`}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16.001 3C9.373 3 4 8.373 4 15c0 5.628 3.674 10.408 8.8 12.094v-8.55H9.92V15h2.88v-2.114c0-2.851 1.696-4.424 4.296-4.424 1.244 0 2.545.222 2.545.222v2.8h-1.433c-1.413 0-1.853.876-1.853 1.774V15h3.154l-.504 3.544h-2.65v8.55C24.326 25.408 28 20.628 28 15 28 8.373 22.627 3 16.001 3z"/>
            </svg>
          </div>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitulo}>WhatsApp Business (Meta)</h2>
            <p className={styles.cardSubtitulo}>
              {metaConfigurado
                ? `Conectado${initMetaDisplay ? ` — ${initMetaDisplay}` : ''}`
                : 'Configure o número fornecido pela AproximaAI'}
            </p>
          </div>
          <span className={`${styles.badge} ${metaConfigurado ? styles.badgeOnline : styles.badgeOffline}`}>
            {metaConfigurado ? 'Ativo' : 'Não configurado'}
          </span>
        </div>

        {metaConfigurado ? (
          /* ─── Estado configurado ─── */
          <div className={styles.metaConfigurado}>
            <div className={styles.metaNumero}>
              <span className={styles.metaLabel}>Phone Number ID</span>
              <code className={styles.metaId}>{metaPhoneId || initMetaPhoneId}</code>
            </div>
            {(metaDisplay || initMetaDisplay) && (
              <div className={styles.metaNumero}>
                <span className={styles.metaLabel}>Número</span>
                <span className={styles.metaId}>{metaDisplay || initMetaDisplay}</span>
              </div>
            )}
            <div className={styles.metaAcoes}>
              <button
                className={styles.btnEditar}
                onClick={() => setSucessoMeta(false)}
                type="button"
              >
                Editar configuração
              </button>
              <button
                className={styles.btnDesconectar}
                onClick={desconectarMeta}
                disabled={salvandoMeta}
                type="button"
              >
                Desconectar
              </button>
            </div>
          </div>
        ) : (
          /* ─── Formulário de configuração ─── */
          <form className={styles.metaForm} onSubmit={salvarMeta}>
            <div className={styles.metaInfo}>
              <span className={styles.metaInfoText}>
                Entre em contato com o suporte AproximaAI para receber seu Phone Number ID.
                Após receber, insira abaixo para ativar o WhatsApp do seu estabelecimento.
              </span>
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="meta-phone-id">
                Phone Number ID <span className={styles.metaObrigatorio}>*</span>
              </label>
              <input
                id="meta-phone-id"
                type="text"
                className="input-field"
                placeholder="Ex: 1164401010086257"
                value={metaPhoneId}
                onChange={(e) => setMetaPhoneId(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="meta-display">
                Número de exibição{' '}
                <span className={styles.fieldHint}>— opcional, ex: +55 11 99999-9999</span>
              </label>
              <input
                id="meta-display"
                type="text"
                className="input-field"
                placeholder="+55 11 99999-9999"
                value={metaDisplay}
                onChange={(e) => setMetaDisplay(e.target.value)}
              />
            </div>

            {erroMeta && <p className={styles.erroMsg}>{erroMeta}</p>}
            {sucessoMeta && <p className={styles.sucessoMsg}>Configuração salva com sucesso!</p>}

            <div className={styles.cardFooter}>
              <button type="submit" className="btn-primary" disabled={salvandoMeta}>
                <Save size={15} />
                {salvandoMeta ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* ─── Webhook URL ─── */}
        <div className={styles.metaDivider} />
        <div>
          <p className={styles.webhookHint} style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            URL do Webhook (configurar no Meta Business):
          </p>
          <div className={styles.webhookRow}>
            <code className={styles.webhookUrl}>{webhookUrl}</code>
            <button className={styles.copyBtn} onClick={copiarWebhook} aria-label="Copiar URL">
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className={styles.webhookHint}>
            Meta Business → WhatsApp → Configuração → Webhooks: cole o URL acima e defina o token de verificação.
          </p>
        </div>
      </div>

      {/* ─── Assistente IA ─── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrap} ${styles.iconIA}`}>
            <Bot size={20} />
          </div>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitulo}>Assistente IA</h2>
            <p className={styles.cardSubtitulo}>Persona e comportamento do agente de WhatsApp</p>
          </div>
          <label className={styles.toggle} aria-label="Ativar assistente IA">
            <input
              type="checkbox"
              checked={aiEnabledState}
              onChange={(e) => setAiEnabledState(e.target.checked)}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.iaBody}>
          {!aiEnabledState && (
            <div className={styles.iaDesativado}>
              IA desativada — o assistente não responderá mensagens até ser reativado.
            </div>
          )}
          <div className={styles.field}>
            <label className="label" htmlFor="ai-persona">
              Persona{' '}
              <span className={styles.fieldHint}>— deixe vazio para usar o padrão</span>
            </label>
            <textarea
              id="ai-persona"
              className={`input-field ${styles.textarea}`}
              value={aiPersonaState}
              onChange={(e) => setAiPersonaState(e.target.value)}
              placeholder="Ex: Você é a Ana, assistente virtual do Salão Bella. Seja simpática, use emojis com moderação e confirme sempre os dados antes de agendar."
              rows={5}
              disabled={!aiEnabledState}
            />
          </div>

          {erroIA && <p className={styles.erroMsg}>{erroIA}</p>}
          {sucessoIA && <p className={styles.sucessoMsg}>Configurações salvas com sucesso.</p>}

          <div className={styles.cardFooter}>
            <button className="btn-primary" onClick={salvarIA} disabled={salvandoIA}>
              <Save size={15} />
              {salvandoIA ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
