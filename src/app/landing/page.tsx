'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BarChart3, Users, Bot,
  MessageSquare, CalendarCheck, Shield, CheckCircle2,
  ChevronDown, Menu, X, Sparkles, Bell,
} from 'lucide-react';
import VennLogo from '@/components/VennLogo';
import styles from './landing.module.css';

/* ── Reveal on scroll ── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children, className = '', delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.revealed : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── FAQ ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
      <button className={styles.faqQ} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <ChevronDown size={18} className={styles.faqChevron} />
      </button>
      <div className={styles.faqA}><p>{answer}</p></div>
    </div>
  );
}

/* ── WhatsApp phone animation ── */
type ChatMsg = { from: 'user' | 'bot'; text: string };

const SCRIPT: Array<{ type: 'msg' | 'typing'; from?: 'user' | 'bot'; text?: string; at: number }> = [
  { type: 'msg',    from: 'user', text: 'Oi! Quero marcar um corte pra amanhã às 10h 👋', at: 600 },
  { type: 'typing', at: 1400 },
  { type: 'msg',    from: 'bot',  text: 'Olá! 😊 Sou o assistente da Barbearia Premium.\n\nVerificando disponibilidade para amanhã às 10h...', at: 2900 },
  { type: 'typing', at: 3700 },
  { type: 'msg',    from: 'bot',  text: '✅ Horário disponível!\n\n📅 Amanhã, 10:00\n✂️ Corte Masculino\n👤 Com: João Barbeiro\n\nConfirma o agendamento?', at: 5200 },
  { type: 'msg',    from: 'user', text: 'Sim, confirma! 🙌', at: 6600 },
  { type: 'typing', at: 7400 },
  { type: 'msg',    from: 'bot',  text: '🎉 Agendamento confirmado!\n\nVou te lembrar 1 hora antes. Até amanhã! 😄', at: 9000 },
];

function PhoneDemo() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      setMessages([]);
      setTyping(false);

      SCRIPT.forEach((step) => {
        if (step.type === 'typing') {
          timers.push(setTimeout(() => setTyping(true), step.at));
        } else if (step.type === 'msg' && step.from && step.text) {
          const { from, text } = step;
          timers.push(setTimeout(() => {
            setTyping(false);
            setMessages((prev) => [...prev, { from, text }]);
          }, step.at));
        }
      });

      timers.push(setTimeout(run, SCRIPT[SCRIPT.length - 1].at + 3500));
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  return (
    <div className={styles.phone}>
      <div className={styles.phoneNotch} />

      <div className={styles.phoneStatus}>
        <span className={styles.phoneTime}>9:41</span>
        <span className={styles.phoneBattery}>▮▮▮▮</span>
      </div>

      <div className={styles.waHeader}>
        <div className={styles.waBack}>‹</div>
        <div className={styles.waAvatar}>A</div>
        <div className={styles.waInfo}>
          <span className={styles.waName}>AproximaAI Bot</span>
          <span className={styles.waOnline}>online</span>
        </div>
        <MessageSquare size={18} className={styles.waCallIcon} />
      </div>

      <div className={styles.waChat} ref={chatRef}>
        <div className={styles.waChatDate}>Hoje</div>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.waBubble} ${msg.from === 'user' ? styles.waBubbleUser : styles.waBubbleBot}`}
          >
            {msg.text.split('\n').map((line, j) => (
              <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
            ))}
            <span className={styles.waBubbleTime}>
              {msg.from === 'user' ? '✓✓' : ''} agora
            </span>
          </div>
        ))}
        {typing && (
          <div className={`${styles.waBubble} ${styles.waBubbleBot} ${styles.waTyping}`}>
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className={styles.waInputRow}>
        <div className={styles.waInputField}>
          <span>Digite uma mensagem</span>
        </div>
        <div className={styles.waMicBtn}>🎤</div>
      </div>
    </div>
  );
}

/* ── Data ── */
const features = [
  { icon: <CalendarCheck size={20} />, title: 'Agendamento via WhatsApp', desc: 'Clientes agendam pelo WhatsApp sem precisar baixar nenhum app. Zero fricção, máxima conversão.' },
  { icon: <Bot size={20} />, title: 'IA 24h por dia', desc: 'O assistente responde, confirma e cancela horários mesmo enquanto você dorme ou atende outros clientes.' },
  { icon: <BarChart3 size={20} />, title: 'Dashboard em tempo real', desc: 'Fila de espera, taxa de ocupação e histórico de atendimentos atualizados ao vivo no seu painel.' },
  { icon: <Users size={20} />, title: 'Gestão de equipe', desc: 'Escale horários por profissional, controle férias e visualize a performance individual de cada um.' },
  { icon: <Bell size={20} />, title: 'Lembretes automáticos', desc: 'Reduza faltas com lembretes enviados automaticamente 24h e 1h antes do horário marcado.' },
  { icon: <Shield size={20} />, title: 'Segurança & LGPD', desc: 'Dados criptografados, armazenados no Brasil, em conformidade total com a LGPD.' },
];

const steps = [
  {
    num: '01',
    title: 'Cliente manda mensagem',
    desc: 'Qualquer cliente envia uma mensagem simples no WhatsApp. Sem download, sem cadastro, sem complicação.',
  },
  {
    num: '02',
    title: 'IA entende e processa',
    desc: 'O AproximaAI analisa a disponibilidade em tempo real, identifica o serviço desejado e sugere opções em segundos.',
  },
  {
    num: '03',
    title: 'Confirmado automaticamente',
    desc: 'O agendamento é registrado, a fila é atualizada e o cliente recebe confirmação — tudo sem você precisar fazer nada.',
  },
];

const faqs = [
  { q: 'Preciso do WhatsApp Business?', a: 'Sim. Utilizamos a API oficial do WhatsApp Business. Nosso time cuida de toda a configuração durante o onboarding, é simples e rápido.' },
  { q: 'Funciona para qualquer tipo de negócio?', a: 'AproximaAI foi projetado para qualquer negócio que trabalha com atendimentos: barbearias, clínicas, salões, pet shops, consultórios e muito mais.' },
  { q: 'E se o cliente fizer uma pergunta que a IA não souber?', a: 'Nesse caso a conversa é transferida para você com o histórico completo. Você define quando e como a IA deve transferir o atendimento.' },
  { q: 'Preciso instalar alguma coisa?', a: 'Não. AproximaAI é 100% na nuvem. Você acessa o painel pelo navegador em qualquer dispositivo, a qualquer hora.' },
  { q: 'Como funciona o período de teste?', a: '14 dias completamente grátis, sem cartão de crédito. Você configura tudo, testa com clientes reais e só decide depois.' },
];

const logos = ['Barbearia Premium', 'Clínica Vita', 'Studio Beleza', 'Salão Luxo', 'Espaço Zen', 'PetCare Plus', 'Barber House', 'Beauty Lab'];

/* ── Main ── */
export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const toSection = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <a href="#hero" className={styles.navLogo}>
            <VennLogo size={18} />
            Aproxima<em>AI</em>
          </a>

          <ul className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
            <li><a href="#como-funciona" onClick={() => toSection('como-funciona')}>Como funciona</a></li>
            <li><a href="#features" onClick={() => toSection('features')}>Plataforma</a></li>
            <li><a href="#pricing" onClick={() => toSection('pricing')}>Planos</a></li>
            <li><a href="#faq" onClick={() => toSection('faq')}>FAQ</a></li>
          </ul>

          <div className={styles.navRight}>
            <button className={styles.navLogin} onClick={() => router.push('/')}>Entrar</button>
            <button className={styles.navCta} onClick={() => toSection('pricing')}>
              Começar grátis <ArrowRight size={13} />
            </button>
            <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label="menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>

          <div className={styles.heroText}>
            <Reveal>
              <span className={styles.badge}>
                <Sparkles size={11} />
                A IA que aproxima clientes ao seu negócio
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className={styles.heroH1}>
                Cada cliente<br />
                mais perto de <span className={styles.heroGrad}>você.</span><br />
                O <span className={styles.heroGrad}>AproximaAI</span> cuida do resto.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className={styles.heroSub}>
                AproximaAI conecta seu negócio ao WhatsApp com um assistente inteligente que agenda, confirma, lembra e gerencia — aproximando cada cliente do seu atendimento, automaticamente.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className={styles.heroCtas}>
                <button className={styles.ctaPrimary} onClick={() => toSection('pricing')}>
                  Começar grátis — 14 dias
                  <ArrowRight size={15} />
                </button>
                <button className={styles.ctaGhost} onClick={() => toSection('como-funciona')}>
                  Ver como funciona
                </button>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <strong>500+</strong>
                  <span>Estabelecimentos ativos</span>
                </div>
                <div className={styles.heroStatSep} />
                <div className={styles.heroStat}>
                  <strong>2.4M</strong>
                  <span>Agendamentos processados</span>
                </div>
                <div className={styles.heroStatSep} />
                <div className={styles.heroStat}>
                  <strong>38%</strong>
                  <span>Menos faltas</span>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className={styles.heroPhoneWrap}>
            <div className={styles.heroPhoneGlow} />
            <PhoneDemo />
          </Reveal>

        </div>
      </section>

      {/* ── LOGOS ── */}
      <div className={styles.logos}>
        <p className={styles.logosLabel}>Confiado por estabelecimentos em todo o Brasil</p>
        <div className={styles.logosTrack}>
          <div className={styles.logosSlide}>
            {[...logos, ...logos].map((l, i) => <span key={i} className={styles.logoItem}>{l}</span>)}
          </div>
        </div>
      </div>

      {/* ── COMO FUNCIONA ── */}
      <section className={styles.section} id="como-funciona">
        <div className={styles.inner}>
          <Reveal><span className={styles.sectionLabel}>Como funciona</span></Reveal>
          <Reveal delay={80}>
            <h2 className={styles.h2}>Do WhatsApp ao agendamento<br />em 3 passos.</h2>
          </Reveal>
          <Reveal delay={130}>
            <p className={styles.sectionSub}>
              Sem apps para baixar. Sem cadastros. Seus clientes já estão no WhatsApp.
            </p>
          </Reveal>

          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className={styles.stepCard}>
                  <span className={styles.stepNum}>{s.num}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="features">
        <div className={styles.inner}>
          <Reveal><span className={styles.sectionLabel}>Plataforma completa</span></Reveal>
          <Reveal delay={80}>
            <h2 className={styles.h2}>Tudo que seu negócio precisa,<br />em um só lugar.</h2>
          </Reveal>

          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 55}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={styles.section} id="pricing">
        <div className={styles.inner}>
          <Reveal><span className={styles.sectionLabel}>Planos</span></Reveal>
          <Reveal delay={80}><h2 className={styles.h2}>Simples e transparente.</h2></Reveal>
          <Reveal delay={130}>
            <p className={styles.sectionSub}>14 dias grátis em qualquer plano. Sem cartão de crédito. Cancele quando quiser.</p>
          </Reveal>

          <div className={styles.pricingGrid}>
            <Reveal delay={160}>
              <div className={styles.pricingCard}>
                <p className={styles.planName}>Base</p>
                <div className={styles.planPrice}>
                  <span>R$ 97</span><em>/mês</em>
                </div>
                <p className={styles.planDesc}>Para quem está começando a organizar os atendimentos.</p>
                <ul className={styles.planList}>
                  {['Agendamento online ilimitado', 'Dashboard de métricas', 'Até 5 profissionais', 'Notificações por e-mail', 'Suporte por e-mail'].map((item, i) => (
                    <li key={i}><CheckCircle2 size={14} />{item}</li>
                  ))}
                </ul>
                <button className={styles.planBtn} onClick={() => router.push('/')}>
                  Começar grátis <ArrowRight size={14} />
                </button>
              </div>
            </Reveal>

            <Reveal delay={250}>
              <div className={`${styles.pricingCard} ${styles.pricingPro}`}>
                <div className={styles.proTag}>Mais popular</div>
                <p className={styles.planName}>Pro</p>
                <div className={styles.planPrice}>
                  <span>R$ 247</span><em>/mês</em>
                </div>
                <p className={styles.planDesc}>IA + WhatsApp para automatizar e escalar seu negócio.</p>
                <ul className={styles.planList}>
                  {['Tudo do plano Base', 'Profissionais ilimitados', 'Chatbot WhatsApp com IA', 'Reagendamento automático', 'Análise preditiva de demanda', 'Relatórios inteligentes com IA', 'Suporte prioritário 24h', 'Onboarding personalizado'].map((item, i) => (
                    <li key={i}><CheckCircle2 size={14} />{item}</li>
                  ))}
                </ul>
                <button className={`${styles.planBtn} ${styles.planBtnPro}`} onClick={() => router.push('/')}>
                  Começar grátis <ArrowRight size={14} />
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="faq">
        <div className={styles.inner}>
          <Reveal><span className={styles.sectionLabel}>FAQ</span></Reveal>
          <Reveal delay={80}><h2 className={styles.h2}>Perguntas frequentes</h2></Reveal>
          <div className={styles.faqList}>
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <FaqItem question={f.q} answer={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBg} />
        <Reveal>
          <h2 className={styles.ctaH2}>
            Pronto para se aproximar<br />de mais clientes?
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className={styles.ctaSub}>
            Junte-se a mais de 500 estabelecimentos que já se aproximaram dos seus clientes. Cancele quando quiser.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <button className={`${styles.ctaPrimary} ${styles.ctaPrimaryLg}`} onClick={() => router.push('/')}>
            Começar agora — É grátis
            <ArrowRight size={16} />
          </button>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <VennLogo size={17} />
              Aproxima<em>AI</em>
            </div>
            <p>A IA que aproxima clientes do seu negócio.</p>
          </div>

          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <h4>Produto</h4>
              <a href="#como-funciona">Como funciona</a>
              <a href="#features">Plataforma</a>
              <a href="#pricing">Planos</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Empresa</h4>
              <a href="#faq">FAQ</a>
              <a href="#">Blog</a>
              <a href="#">Contato</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Legal</h4>
              <a href="#">Privacidade</a>
              <a href="#">Termos</a>
              <a href="#">LGPD</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2025 AproximaAI. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
