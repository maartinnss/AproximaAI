'use client';

import { useState } from 'react';
import { MessageCircle, Bot, Copy, Check, Save, ExternalLink, Pencil, X } from 'lucide-react';
import { apiFetch, describeApiError } from '@/lib/api-client';
import styles from './whatsapp.module.css';

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
