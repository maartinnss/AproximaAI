'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { MessageCircle, Bot, Copy, Check, Save, ExternalLink, Pencil, X, Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import { apiFetch, describeApiError } from '@/lib/api-client';
import styles from './whatsapp.module.css';

type EstadoConexao = 'loading' | 'conectado' | 'qrcode' | 'aguardando' | 'sem-evolution' | 'offline' | 'erro';

function buildWaLink(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}`;
}

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface Props {
  telefone: string;
  aiEnabled: boolean;
  aiPersona: string | null;
}

export default function WhatsappClient({ telefone: initTelefone, aiEnabled: initAiEnabled, aiPersona: initAiPersona }: Props) {
  const [telefone, setTelefone] = useState(() => maskPhone(initTelefone));
  const [editandoTel, setEditandoTel] = useState(false);
  const [telInput, setTelInput] = useState(() => maskPhone(initTelefone));
  const [salvandoTel, setSalvandoTel] = useState(false);
  const [erroTel, setErroTel] = useState('');
  const [copiado, setCopiado] = useState(false);

  // ── Conexão Evolution QR ──
  const [estadoConexao, setEstadoConexao] = useState<EstadoConexao>('loading');
  const [qrcodeBase64, setQrcodeBase64] = useState<string | null>(null);
  const [gerandoQr, setGerandoQr] = useState(false);
  const [erroQr, setErroQr] = useState('');

  const fetchConexao = useCallback(async () => {
    try {
      const data = await apiFetch<{
        conectado: boolean;
        estado: string;
        qrcode?: { base64?: string };
        evolutionNaoConfigurado?: boolean;
        evolutionIndisponivel?: boolean;
        precisaReconectar?: boolean;
      }>('/api/gestor/whatsapp/conectar');

      if (data.evolutionNaoConfigurado) { setEstadoConexao('sem-evolution'); return; }
      if (data.evolutionIndisponivel)   { setEstadoConexao('offline'); return; }
      if (data.conectado)               { setEstadoConexao('conectado'); setQrcodeBase64(null); return; }
      if (data.qrcode?.base64)          { setEstadoConexao('qrcode'); setQrcodeBase64(data.qrcode.base64); return; }
      if (data.precisaReconectar)       { setEstadoConexao('aguardando'); return; }
      setEstadoConexao('aguardando');
    } catch {
      setEstadoConexao('erro');
    }
  }, []);

  const gerarNovoQr = async () => {
    setGerandoQr(true);
    setErroQr('');
    try {
      const data = await apiFetch<{ qrcode?: { base64?: string } }>('/api/gestor/whatsapp/conectar', { method: 'POST' });
      if (data.qrcode?.base64) { setQrcodeBase64(data.qrcode.base64); setEstadoConexao('qrcode'); }
      else setEstadoConexao('aguardando');
    } catch (err) {
      setErroQr(describeApiError(err));
    } finally {
      setGerandoQr(false);
    }
  };

  useEffect(() => {
    void fetchConexao();
  }, [fetchConexao]);

  useEffect(() => {
    if (estadoConexao === 'conectado' || estadoConexao === 'sem-evolution') return;
    const id = setInterval(() => { void fetchConexao(); }, 5000);
    return () => clearInterval(id);
  }, [estadoConexao, fetchConexao]);

  const [aiEnabledState, setAiEnabledState] = useState(initAiEnabled);
  const [aiPersonaState, setAiPersonaState] = useState(initAiPersona ?? '');
  const [salvandoIA, setSalvandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [sucessoIA, setSucessoIA] = useState(false);

  const waLink = buildWaLink(telefone);

  const copiarLink = async () => {
    await navigator.clipboard.writeText(waLink);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const salvarTelefone = async () => {
    const val = telInput.trim();
    if (!val) { setErroTel('Número obrigatório.'); return; }
    setErroTel('');
    setSalvandoTel(true);
    try {
      await apiFetch('/api/gestor/whatsapp/configurar', {
        method: 'PATCH',
        json: { telefone: val },
      });
      setTelefone(maskPhone(val));
      setEditandoTel(false);
    } catch (err) {
      setErroTel(describeApiError(err));
    } finally {
      setSalvandoTel(false);
    }
  };

  const cancelarEdicaoTel = () => {
    setTelInput(maskPhone(telefone));
    setErroTel('');
    setEditandoTel(false);
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

  return (
    <div className={styles.content}>

      {/* ─── Conexão Evolution QR ─── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrap} ${estadoConexao === 'conectado' ? styles.iconOnline : styles.iconOffline}`}>
            {estadoConexao === 'conectado' ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitulo}>Conexão WhatsApp</h2>
            <p className={styles.cardSubtitulo}>Vincule seu número via QR code para ativar o assistente</p>
          </div>
          {estadoConexao === 'conectado' && <span className={`${styles.badge} ${styles.badgeOnline}`}>Conectado</span>}
          {(estadoConexao === 'qrcode' || estadoConexao === 'aguardando' || estadoConexao === 'loading') && (
            <span className={`${styles.badge} ${styles.badgeOffline}`}>Desconectado</span>
          )}
        </div>

        {estadoConexao === 'sem-evolution' && (
          <p className={styles.webhookHint}>
            Evolution API não configurada. Adicione <code>EVOLUTION_API_URL</code> e <code>EVOLUTION_API_KEY</code> ao <code>.env.local</code> e reinicie o servidor.
          </p>
        )}

        {estadoConexao === 'offline' && (
          <p className={styles.erroMsg}>Evolution API offline. Verifique se o Docker está rodando: <code>docker compose up -d evolution-api</code></p>
        )}

        {estadoConexao === 'conectado' && (
          <p className={styles.webhookHint}>WhatsApp conectado. O assistente IA está ativo e pronto para receber mensagens.</p>
        )}

        {(estadoConexao === 'qrcode' || estadoConexao === 'aguardando' || estadoConexao === 'loading') && (
          <div className={styles.qrcodeSection}>
            {estadoConexao === 'qrcode' && qrcodeBase64 ? (
              <Image
                src={qrcodeBase64}
                alt="QR Code WhatsApp"
                width={200}
                height={200}
                className={styles.qrcodeImg}
                unoptimized
              />
            ) : (
              <div className={styles.qrcodePlaceholder}>
                {estadoConexao === 'loading' ? (
                  <RefreshCw size={28} className={styles.spinning} />
                ) : (
                  <QrCode size={28} />
                )}
                <span>{estadoConexao === 'loading' ? 'Carregando...' : 'Aguardando QR code...'}</span>
              </div>
            )}
            <p className={styles.qrcodeInstrucao}>
              Abra o WhatsApp no celular → Dispositivos Vinculados → Vincular Dispositivo → escaneie o QR code.
            </p>
          </div>
        )}

        {erroQr && <p className={styles.erroMsg}>{erroQr}</p>}

        {estadoConexao !== 'sem-evolution' && estadoConexao !== 'conectado' && (
          <div className={styles.cardFooter}>
            <button className="btn-primary" onClick={gerarNovoQr} disabled={gerandoQr}>
              <RefreshCw size={14} className={gerandoQr ? styles.spinning : ''} />
              {gerandoQr ? 'Gerando...' : 'Gerar novo QR'}
            </button>
          </div>
        )}
      </div>

      {/* ─── Link WhatsApp ─── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.iconWrap} ${styles.iconWa}`}>
            <MessageCircle size={20} />
          </div>
          <div className={styles.cardTitleGroup}>
            <h2 className={styles.cardTitulo}>Link WhatsApp</h2>
            <p className={styles.cardSubtitulo}>Compartilhe com seus clientes para receber mensagens</p>
          </div>
        </div>

        <div className={styles.webhookRow}>
          <code className={styles.webhookUrl}>{waLink}</code>
          <button className={styles.copyBtn} onClick={copiarLink} aria-label="Copiar link">
            {copiado ? <Check size={15} /> : <Copy size={15} />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.copyBtn}
            style={{ textDecoration: 'none' }}
            aria-label="Abrir no WhatsApp"
          >
            <ExternalLink size={15} />
            Abrir
          </a>
        </div>

        {editandoTel ? (
          <div className={styles.telEditRow}>
            <input
              type="tel"
              className="input-field"
              value={telInput}
              onChange={(e) => setTelInput(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              autoFocus
            />
            {erroTel && <p className={styles.erroMsg}>{erroTel}</p>}
            <div className={styles.cardFooter}>
              <button className="btn-primary" onClick={salvarTelefone} disabled={salvandoTel}>
                <Save size={14} />
                {salvandoTel ? 'Salvando...' : 'Salvar número'}
              </button>
              <button className={styles.btnSecundario} onClick={cancelarEdicaoTel} disabled={salvandoTel}>
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.telRow}>
            <span className={styles.webhookHint}>Número: <code>{telefone}</code></span>
            <button className={styles.btnEditar} onClick={() => setEditandoTel(true)}>
              <Pencil size={13} />
              Editar
            </button>
          </div>
        )}
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
