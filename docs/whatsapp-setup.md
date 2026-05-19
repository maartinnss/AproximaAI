# Fluxo Operacional — Configuração WhatsApp (Meta Cloud API)

> Estratégia: **A3** — AproximaAI gerencia a WABA e fornece números virtuais aos estabelecimentos.

---

## Visão geral

```
AproximaAI
└── 1 WABA (WhatsApp Business Account)
    ├── Número → Barbearia do João
    ├── Número → Salão Bella
    └── Número → Clínica Vita
```

Cada estabelecimento recebe um número virtual dedicado.  
O gestor **não precisa fazer nada técnico** — recebe o número pronto.

---

## Parte 1 — Setup único da AproximaAI (feito uma vez)

### 1.1 Criar conta Meta Business

1. Acessar [meta.com/business](https://business.facebook.com)
2. Criar conta empresarial com dados da AproximaAI
3. Verificar empresa (CNPJ, site, documentos)
4. Aguardar aprovação: 1–7 dias úteis

### 1.2 Criar WhatsApp Business Account (WABA)

```
Meta Business → Configurações → Contas → Contas do WhatsApp
→ Adicionar conta
→ Nome: AproximaAI
→ Fuso horário: América/São_Paulo
→ Moeda: BRL
```

### 1.3 Criar Meta App para API

```
developers.facebook.com
→ Criar App
→ Tipo: Business
→ Adicionar produto: WhatsApp
→ Vincular à WABA criada acima
```

Anotar:
- `App ID`
- `App Secret`
- `WABA ID`

### 1.4 Criar System User com token permanente

```
Meta Business → Configurações → Usuários → Usuários do sistema
→ Adicionar usuário do sistema (tipo Admin)
→ Atribuir ativo: o App criado
→ Gerar token → selecionar permissões:
    ✓ whatsapp_business_messaging
    ✓ whatsapp_business_management
→ Copiar token (não expira)
```

> ⚠️ Salvar o token gerado — não é exibido novamente.

### 1.5 Configurar variáveis de ambiente no servidor

```env
META_APP_ID=<App ID>
META_APP_SECRET=<App Secret>
META_WABA_ID=<WABA ID>
META_ACCESS_TOKEN=<System User Token>
META_VERIFY_TOKEN=<string aleatória forte, ex: openssl rand -hex 32>
META_GRAPH_VERSION=v21.0
```

### 1.6 Configurar Webhook no Meta App

```
Meta App → WhatsApp → Configuração → Webhooks
→ URL de callback: https://seuapp.vercel.app/api/webhook/whatsapp
→ Token de verificação: valor do META_VERIFY_TOKEN
→ Verificar e salvar
→ Assinar campos: messages ✓
```

Após salvar, o app vai receber e processar mensagens de todos os números da WABA.

---

## Parte 2 — Por novo estabelecimento (~20 min)

### 2.1 Adquirir número virtual

Escolher um provedor (custo ~R$ 40–60/mês por número):

| Provedor | Link | Observação |
|----------|------|-----------|
| Sinch | sinch.com | Boa cobertura BR |
| Vonage | vonage.com | API robusta |
| Twilio | twilio.com | Mais caro, mais fácil |

**Requisito:** número deve aceitar SMS ou ligação para verificação Meta.

### 2.2 Registrar número na WABA

```
Meta Business → WhatsApp → Números de telefone
→ Adicionar número de telefone
→ Inserir o número virtual adquirido
→ Verificar via SMS (ou ligação)
→ Configurar perfil:
    - Nome de exibição: nome do estabelecimento (ex: "Barbearia do João")
    - Categoria: Services
→ Aguardar aprovação do nome (instantânea ou até 24h)
→ Copiar o Phone Number ID gerado
```

### 2.3 Configurar no painel do gestor

```
Painel AproximaAI → WhatsApp & IA
→ Card "WhatsApp Business (Meta)"
→ Phone Number ID: <colar o ID copiado>
→ Número de exibição: +55 XX XXXXX-XXXX
→ Salvar
```

Pronto. O WhatsApp do estabelecimento já está ativo.

---

## Parte 3 — O que o gestor faz

O gestor **não configura o número** — recebe pronto via suporte.

No painel, o gestor pode:

1. **Ver status** — badge "Ativo" confirma que WhatsApp está funcionando
2. **Configurar persona da IA** — nome do assistente, tom, instruções
3. **Ativar/desativar IA** — toggle para pausar atendimento automático

```
WhatsApp & IA
┌─────────────────────────────────────────┐
│ WhatsApp Business (Meta)       ● Ativo  │
│ Phone Number ID: 1164...257             │
│ Número: +55 11 99999-9999               │
└─────────────────────────────────────────┘

Assistente IA                    [toggle ON]
Persona: "Você é a Ana, assistente da..."
[Salvar configurações]
```

---

## Parte 4 — Fluxo de mensagem em produção

```
1. Cliente envia mensagem para o número do estabelecimento
         │
         ▼
2. Meta Cloud API recebe e encaminha via webhook
   POST https://seuapp.vercel.app/api/webhook/whatsapp
         │
         ▼
3. App valida assinatura HMAC-SHA256 (META_APP_SECRET)
         │
         ▼
4. Roteia para o estabelecimento via whatsappPhoneNumberId
         │
         ▼
5. Enfileira job no BullMQ (Redis)
         │
         ▼
6. Worker VPS processa:
   └── Agente IA (Claude) analisa mensagem
   └── Executa tools: verificar horários, criar agendamento, etc.
   └── Gera resposta
         │
         ▼
7. Meta API envia resposta ao cliente via WhatsApp
```

---

## Custos estimados por estabelecimento/mês

| Item | Custo |
|------|-------|
| Número virtual | R$ 40–60 |
| Conversas service (cliente inicia) | Grátis |
| Conversas utility (confirmações) | ~R$ 0,22/conversa |
| Conversas marketing (promoções) | ~R$ 0,36/conversa |

**Estimativa típica (200 clientes ativos):**
- ~150 conversas service → R$ 0
- ~50 confirmações (utility) → R$ 11
- Número virtual → R$ 50
- **Total: ~R$ 61/mês por estabelecimento**

---

## Resumo de responsabilidades

| Passo | Responsável | Frequência |
|-------|-------------|-----------|
| Criar WABA + Meta App | AproximaAI | Uma vez |
| Configurar webhook global | AproximaAI | Uma vez |
| Comprar número virtual | AproximaAI | Por estabelecimento |
| Registrar número na Meta | AproximaAI | Por estabelecimento |
| Inserir Phone Number ID no painel | AproximaAI (suporte) | Por estabelecimento |
| Configurar persona da IA | Gestor | Quando quiser |
| Atendimento via WhatsApp | IA (automático) | 24/7 |

---

## Referências

- [Meta Business Platform](https://business.facebook.com)
- [Meta for Developers — WhatsApp](https://developers.facebook.com/docs/whatsapp)
- [Preços WhatsApp Business API (BR)](https://developers.facebook.com/docs/whatsapp/pricing)
- [Configurar Webhook Meta](https://developers.facebook.com/docs/whatsapp/webhooks)
