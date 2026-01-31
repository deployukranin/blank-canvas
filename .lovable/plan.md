
## Plano: Sistema OpenPix com Split de Pagamento para Custom Orders

### Resumo

Implementar integração completa com OpenPix para a página de Customs (vídeos/áudios personalizados):
- Cobrança PIX gerada ao clicar em **"Confirmar Pagamento"**
- Split automático: **79% Pix Out para criador** / **21% fica na OpenPix (você)**
- **Você paga a taxa** de 0.80% (descontada da sua parte)
- Secret `OPENPIX_APP_ID` já está configurada

---

### Fluxo do Pagamento

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO COMPLETO                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USUARIO CLICA "CONFIRMAR PAGAMENTO"                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Customs.tsx → create-pix-charge (Edge Function)                       │  │
│  │                                                                        │  │
│  │  POST { amount, product_type, product_id, creator_pix_key }           │  │
│  │                     ↓                                                  │  │
│  │  1. Gerar correlationID unico                                          │  │
│  │  2. Salvar pedido em "custom_orders" (status=pending)                  │  │
│  │  3. Chamar OpenPix API /charge                                         │  │
│  │  4. Retornar QR Code + brCode                                          │  │
│  │                     ↓                                                  │  │
│  │  5. Exibir modal com QR Code para usuario pagar                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  2. PAGAMENTO CONFIRMADO (WEBHOOK)                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  OpenPix → openpix-webhook (CHARGE_COMPLETED)                          │  │
│  │                     ↓                                                  │  │
│  │  1. Buscar pedido pelo correlationID                                   │  │
│  │  2. Idempotencia: se ja pago, retornar ok                              │  │
│  │  3. Atualizar status = 'paid'                                          │  │
│  │                     ↓                                                  │  │
│  │  4. CALCULAR SPLIT:                                                    │  │
│  │     ┌──────────────────────────────────────────────────────────────┐   │  │
│  │     │  total = 4990 centavos (R$ 49,90)                            │   │  │
│  │     │  creator_share = floor(4990 * 0.79) = 3942 centavos          │   │  │
│  │     │  platform_share = 4990 - 3942 = 1048 centavos                │   │  │
│  │     │  fee = round(4990 * 0.008) = 40 centavos                     │   │  │
│  │     │  platform_net = 1048 - 40 = 1008 (fica na OpenPix)           │   │  │
│  │     └──────────────────────────────────────────────────────────────┘   │  │
│  │                     ↓                                                  │  │
│  │  5. PIX OUT PARA CRIADOR (79%):                                        │  │
│  │     POST /api/v1/payment { value: 3942, destinationAlias: pix_key }    │  │
│  │                     ↓                                                  │  │
│  │  6. APROVAR PIX OUT:                                                   │  │
│  │     POST /api/v1/payment/<correlation>/approve                         │  │
│  │                     ↓                                                  │  │
│  │  7. Atualizar status = 'payout_done'                                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Novo Secret Necessario

| Secret | Descricao | Status |
|--------|-----------|--------|
| `OPENPIX_APP_ID` | API Key MASTER com Pix Out | Ja configurado |
| `CREATOR_PIX_KEY` | Chave PIX do criador de conteudo | **NOVO - Precisa adicionar** |

---

### 2. Migracao SQL - Nova Tabela

Tabela `custom_orders` para registrar pedidos e pagamentos:

```sql
CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  
  -- Dados do produto
  product_type TEXT NOT NULL,  -- 'video' ou 'audio'
  product_id TEXT,
  category TEXT NOT NULL,
  category_name TEXT,
  duration_minutes INTEGER,
  duration_label TEXT,
  
  -- Personalizacao
  customer_name TEXT NOT NULL,
  triggers TEXT,
  script TEXT,
  preferences TEXT,
  observations TEXT,
  
  -- Pagamento
  amount_cents INTEGER NOT NULL,
  correlation_id TEXT NOT NULL UNIQUE,
  openpix_charge_id TEXT,
  qr_code_image TEXT,
  br_code TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, paid, payout_done, payout_failed, delivered
  
  -- Pix Out tracking
  payout_correlation_id TEXT,
  payout_amount_cents INTEGER,
  payout_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX idx_custom_orders_correlation ON custom_orders(correlation_id);
CREATE INDEX idx_custom_orders_user ON custom_orders(user_id);
CREATE INDEX idx_custom_orders_status ON custom_orders(status);

-- RLS
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders"
  ON custom_orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert orders"
  ON custom_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates"
  ON custom_orders FOR UPDATE
  USING (true);
```

---

### 3. Edge Function: create-pix-charge

**Arquivo:** `supabase/functions/create-pix-charge/index.ts`

Funcionalidades:
- Recebe dados do pedido (amount, product_type, personalizacao)
- Converte valor para centavos
- Gera correlationID unico
- Salva em `custom_orders` com status `pending`
- Chama OpenPix API `/charge` para criar cobranca
- Retorna QR Code e brCode para o frontend exibir

**Request:**
```json
{
  "amount": 49.90,
  "product_type": "video",
  "category": "relaxamento",
  "category_name": "Relaxamento",
  "duration_minutes": 10,
  "duration_label": "10 minutos",
  "customer_name": "Joao",
  "triggers": "sussurro, tapping",
  "script": "...",
  "observations": "..."
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "uuid",
  "correlation_id": "ord_xxx",
  "qr_code_image": "https://...",
  "br_code": "00020126...",
  "expires_at": "2026-01-31T..."
}
```

---

### 4. Edge Function: openpix-webhook

**Arquivo:** `supabase/functions/openpix-webhook/index.ts`

Funcionalidades:

1. **Receber evento** `OPENPIX:CHARGE_COMPLETED`
2. **Buscar pedido** pelo correlationID
3. **Idempotencia**: se ja pago, retornar ok
4. **Calcular split**:
   - Creator: 79% do total
   - Plataforma: 21% do total (menos taxa de 0.80%)
5. **Executar Pix Out** para o criador (79%)
6. **Aprovar Pix Out** automaticamente
7. **Atualizar status** para `payout_done`

---

### 5. Frontend - Modificacoes em Customs.tsx

**Mudancas no fluxo de pagamento:**

1. Botao "Confirmar Pagamento" → chama `create-pix-charge`
2. Exibe modal com QR Code PIX
3. Polling para verificar status do pagamento
4. Quando pago → abre dialog de personalizacao
5. Salva personalizacao e exibe sucesso

**Novo componente:** `PixPaymentModal.tsx`
- Exibe QR Code
- Botao para copiar codigo PIX
- Timer de expiracao
- Polling para verificar pagamento

---

### 6. Hook usePixPayment

**Arquivo:** `src/hooks/use-pix-payment.ts`

```typescript
interface CreateChargeParams {
  amount: number;
  productType: 'video' | 'audio';
  category: string;
  categoryName: string;
  durationMinutes?: number;
  durationLabel?: string;
  customerName: string;
  triggers?: string;
  script?: string;
  preferences?: string;
  observations?: string;
}

// Retorna funcoes para:
// - createCharge() → gera cobranca PIX
// - checkPaymentStatus() → verifica se foi pago
// - copyBrCode() → copia codigo para area de transferencia
```

---

### 7. Atualizacao do config.toml

```toml
project_id = "lkwvlzcapuptcxvwukcm"

[functions.youtube-videos]
verify_jwt = false

[functions.export-metrics]
verify_jwt = false

[functions.create-pix-charge]
verify_jwt = false

[functions.openpix-webhook]
verify_jwt = false
```

---

### 8. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migracao SQL | NOVO | Criar tabela `custom_orders` |
| `supabase/functions/create-pix-charge/index.ts` | NOVO | Edge function criar cobranca |
| `supabase/functions/openpix-webhook/index.ts` | NOVO | Edge function webhook com split |
| `supabase/config.toml` | MODIFICAR | Adicionar novas functions |
| `src/hooks/use-pix-payment.ts` | NOVO | Hook para pagamento PIX |
| `src/components/payment/PixPaymentModal.tsx` | NOVO | Modal com QR Code |
| `src/pages/Customs.tsx` | MODIFICAR | Integrar pagamento PIX |

---

### 9. Configurar Webhook na OpenPix

Apos deploy, configurar no painel OpenPix:

1. Acesse: **API/Plugins → Webhooks**
2. URL: `https://lkwvlzcapuptcxvwukcm.supabase.co/functions/v1/openpix-webhook`
3. Eventos: `OPENPIX:CHARGE_COMPLETED`

---

### 10. Exemplo de Calculo de Split

Para um pedido de **R$ 49,90**:

| Item | Valor |
|------|-------|
| Total | R$ 49,90 (4990 centavos) |
| Criador (79%) | R$ 39,42 (3942 centavos) → **Pix Out** |
| Plataforma (21%) | R$ 10,48 (1048 centavos) |
| Taxa OpenPix (0.80%) | R$ 0,40 (40 centavos) |
| **Plataforma Liquido** | R$ 10,08 (1008 centavos) → fica na OpenPix |

---

### Proximo Passo

Preciso que voce adicione o secret `CREATOR_PIX_KEY` com a chave PIX do criador de conteudo que recebera os 79%. Pode ser CPF, CNPJ, email, telefone ou chave aleatoria.

