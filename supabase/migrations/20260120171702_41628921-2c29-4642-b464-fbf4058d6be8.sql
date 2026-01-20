-- Tabela para armazenar pagamentos Pix
CREATE TABLE public.pix_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  correlation_id TEXT NOT NULL UNIQUE,
  charge_id TEXT,
  value INTEGER NOT NULL, -- valor em centavos
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, EXPIRED, REFUNDED
  product_type TEXT NOT NULL, -- VIP, SUBSCRIPTION, CUSTOM_VIDEO, etc
  product_id TEXT, -- ID opcional do produto relacionado
  customer_name TEXT,
  customer_email TEXT,
  customer_taxid TEXT,
  pix_qrcode TEXT,
  pix_qrcode_image TEXT,
  pix_brcode TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view their own payments"
ON public.pix_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: inserção via edge function (service role)
CREATE POLICY "Service role can insert payments"
ON public.pix_payments
FOR INSERT
WITH CHECK (true);

-- Policy: update via edge function (service role)
CREATE POLICY "Service role can update payments"
ON public.pix_payments
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_pix_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pix_payments_updated_at
BEFORE UPDATE ON public.pix_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_pix_payments_updated_at();

-- Index para busca por correlation_id (usado pelo webhook)
CREATE INDEX idx_pix_payments_correlation_id ON public.pix_payments(correlation_id);

-- Index para busca por status
CREATE INDEX idx_pix_payments_status ON public.pix_payments(status);