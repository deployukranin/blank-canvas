

## Plano: Sistema de Split OpenPix com Pix Out Unico para Influenciador

### Resumo do Pedido

Implementar um sistema de pagamento PIX com OpenPix onde:
- **Apenas 1 Pix Out** e feito (somente para o influenciador)
- O restante fica no saldo OpenPix da plataforma
- A taxa OpenPix (0,80%) e atribuida conforme o tipo de venda

### Dois Cenarios de Venda

| Cenario | Tipo | Influenciador | Plataforma | Quem paga taxa |
|---------|------|---------------|------------|----------------|
| A | `creator_custom` | 80% | 20% | Influenciador (desconta do payout) |
| B | `platform_store` | 30% | 70% | Plataforma (registra como custo) |

---

### O Que Ja Existe vs O Que Sera Modificado

**Tabelas Existentes:**
- `influencers` - ja existe, mas precisa adicionar campos
- `pix_payments` - ja existe, usaremos para base

**Tabelas Novas:**
- `orders` - registrar pedidos com tipo (creator_custom/platform_store)
- `payouts` - registrar detalhes do Pix Out para influenciador

**Edge Functions:**
- `create-pix-charge` → **SUBSTITUIR** por `create-openpix-charge` (nova logica)
- `openpix-webhook` → **REESCREVER** para incluir Pix Out automatico

---

### Arquitetura do Novo Fluxo

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DE PAGAMENTO                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. CRIACAO DA COBRANCA                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Frontend → create-openpix-charge                                     │ │
│  │                                                                       │ │
│  │  POST { order_type: "creator_custom", influencer_id, amount: 49.90 } │ │
│  │                     ↓                                                 │ │
│  │  1. Converter para centavos (4990)                                    │ │
│  │  2. Gerar correlationID (ord_<uuid>)                                  │ │
│  │  3. Salvar em "orders" status=pending                                 │ │
│  │  4. Chamar OpenPix API /charge (SEM split na cobranca)                │ │
│  │  5. Retornar QR Code + brCode                                         │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  2. PAGAMENTO CONFIRMADO (WEBHOOK)                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  OpenPix → openpix-webhook (OPENPIX:CHARGE_COMPLETED)                 │ │
│  │                     ↓                                                 │ │
│  │  1. Buscar order pelo correlationID                                   │ │
│  │  2. Idempotencia: se ja paid, retornar ok                             │ │
│  │  3. Marcar order status=paid, paid_at=now()                           │ │
│  │                     ↓                                                 │ │
│  │  4. CALCULAR SPLIT:                                                   │ │
│  │     ┌─────────────────────────────────────────────────────────────┐   │ │
│  │     │  total = 4990 centavos                                      │   │ │
│  │     │  fee = round(4990 * 0.008) = 40 centavos                    │   │ │
│  │     │                                                             │   │ │
│  │     │  SE creator_custom:                                         │   │ │
│  │     │    influencer_gross = floor(4990 * 0.80) = 3992             │   │ │
│  │     │    influencer_payout = 3992 - 40 = 3952 (taxa descontada)   │   │ │
│  │     │    platform = 4990 - 3992 = 998                             │   │ │
│  │     │    who_pays_fee = 'influencer'                              │   │ │
│  │     │                                                             │   │ │
│  │     │  SE platform_store:                                         │   │ │
│  │     │    influencer_gross = floor(4990 * 0.30) = 1497             │   │ │
│  │     │    influencer_payout = 1497 (sem desconto)                  │   │ │
│  │     │    platform = 4990 - 1497 = 3493                            │   │ │
│  │     │    who_pays_fee = 'platform' (40 registrado como custo)     │   │ │
│  │     └─────────────────────────────────────────────────────────────┘   │ │
│  │                     ↓                                                 │ │
│  │  5. Salvar calculo em "payouts"                                       │ │
│  │                     ↓                                                 │ │
│  │  6. PIX OUT PARA INFLUENCIADOR (UNICO):                               │ │
│  │     POST /api/v1/payment                                              │ │
│  │     { value: influencer_payout, destinationAlias: pix_key }           │ │
│  │                     ↓                                                 │ │
│  │  7. APROVAR PIX OUT:                                                  │ │
│  │     POST /api/v1/payment/<correlation>/approve                        │ │
│  │                     ↓                                                 │ │
│  │  8. Atualizar payouts.status=approved, orders.status=payout_done      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Migracao SQL - Novas Tabelas

```sql
-- TABELA: orders
-- Registra cada pedido com tipo de venda
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL CHECK (order_type IN ('creator_custom', 'platform_store')),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'payout_done', 'payout_failed')),
  correlation_id TEXT NOT NULL UNIQUE,
  openpix_charge_id TEXT,
  user_id UUID,
  product_type TEXT,
  product_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  pix_brcode TEXT,
  pix_qrcode_image TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Indices para orders
CREATE INDEX idx_orders_correlation_id ON public.orders(correlation_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_influencer_id ON public.orders(influencer_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- TABELA: payouts
-- Registra cada Pix Out para influenciador
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id),
  
  -- Valores calculados
  amount_cents INTEGER NOT NULL,      -- Valor liquido para influenciador
  fee_cents INTEGER NOT NULL,         -- Taxa OpenPix (0.80%)
  platform_cents INTEGER NOT NULL,    -- Valor que fica na plataforma
  
  -- Quem paga a taxa
  who_pays_fee TEXT NOT NULL CHECK (who_pays_fee IN ('influencer', 'platform')),
  
  -- Pix Out tracking
  payment_correlation_id TEXT UNIQUE, -- payout_<correlation_id>
  openpix_payment_id TEXT,            -- ID do pagamento na OpenPix
  
  -- Status do Pix Out
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'failed')),
  
  -- Metadados
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- Indices para payouts
CREATE INDEX idx_payouts_order_id ON public.payouts(order_id);
CREATE INDEX idx_payouts_payment_correlation_id ON public.payouts(payment_correlation_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- RLS para orders (service role apenas)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS para payouts (service role apenas)
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages payouts"
  ON public.payouts FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

### 2. Edge Function: create-openpix-charge

**Arquivo:** `supabase/functions/create-openpix-charge/index.ts`

Funcionalidades:
- Recebe `order_type`, `influencer_id`, `amount` (em reais)
- Converte para centavos
- Gera `correlationID` unico (`ord_<uuid>`)
- Salva em `orders` com status `pending`
- Chama OpenPix API para criar cobranca (SEM split nativo)
- Retorna QR Code, brCode, correlationID

**Request esperado:**
```json
{
  "order_type": "creator_custom",
  "influencer_id": "uuid-do-influencer",
  "amount": 49.90,
  "customer_name": "Joao Silva",
  "customer_email": "joao@email.com",
  "product_type": "CUSTOM_VIDEO",
  "product_id": "video-123"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "correlationId": "ord_abc123",
    "status": "pending",
    "amountCents": 4990
  },
  "charge": {
    "brCode": "00020126...",
    "qrCodeImage": "https://...",
    "expiresAt": "2026-01-31T..."
  }
}
```

---

### 3. Edge Function: openpix-webhook (Reescrita)

**Arquivo:** `supabase/functions/openpix-webhook/index.ts`

Funcionalidades:

**3.1 Processar Pagamento:**
- Receber evento `OPENPIX:CHARGE_COMPLETED`
- Buscar `orders` pelo `correlationID`
- Idempotencia: se `status != pending`, retornar ok
- Atualizar `orders.status = 'paid'`, `paid_at = now()`

**3.2 Calcular Split:**
```typescript
const total_cents = order.amount_cents;
const fee_cents = Math.round(total_cents * 0.008); // 0.80%

let influencer_pct: number;
let who_pays_fee: 'influencer' | 'platform';

if (order.order_type === 'creator_custom') {
  influencer_pct = 0.80;
  who_pays_fee = 'influencer';
} else { // platform_store
  influencer_pct = 0.30;
  who_pays_fee = 'platform';
}

const influencer_gross_cents = Math.floor(total_cents * influencer_pct);
const influencer_payout_cents = who_pays_fee === 'influencer' 
  ? influencer_gross_cents - fee_cents 
  : influencer_gross_cents;

const platform_cents = total_cents - influencer_gross_cents;
```

**3.3 Salvar em payouts:**
```typescript
await supabase.from('payouts').insert({
  order_id: order.id,
  influencer_id: order.influencer_id,
  amount_cents: influencer_payout_cents,
  fee_cents,
  platform_cents,
  who_pays_fee,
  payment_correlation_id: `payout_${order.correlation_id}`,
  status: 'pending'
});
```

**3.4 Executar Pix Out:**
```typescript
// Buscar chave PIX do influenciador
const { data: influencer } = await supabase
  .from('influencers')
  .select('pix_key')
  .eq('id', order.influencer_id)
  .single();

// Criar pagamento Pix Out
const paymentResponse = await fetch('https://api.openpix.com.br/api/v1/payment', {
  method: 'POST',
  headers: {
    'Authorization': OPENPIX_APP_ID,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    value: influencer_payout_cents,
    destinationAlias: influencer.pix_key,
    comment: `Repasse automatico - ${order.correlation_id}`,
    correlationID: `payout_${order.correlation_id}`
  })
});

// Aprovar pagamento automaticamente
await fetch(`https://api.openpix.com.br/api/v1/payment/payout_${order.correlation_id}/approve`, {
  method: 'POST',
  headers: { 'Authorization': OPENPIX_APP_ID }
});
```

**3.5 Atualizar Status Final:**
```typescript
// Sucesso
await supabase.from('payouts').update({ status: 'approved', approved_at: new Date() }).eq('order_id', order.id);
await supabase.from('orders').update({ status: 'payout_done' }).eq('id', order.id);

// Falha
await supabase.from('payouts').update({ status: 'failed', error_message: errorMessage }).eq('order_id', order.id);
await supabase.from('orders').update({ status: 'payout_failed' }).eq('id', order.id);
```

---

### 4. Secrets Necessarios

| Secret | Descricao | Obrigatorio |
|--------|-----------|-------------|
| `OPENPIX_APP_ID` | API Key MASTER com Pix Out habilitado | Sim |
| `OPENPIX_WEBHOOK_SECRET` | Para validar assinatura (opcional) | Nao |

**Verificar:** O `OPENPIX_APP_ID` ja esta configurado. Confirme que tem o scope de `payment` (Pix Out).

---

### 5. Atualizacao do supabase/config.toml

```toml
project_id = "lkwvlzcapuptcxvwukcm"

[functions.create-openpix-charge]
verify_jwt = false

[functions.openpix-webhook]
verify_jwt = false

# Manter as outras funcoes existentes...
[functions.youtube-videos]
verify_jwt = false

[functions.export-metrics]
verify_jwt = false

[functions.send-report]
verify_jwt = false

[functions.manage-subaccount]
verify_jwt = false

# Remover ou deprecar as antigas
# [functions.create-pix-charge] - SUBSTITUIDA
# [functions.mock-pix-webhook] - REMOVER se nao usar
# [functions.sandbox-pix-test] - REMOVER se nao usar
```

---

### 6. Frontend - Hook usePixPayment Atualizado

**Arquivo:** `src/hooks/use-pix-payment.ts`

Atualizar para usar a nova edge function:

```typescript
interface CreateOrderParams {
  orderType: 'creator_custom' | 'platform_store';
  influencerId: string;
  amount: number; // em reais
  productType?: string;
  productId?: string;
  customerName?: string;
  customerEmail?: string;
}

const createOrder = async (params: CreateOrderParams) => {
  const { data, error } = await supabase.functions.invoke('create-openpix-charge', {
    body: params
  });
  // ...
};
```

---

### 7. Integracao com Customs.tsx e Loja.tsx

**Customs.tsx (Personalizados do Criador):**
```typescript
// Ao criar pedido customizado
await createOrder({
  orderType: 'creator_custom',
  influencerId: selectedInfluencerId,
  amount: finalPrice,
  productType: 'CUSTOM_VIDEO',
  productId: `custom-${category}-${duration}`
});
```

**Loja.tsx (Loja da Plataforma):**
```typescript
// Ao comprar produto da loja
await createOrder({
  orderType: 'platform_store',
  influencerId: selectedInfluencerId,
  amount: product.price,
  productType: 'STORE_ITEM',
  productId: product.id
});
```

---

### 8. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migracao SQL | **NOVO** | Criar tabelas `orders` e `payouts` |
| `supabase/functions/create-openpix-charge/index.ts` | **NOVO** | Edge function para criar cobranca |
| `supabase/functions/openpix-webhook/index.ts` | **REESCREVER** | Incluir calculo de split e Pix Out |
| `supabase/config.toml` | Modificar | Adicionar nova function |
| `src/hooks/use-pix-payment.ts` | Modificar | Atualizar para nova API |
| `src/pages/Customs.tsx` | Modificar | Usar `orderType: 'creator_custom'` |
| `src/pages/Loja.tsx` | Modificar | Usar `orderType: 'platform_store'` |

---

### Configurar Webhook na OpenPix

Apos deploy, configurar na OpenPix:

1. Acesse: **Developers → Webhooks**
2. URL: `https://lkwvlzcapuptcxvwukcm.supabase.co/functions/v1/openpix-webhook`
3. Eventos: `OPENPIX:CHARGE_COMPLETED`
4. (Opcional) Copiar **Webhook Secret** e salvar como `OPENPIX_WEBHOOK_SECRET`

---

### Exemplo de Payloads para Teste

**Criar cobranca tipo A (Personalizados):**
```json
POST /functions/v1/create-openpix-charge
{
  "order_type": "creator_custom",
  "influencer_id": "uuid-do-influencer",
  "amount": 49.90,
  "product_type": "CUSTOM_VIDEO"
}
```

**Criar cobranca tipo B (Loja):**
```json
POST /functions/v1/create-openpix-charge
{
  "order_type": "platform_store",
  "influencer_id": "uuid-do-influencer",
  "amount": 99.90,
  "product_type": "STORE_ITEM",
  "product_id": "product-123"
}
```

---

### Resumo das URLs apos Deploy

| Function | URL |
|----------|-----|
| Criar Cobranca | `https://lkwvlzcapuptcxvwukcm.supabase.co/functions/v1/create-openpix-charge` |
| Webhook | `https://lkwvlzcapuptcxvwukcm.supabase.co/functions/v1/openpix-webhook` |

---

### Validacoes de Seguranca

- Pix Out so executado apos pagamento confirmado via webhook
- Idempotencia: mesmo webhook nao processa duas vezes
- Validacao de assinatura do webhook (se `OPENPIX_WEBHOOK_SECRET` configurado)
- Logs detalhados para auditoria
- Tratamento de erros com fallback para status `payout_failed`

