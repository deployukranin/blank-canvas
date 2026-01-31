-- Tabela para pedidos personalizados com pagamento PIX
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
  
  -- Status: pending, paid, payout_done, payout_failed, delivered
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Pix Out tracking
  payout_correlation_id TEXT,
  payout_amount_cents INTEGER,
  payout_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indices para performance
CREATE INDEX idx_custom_orders_correlation ON public.custom_orders(correlation_id);
CREATE INDEX idx_custom_orders_user ON public.custom_orders(user_id);
CREATE INDEX idx_custom_orders_status ON public.custom_orders(status);

-- Enable RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver seus proprios pedidos (ou pedidos anonimos)
CREATE POLICY "Users view own orders"
  ON public.custom_orders FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Qualquer um pode criar pedidos (via edge function)
CREATE POLICY "Anyone can insert orders"
  ON public.custom_orders FOR INSERT
  WITH CHECK (true);

-- Service role pode atualizar (via webhook)
CREATE POLICY "Service role can update orders"
  ON public.custom_orders FOR UPDATE
  USING (true);