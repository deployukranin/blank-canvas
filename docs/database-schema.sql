-- =====================================================
-- DATABASE SCHEMA - Projeto White Label Influencer
-- =====================================================
-- Este script cria todas as tabelas, políticas RLS e 
-- funções necessárias para o funcionamento do projeto.
-- Execute este script em um novo projeto Supabase.
-- =====================================================

-- =====================================================
-- 1. TIPOS E ENUMS
-- =====================================================

-- Tipo para status de pagamento PIX
CREATE TYPE public.payment_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'EXPIRED',
  'REFUNDED',
  'CANCELLED'
);

-- Tipo para tipo de produto
CREATE TYPE public.product_type AS ENUM (
  'VIP',
  'SUBSCRIPTION',
  'CUSTOM_VIDEO',
  'CONTENT',
  'STORE_ITEM'
);

-- =====================================================
-- 2. TABELA: profiles
-- =====================================================
-- Perfis de usuários (extensão do auth.users)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  handle TEXT UNIQUE,
  handle_set_at TIMESTAMP WITH TIME ZONE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. TABELA: influencers
-- =====================================================
-- Dados do(s) influenciador(es) para split de pagamentos

CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
  openpix_receiver_id TEXT,
  split_percentage INTEGER NOT NULL DEFAULT 80 CHECK (split_percentage >= 0 AND split_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para influencers
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Apenas influenciadores ativos são visíveis publicamente
CREATE POLICY "Influencers are viewable by everyone" 
  ON public.influencers 
  FOR SELECT 
  USING (is_active = true);

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage influencers" 
  ON public.influencers 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. TABELA: pix_payments
-- =====================================================
-- Pagamentos PIX via OpenPix

CREATE TABLE IF NOT EXISTS public.pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  influencer_id UUID REFERENCES public.influencers(id),
  
  -- Identificadores OpenPix
  correlation_id TEXT NOT NULL UNIQUE,
  charge_id TEXT,
  
  -- Valores (em centavos)
  value INTEGER NOT NULL CHECK (value > 0),
  split_platform_value INTEGER,
  split_influencer_value INTEGER,
  openpix_split_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'REFUNDED', 'CANCELLED')),
  
  -- Produto
  product_type TEXT NOT NULL,
  product_id TEXT,
  
  -- Cliente
  customer_name TEXT,
  customer_email TEXT,
  customer_taxid TEXT,
  
  -- Dados do PIX
  pix_qrcode TEXT,
  pix_qrcode_image TEXT,
  pix_brcode TEXT,
  
  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON public.pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_correlation_id ON public.pix_payments(correlation_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_charge_id ON public.pix_payments(charge_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON public.pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_influencer_id ON public.pix_payments(influencer_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON public.pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para pix_payments
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" 
  ON public.pix_payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payments" 
  ON public.pix_payments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can update payments" 
  ON public.pix_payments 
  FOR UPDATE 
  USING (true);

-- =====================================================
-- 5. TABELA: video_chat_messages
-- =====================================================
-- Mensagens de chat nos vídeos

CREATE TABLE IF NOT EXISTS public.video_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_video_id ON public.video_chat_messages(video_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_user_id ON public.video_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_created_at ON public.video_chat_messages(created_at DESC);

-- RLS para video_chat_messages
ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video chat messages" 
  ON public.video_chat_messages 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert messages" 
  ON public.video_chat_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para definir handle do usuário
CREATE OR REPLACE FUNCTION public.set_user_handle(new_handle text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  existing_profile RECORD;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;
  
  -- Verificar se handle já existe
  SELECT * INTO existing_profile FROM profiles WHERE handle = new_handle AND user_id != current_user_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Handle já está em uso');
  END IF;
  
  -- Inserir ou atualizar perfil
  INSERT INTO profiles (user_id, handle, handle_set_at)
  VALUES (current_user_id, new_handle, now())
  ON CONFLICT (user_id)
  DO UPDATE SET handle = new_handle, handle_set_at = now(), updated_at = now();
  
  RETURN json_build_object('success', true);
END;
$$;

-- =====================================================
-- 7. REALTIME (Opcional)
-- =====================================================
-- Descomente se quiser habilitar realtime para chat

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.video_chat_messages;

-- =====================================================
-- 8. DADOS INICIAIS (Opcional)
-- =====================================================
-- Descomente e ajuste para inserir o influenciador principal

-- INSERT INTO public.influencers (name, tax_id, pix_key, pix_key_type, split_percentage)
-- VALUES (
--   'Nome do Influenciador',
--   '12345678901', -- CPF sem pontos
--   'email@exemplo.com', -- Chave PIX
--   'EMAIL',
--   80 -- 80% para influenciador, 20% para plataforma
-- );

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
