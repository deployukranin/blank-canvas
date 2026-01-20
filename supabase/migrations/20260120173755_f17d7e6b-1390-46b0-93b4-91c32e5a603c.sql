-- Criar tabela de influencers com dados de split PIX
CREATE TABLE public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL, -- CPF ou CNPJ
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key TEXT NOT NULL,
  split_percentage INTEGER NOT NULL DEFAULT 80 CHECK (split_percentage >= 0 AND split_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna influencer_id na tabela pix_payments
ALTER TABLE public.pix_payments 
ADD COLUMN influencer_id UUID REFERENCES public.influencers(id),
ADD COLUMN split_platform_value INTEGER,
ADD COLUMN split_influencer_value INTEGER,
ADD COLUMN openpix_split_id TEXT;

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para influencers (somente leitura pública, escrita via service role)
CREATE POLICY "Influencers are viewable by everyone" 
ON public.influencers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage influencers" 
ON public.influencers 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_influencers_updated_at
BEFORE UPDATE ON public.influencers
FOR EACH ROW
EXECUTE FUNCTION public.update_pix_payments_updated_at();

-- Índices
CREATE INDEX idx_influencers_active ON public.influencers(is_active);
CREATE INDEX idx_pix_payments_influencer ON public.pix_payments(influencer_id);