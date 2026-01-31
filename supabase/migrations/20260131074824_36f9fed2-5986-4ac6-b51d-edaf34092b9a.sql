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
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,
  platform_cents INTEGER NOT NULL,
  
  -- Quem paga a taxa
  who_pays_fee TEXT NOT NULL CHECK (who_pays_fee IN ('influencer', 'platform')),
  
  -- Pix Out tracking
  payment_correlation_id TEXT UNIQUE,
  openpix_payment_id TEXT,
  
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

-- RLS para orders
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