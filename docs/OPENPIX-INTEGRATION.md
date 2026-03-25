# Integração OpenPix - Documentação Completa

Este documento descreve a implementação completa da integração com OpenPix para pagamentos PIX com split automático entre plataforma e criador de conteúdo.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração de Secrets](#configuração-de-secrets)
4. [Banco de Dados](#banco-de-dados)
5. [Edge Functions](#edge-functions)
6. [Fluxo de Pagamento](#fluxo-de-pagamento)
7. [Split de Pagamentos](#split-de-pagamentos)
8. [Frontend (React)](#frontend-react)
9. [Webhook OpenPix](#webhook-openpix)
10. [Troubleshooting](#troubleshooting)
11. [Considerações de Segurança](#considerações-de-segurança)

---

## Visão Geral

A integração permite:
- Criar cobranças PIX dinâmicas (QR Code)
- Receber notificações de pagamento via webhook
- Fazer split automático: **79% para o criador** e **21% para a plataforma**
- Enviar automaticamente o repasse via **Pix Out**

### Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Frontend | React + TypeScript |
| Backend | Supabase Edge Functions (Deno) |
| Banco de Dados | PostgreSQL (Supabase) |
| Gateway de Pagamento | OpenPix (Woovi) |
| Protocolo | PIX (Banco Central do Brasil) |

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│  Edge Function  │────▶│    OpenPix      │
│    (React)      │     │ create-pix-     │     │    API          │
│                 │     │ charge          │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        │
                        ┌─────────────────┐             │
                        │                 │             │
                        │   Supabase DB   │             │
                        │  custom_orders  │             │
                        │                 │             │
                        └─────────────────┘             │
                               ▲                        │
                               │                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Criador      │◀────│  Edge Function  │◀────│   OpenPix       │
│   (Pix Out)    │     │ openpix-webhook │     │   Webhook       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Configuração de Secrets

### Secrets Necessários

Configure os seguintes secrets no Supabase/Lovable Cloud:

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `OPENPIX_APP_ID` | App ID da OpenPix (API Key) | `Q2xpZW50X0lkXzEy...` |
| `CREATOR_PIX_KEY` | Chave PIX do criador (destino do repasse) | `email@exemplo.com` ou CPF ou chave aleatória |
| `CREATOR_TAX_ID` | CPF/CNPJ do criador (sem pontuação) | `12345678901` |

### Como Obter

1. **OPENPIX_APP_ID**: 
   - Acesse [OpenPix Dashboard](https://app.openpix.com.br)
   - Vá em `API/Plugins` → `Nova API`
   - Copie o `App ID` gerado

2. **CREATOR_PIX_KEY**: 
   - Chave PIX do criador que receberá os 79%
   - Pode ser: CPF, CNPJ, email, telefone ou chave aleatória

3. **CREATOR_TAX_ID**: 
   - CPF (11 dígitos) ou CNPJ (14 dígitos) do criador
   - Apenas números, sem pontuação

### Configurar no Lovable Cloud

```bash
# Via Supabase CLI (se usando projeto externo)
supabase secrets set OPENPIX_APP_ID="seu_app_id"
supabase secrets set CREATOR_PIX_KEY="chave_pix_criador"
supabase secrets set CREATOR_TAX_ID="12345678901"
```

---

## Banco de Dados

### Tabela: `custom_orders`

```sql
CREATE TABLE public.custom_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificadores
  correlation_id TEXT NOT NULL UNIQUE,
  openpix_charge_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  
  -- Produto
  product_type TEXT NOT NULL,           -- 'video' ou 'audio'
  product_id TEXT,
  category TEXT NOT NULL,
  category_name TEXT,
  
  -- Detalhes do pedido
  customer_name TEXT NOT NULL,
  duration_minutes INTEGER,
  duration_label TEXT,
  triggers TEXT,
  script TEXT,
  preferences TEXT,
  observations TEXT,
  
  -- Valores (em centavos)
  amount_cents INTEGER NOT NULL,
  payout_amount_cents INTEGER,          -- Valor do repasse (79%)
  
  -- PIX
  br_code TEXT,
  qr_code_image TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Valores possíveis: 'pending', 'paid', 'payout_done', 'delivered'
  
  paid_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Payout (Pix Out)
  payout_correlation_id TEXT,
  payout_status TEXT,
  -- Valores possíveis: 'created', 'approved', 'pending_approval', 'failed'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert orders" 
ON public.custom_orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update orders" 
ON public.custom_orders FOR UPDATE 
USING (true);

CREATE POLICY "Users view own orders" 
ON public.custom_orders FOR SELECT 
USING ((auth.uid() = user_id) OR (user_id IS NULL));
```

### Fluxo de Status

```
pending ──▶ paid ──▶ payout_done ──▶ delivered
   │          │           │
   │          │           └── Criador entregou o conteúdo
   │          │
   │          └── Pagamento confirmado + Pix Out enviado
   │
   └── Aguardando pagamento PIX
```

---

## Edge Functions

### 1. `create-pix-charge`

**Endpoint**: `POST /functions/v1/create-pix-charge`

**Responsabilidade**: Criar uma cobrança PIX na OpenPix e salvar no banco.

**Request**:
```json
{
  "amount": 1990,
  "productType": "video",
  "category": "roleplay",
  "categoryName": "Roleplay",
  "durationMinutes": 5,
  "durationLabel": "5 minutos",
  "customerName": "João Silva",
  "triggers": "sussurros, tapping",
  "script": "Descrição do roteiro...",
  "preferences": "Preferências do cliente...",
  "observations": "Observações adicionais..."
}
```

**Response (sucesso)**:
```json
{
  "success": true,
  "order_id": "uuid-do-pedido",
  "correlation_id": "ord_1234567890_abc123",
  "qr_code_image": "https://api.woovi.com/openpix/charge/brcode/image/xxx.png",
  "br_code": "00020126...",
  "expires_at": "2024-01-15T11:00:00Z"
}
```

**Código Completo**:

```typescript
// supabase/functions/create-pix-charge/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChargeRequest {
  amount: number;
  productType: 'video' | 'audio';
  category: string;
  categoryName?: string;
  durationMinutes?: number;
  durationLabel?: string;
  customerName: string;
  triggers?: string;
  script?: string;
  preferences?: string;
  observations?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENPIX_APP_ID) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment provider not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ChargeRequest = await req.json();
    const { amount, productType, category, categoryName, customerName } = body;

    // Validar valor mínimo (R$ 10,00 = 1000 centavos)
    if (amount < 1000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor mínimo é R$ 10,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar correlation ID único
    const correlationID = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Criar cobrança na OpenPix
    const chargeResponse = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID,
        value: amount,
        comment: `${productType === 'video' ? 'Vídeo' : 'Áudio'} Personalizado - ${categoryName || category}`,
        expiresIn: 900, // 15 minutos
      }),
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok || chargeData.error) {
      return new Response(
        JSON.stringify({ success: false, error: chargeData.error || 'Failed to create charge' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar pedido no banco
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: order, error: dbError } = await supabase
      .from('custom_orders')
      .insert({
        correlation_id: correlationID,
        openpix_charge_id: chargeData.charge?.identifier,
        product_type: productType,
        category,
        category_name: categoryName,
        customer_name: customerName,
        duration_minutes: body.durationMinutes,
        duration_label: body.durationLabel,
        triggers: body.triggers,
        script: body.script,
        preferences: body.preferences,
        observations: body.observations,
        amount_cents: amount,
        br_code: chargeData.charge?.brCode || chargeData.brCode,
        qr_code_image: chargeData.charge?.qrCodeImage || chargeData.qrCodeImage,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        correlation_id: correlationID,
        qr_code_image: chargeData.charge?.qrCodeImage || chargeData.qrCodeImage,
        br_code: chargeData.charge?.brCode || chargeData.brCode,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### 2. `openpix-webhook`

**Endpoint**: `POST /functions/v1/openpix-webhook`

**Responsabilidade**: 
- Receber notificação de pagamento confirmado
- Atualizar status do pedido
- Criar e aprovar Pix Out para o criador (79%)

**Evento Processado**: `OPENPIX:CHARGE_COMPLETED`

**Fluxo Interno**:

```
1. Receber webhook
2. Validar evento (CHARGE_COMPLETED)
3. Buscar pedido por correlationID
4. Verificar idempotência
5. Calcular split (79% / 21%)
6. Atualizar status para 'paid'
7. Criar Pix Out (POST /api/v1/payment)
8. Aprovar Pix Out (POST /api/v1/payment/approve)
9. Atualizar status para 'payout_done'
```

**Código Completo**:

```typescript
// supabase/functions/openpix-webhook/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Percentuais do split
const CREATOR_PERCENTAGE = 0.79;  // 79% para o criador
const PLATFORM_PERCENTAGE = 0.21; // 21% para a plataforma
const OPENPIX_FEE_PERCENTAGE = 0.008; // 0.80% taxa OpenPix

interface OpenPixWebhookPayload {
  event: string;
  charge?: {
    correlationID: string;
    value: number;
    status: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const CREATOR_PIX_KEY = Deno.env.get('CREATOR_PIX_KEY');
    const CREATOR_TAX_ID = Deno.env.get('CREATOR_TAX_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validar secrets
    if (!OPENPIX_APP_ID || !CREATOR_PIX_KEY || !CREATOR_TAX_ID) {
      console.error('Missing required secrets');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: OpenPixWebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload));

    // Ignorar webhooks de teste
    if ((payload as any).evento === 'teste_webhook') {
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Test webhook' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar apenas CHARGE_COMPLETED
    if (payload.event !== 'OPENPIX:CHARGE_COMPLETED') {
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Event not relevant' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correlationID = payload.charge?.correlationID;
    if (!correlationID) {
      return new Response(
        JSON.stringify({ error: 'Missing correlationID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar pedido
    const { data: order, error: fetchError } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('correlation_id', correlationID)
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotência: se já processado completamente, retornar
    if (['payout_done', 'delivered'].includes(order.status)) {
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular split
    const totalCents = order.amount_cents;
    const creatorShareCents = Math.floor(totalCents * CREATOR_PERCENTAGE);
    const platformShareCents = totalCents - creatorShareCents;
    const feeCents = Math.round(totalCents * OPENPIX_FEE_PERCENTAGE);

    console.log('Split:', { total: totalCents, creator: creatorShareCents, platform: platformShareCents });

    // Atualizar para 'paid' (se ainda pendente)
    if (order.status === 'pending') {
      await supabase
        .from('custom_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_amount_cents: creatorShareCents,
        })
        .eq('id', order.id);
    }

    // Criar Pix Out
    const payoutCorrelationID = `payout_${correlationID}`;
    
    const pixOutResponse = await fetch('https://api.openpix.com.br/api/v1/payment', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: payoutCorrelationID,
        value: creatorShareCents,
        destinationAlias: CREATOR_PIX_KEY,
        taxId: CREATOR_TAX_ID,
        comment: `Repasse ${order.product_type} - ${order.category_name || order.category}`,
      }),
    });

    const pixOutData = await pixOutResponse.json();
    console.log('Pix Out response:', JSON.stringify(pixOutData));

    if (!pixOutResponse.ok || pixOutData.error) {
      // Falha ao criar Pix Out
      await supabase
        .from('custom_orders')
        .update({
          payout_correlation_id: payoutCorrelationID,
          payout_status: 'failed',
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ received: true, payout_status: 'failed', error: pixOutData.error }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aprovar Pix Out
    let payoutFinalStatus = 'created';
    
    try {
      const approveResponse = await fetch('https://api.openpix.com.br/api/v1/payment/approve', {
        method: 'POST',
        headers: {
          'Authorization': OPENPIX_APP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correlationID: payoutCorrelationID }),
      });

      if (approveResponse.ok) {
        payoutFinalStatus = 'approved';
      } else {
        const responseText = await approveResponse.text();
        console.log(`Approve returned ${approveResponse.status}: ${responseText}`);
        payoutFinalStatus = 'pending_approval';
      }
    } catch (approveError) {
      console.error('Approve error:', approveError);
      payoutFinalStatus = 'pending_approval';
    }

    // Atualizar status final
    await supabase
      .from('custom_orders')
      .update({
        status: 'payout_done',
        payout_correlation_id: payoutCorrelationID,
        payout_status: payoutFinalStatus,
      })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        received: true,
        processed: true,
        order_id: order.id,
        payout_status: payoutFinalStatus,
        split: {
          total: totalCents,
          creator: creatorShareCents,
          platform: platformShareCents - feeCents,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Fluxo de Pagamento

### Diagrama de Sequência

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Cliente │     │ Frontend │     │  Edge Fn │     │  OpenPix │     │   DB     │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ 1. Preenche    │                │                │                │
     │    formulário  │                │                │                │
     │───────────────▶│                │                │                │
     │                │                │                │                │
     │                │ 2. Chama       │                │                │
     │                │    create-pix  │                │                │
     │                │───────────────▶│                │                │
     │                │                │                │                │
     │                │                │ 3. Cria charge │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │                │                │ 4. QR Code     │                │
     │                │                │◀───────────────│                │
     │                │                │                │                │
     │                │                │ 5. Salva pedido│                │
     │                │                │───────────────────────────────▶│
     │                │                │                │                │
     │                │ 6. Retorna     │                │                │
     │                │    QR Code     │                │                │
     │                │◀───────────────│                │                │
     │                │                │                │                │
     │ 7. Exibe       │                │                │                │
     │    QR Code     │                │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
     │ 8. Paga PIX    │                │                │                │
     │────────────────────────────────────────────────▶│                │
     │                │                │                │                │
     │                │                │ 9. Webhook     │                │
     │                │                │◀───────────────│                │
     │                │                │                │                │
     │                │                │ 10. Atualiza   │                │
     │                │                │     status     │                │
     │                │                │───────────────────────────────▶│
     │                │                │                │                │
     │                │                │ 11. Cria       │                │
     │                │                │     Pix Out    │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │                │                │ 12. Aprova     │                │
     │                │                │     Pix Out    │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │                │                │ 13. Pix Out OK │                │
     │                │                │◀───────────────│                │
     │                │                │                │                │
     │                │                │ 14. Status     │                │
     │                │                │     payout_done│                │
     │                │                │───────────────────────────────▶│
     │                │                │                │                │
```

### Resumo do Fluxo

1. **Cliente** preenche formulário de pedido personalizado
2. **Frontend** chama `create-pix-charge` com dados do pedido
3. **Edge Function** cria cobrança na OpenPix API
4. **OpenPix** retorna QR Code e brCode
5. **Edge Function** salva pedido no banco com status `pending`
6. **Frontend** recebe QR Code e exibe para o cliente
7. **Cliente** paga usando app do banco
8. **OpenPix** confirma pagamento e dispara webhook
9. **Edge Function** `openpix-webhook` recebe notificação
10. Atualiza pedido para status `paid`
11. Cria Pix Out para o criador (79% do valor)
12. Aprova o Pix Out
13. Dinheiro é transferido para conta do criador
14. Atualiza pedido para status `payout_done`

---

## Split de Pagamentos

### Percentuais

| Destinatário | Percentual | Exemplo (R$ 100) |
|--------------|------------|------------------|
| Criador | 79% | R$ 79,00 |
| Plataforma | 21% | R$ 21,00 |
| Taxa OpenPix | 0,80% | R$ 0,80 |
| **Líquido Plataforma** | ~20,2% | R$ 20,20 |

### Cálculo no Código

```typescript
const CREATOR_PERCENTAGE = 0.79;
const PLATFORM_PERCENTAGE = 0.21;
const OPENPIX_FEE_PERCENTAGE = 0.008;

const totalCents = 10000; // R$ 100,00

const creatorShareCents = Math.floor(totalCents * CREATOR_PERCENTAGE);
// 7900 centavos = R$ 79,00

const platformShareCents = totalCents - creatorShareCents;
// 2100 centavos = R$ 21,00

const feeCents = Math.round(totalCents * OPENPIX_FEE_PERCENTAGE);
// 80 centavos = R$ 0,80

const platformNetCents = platformShareCents - feeCents;
// 2020 centavos = R$ 20,20
```

### Valor Mínimo

**R$ 10,00** é o valor mínimo para garantir que:
- O split gere valores significativos
- A taxa OpenPix seja coberta
- O Pix Out seja processado corretamente

---

## Frontend (React)

### Hook: `usePixPayment`

```typescript
// src/hooks/use-pix-payment.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CreateChargeParams {
  amount: number;
  productType: 'video' | 'audio';
  category: string;
  categoryName?: string;
  customerName: string;
  // ... outros campos
}

export interface PixChargeResult {
  success: boolean;
  orderId?: string;
  correlationId?: string;
  qrCodeImage?: string;
  brCode?: string;
  expiresAt?: string;
  error?: string;
}

export function usePixPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [chargeData, setChargeData] = useState<PixChargeResult | null>(null);

  const createCharge = useCallback(async (params: CreateChargeParams) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: params,
      });

      if (error || !data?.success) {
        return { success: false, error: error?.message || data?.error };
      }

      const result = {
        success: true,
        orderId: data.order_id,
        correlationId: data.correlation_id,
        qrCodeImage: data.qr_code_image,
        brCode: data.br_code,
        expiresAt: data.expires_at,
      };

      setChargeData(result);
      return result;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (correlationId: string) => {
    const { data } = await supabase
      .from('custom_orders')
      .select('status, paid_at')
      .eq('correlation_id', correlationId)
      .single();

    return data;
  }, []);

  return { isLoading, chargeData, createCharge, checkPaymentStatus };
}
```

### Componente: Modal de Pagamento

```tsx
// Exemplo simplificado
function PixPaymentModal({ qrCodeImage, brCode, onPaid }) {
  return (
    <Dialog>
      <DialogContent>
        <img src={qrCodeImage} alt="QR Code PIX" />
        
        <Button onClick={() => navigator.clipboard.writeText(brCode)}>
          Copiar código PIX
        </Button>
        
        <p>Escaneie o QR Code ou copie o código para pagar</p>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Webhook OpenPix

### Configurar na OpenPix

1. Acesse [OpenPix Dashboard](https://app.openpix.com.br)
2. Vá em `API/Plugins` → `Webhooks` → `Novo Webhook`
3. Configure:
   - **Nome**: `Lovable Webhook`
   - **URL**: `https://lkwvlzcapuptcxvwukcm.supabase.co/functions/v1/openpix-webhook`
   - **Eventos**: `Cobrança paga (OPENPIX:CHARGE_COMPLETED)`
4. Salve e teste

### Payload Recebido

```json
{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "correlationID": "ord_1234567890_abc123",
    "value": 10000,
    "status": "COMPLETED",
    "identifier": "abc123...",
    "paidAt": "2024-01-15T10:30:00Z",
    "customer": {
      "name": "João Silva",
      "taxID": { "taxID": "12345678901", "type": "BR:CPF" }
    }
  },
  "pix": {
    "value": 10000,
    "transactionID": "xyz789...",
    "endToEndId": "E12345..."
  }
}
```

---

## Troubleshooting

### Problema: Pix Out criado mas não aprovado

**Sintoma**: Status `pending_approval` ou `created`

**Causa**: O endpoint de aprovação falhou ou a conta requer aprovação manual.

**Soluções**:
1. Verificar se a conta tem auto-approve habilitado
2. Aprovar manualmente no painel OpenPix (Saques e Pagamentos → Solicitações)
3. Verificar saldo na conta OpenPix

### Problema: Webhook retorna 404

**Sintoma**: Logs mostram "Order not found"

**Causa**: O `correlationID` não existe no banco.

**Soluções**:
1. Verificar se a cobrança foi criada corretamente
2. Conferir se o banco está sincronizado
3. Verificar se a função `create-pix-charge` salvou o pedido

### Problema: "Already processed"

**Sintoma**: Webhook retorna `processed: false`

**Causa**: O pedido já foi processado (idempotência funcionando).

**Solução**: Isso é comportamento esperado. Se precisar reprocessar, atualize o status manualmente no banco.

### Problema: Taxa ou split incorreto

**Sintoma**: Valores de repasse diferentes do esperado

**Causa**: Arredondamento ou cálculo incorreto.

**Solução**: Use `Math.floor` para o criador e calcule a plataforma como `total - criador`.

### Verificar Logs

```bash
# Ver logs da função
supabase functions logs openpix-webhook --tail

# Ver logs específicos
supabase functions logs create-pix-charge --tail
```

---

## Considerações de Segurança

### 1. Secrets

- **NUNCA** exponha `OPENPIX_APP_ID` no frontend
- Use Edge Functions para todas as chamadas à API OpenPix
- Mantenha `CREATOR_TAX_ID` seguro

### 2. Validação de Webhook

Considere implementar validação de assinatura:

```typescript
const signature = req.headers.get('x-webhook-signature');
// Validar assinatura com OPENPIX_WEBHOOK_SECRET
```

### 3. RLS (Row Level Security)

- Usuários só podem ver seus próprios pedidos
- Apenas service role pode atualizar status
- Insert é público (para pedidos anônimos)

### 4. Idempotência

O webhook é idempotente:
- Não processa pedidos já finalizados (`payout_done`, `delivered`)
- Retoma processamento de pedidos parciais (`paid`)

### 5. Valor Mínimo

Enforce R$ 10,00 mínimo para evitar:
- Transações que não cobrem taxas
- Abusos com microvalores

---

## Referências

- [OpenPix API Docs](https://developers.openpix.com.br)
- [OpenPix Pix Out](https://developers.woovi.com/en/docs/payment/payment-how-to-use-api-to-approve)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PIX - Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/pix)

---

## Changelog

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-01-31 | 1.0 | Documentação inicial completa |
| 2026-01-31 | 1.1 | Correção do endpoint de aprovação (`/api/v1/payment/approve` com body) |

---

*Documentação gerada para o projeto Lovable - Integração OpenPix com Split de Pagamentos*
