
-- =====================================================
-- FASE 1: Sistema de Roles de Usuário
-- =====================================================

-- 1.1 Criar enum para roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'ceo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.2 Criar tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 1.3 Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.4 Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
ON public.user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 1.5 Criar função has_role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- FASE 2: Função e Triggers de Updated_at
-- =====================================================

-- 2.1 Criar função genérica update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2.2 Triggers para tabelas (drop if exists para evitar duplicatas)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_influencers_updated_at ON public.influencers;
CREATE TRIGGER update_influencers_updated_at
BEFORE UPDATE ON public.influencers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 3: Indexes para Performance
-- =====================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- Video Chat Messages
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_user_id ON public.video_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_video_id ON public.video_chat_messages(video_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_messages_created_at ON public.video_chat_messages(created_at DESC);

-- PIX Payments
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON public.pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_charge_id ON public.pix_payments(charge_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON public.pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_created_at ON public.pix_payments(created_at DESC);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- FASE 4: Corrigir Políticas RLS Permissivas
-- =====================================================

-- 4.1 Influencers - remover política muito permissiva e criar nova
DROP POLICY IF EXISTS "Influencers are viewable by everyone" ON public.influencers;
DROP POLICY IF EXISTS "Service role can manage influencers" ON public.influencers;

CREATE POLICY "Active influencers are viewable by everyone"
ON public.influencers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all influencers"
ON public.influencers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins can manage influencers"
ON public.influencers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- 4.2 PIX Payments - garantir que apenas service_role pode inserir
DROP POLICY IF EXISTS "Service role can insert payments" ON public.pix_payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.pix_payments;

CREATE POLICY "Service role manages payments"
ON public.pix_payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
