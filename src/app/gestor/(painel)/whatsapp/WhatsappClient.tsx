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
}

interface Props {
  aiEnabled: boolean;
  aiPersona: string | null;
  webhookUrl: string;
}

function resolveBase64(raw: string): string {
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
}

export default function WhatsappClient({ aiEnabled: initAiEnabled, aiPersona: initAiPersona, webhookUrl }: Props) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [reconectando, setReconectando] = useState(false);

  const [aiEnabledState, setAiEnabledState] = useState(initAiEnabled);
  const [aiPersonaState, setAiPersonaState] = useState(initAiPersona ?? '');
  const [salvandoIA, setSalvandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [sucessoIA, setSucessoIA] = useState(false);

  const [copiado, setCopiado] = useState(false);

  const fetchInicial = useCallback(async () => {
    setCarregando(true);
    try {
      const [statusData, conectarData] = await Promise.all([
        apiFetch<StatusResponse>('/api/gestor/whatsapp/status'),
        apiFetch<ConectarResponse>('/api/gestor/whatsapp/conectar'),
      ]);
      setStatus(statusData);
      if (!statusData.conectado) {
        const b64 = conectarData.qrcode?.base64;
        setQrcode(b64 ? resolveBase64(b64) : null);
      }
    } catch {
      // Evolution não configurado — mostra só o painel Meta
    } finally {
      setCarregando(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const data = await apiFetch<StatusResponse>('/api/gestor/whatsapp/status');
      setStatus(data);
      if (data.conectado) setQrcode(null);
    } catch {
      // silencia
    }
  }, []);

  useEffect(() => { fetchInicial(); }, [fetchInicial]);

  useEffect(() => {
    if (status?.conectado || carregando) return;
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (attempts >= 20) {
        clearInterval(id);
        return;
      }
      checkStatus();
    }, 5000);
    return () => clearInterval(id);
  }, [status?.conectado, carregando, checkStatus]);

  const reconectar = async () => {
    setReconectando(true);
    try {
      const data = await apiFetch<{ qrcode?: { base64?: string } }>(
        '/api/gestor/whatsapp/conectar',
        { method: 'POST' },
      );
      const b64 = data.qrcode?.base64;
      setQrcode(b64 ? resolveBase64(b64) : null);
      setStatus((prev) => prev ? { ...prev, conectado: false, estado: 'close' } : null);
    } catch {
      // silencia
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
                  : 'Escaneie o QR code para ativar'}
            </p>
          </div>
          <span className={`${styles.badge} ${conectado ? styles.badgeOnline : styles.badgeOffline}`}>
            {carregando ? '—' : conectado ? 'Online' : 'Offline'}
          </span>
        </div>

        {!carregando && !conectado && (
          <div className={styles.qrcodeSection}>
            {qrcode ? (
              <img src={qrcode} alt="QR Code WhatsApp" className={styles.qrcodeImg} />
            ) : (
              <div className={styles.qrcodePlaceholder}>
                <QrCode size={44} />
                <span>Gerando QR code...</span>
              </div>
            )}
            <p className={styles.qrcodeInstrucao}>
              Abra o WhatsApp → <strong>Menu</strong> → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
            </p>
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
      </div>

      {/* ─── Webhook Meta ─── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrap} ${styles.iconMeta}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitulo}>Webhook Meta Cloud API</h2>
            <p className={styles.cardSubtitulo}>Configure este URL no painel do Meta for Developers</p>
          </div>
        </div>
        <div className={styles.webhookRow}>
          <code className={styles.webhookUrl}>{webhookUrl}</code>
          <button className={styles.copyBtn} onClick={copiarWebhook} aria-label="Copiar URL">
            {copiado ? <Check size={15} /> : <Copy size={15} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className={styles.webhookHint}>
          No App Dashboard → WhatsApp → Configuração → Webhooks: cole o URL acima e defina <code>META_VERIFY_TOKEN</code> no <code>.env</code>.
        </p>
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
