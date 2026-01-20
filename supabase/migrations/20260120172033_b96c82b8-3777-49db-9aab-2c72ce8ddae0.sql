-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  handle TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  handle_set_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: todos podem ver perfis
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Policy: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_pix_payments_updated_at();

-- Tabela de mensagens de chat de vídeo
CREATE TABLE IF NOT EXISTS public.video_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: todos podem ver mensagens
CREATE POLICY "Anyone can view video chat messages"
ON public.video_chat_messages
FOR SELECT
USING (true);

-- Policy: usuários autenticados podem inserir mensagens
CREATE POLICY "Authenticated users can insert messages"
ON public.video_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index para busca por video_id
CREATE INDEX idx_video_chat_messages_video_id ON public.video_chat_messages(video_id);

-- Função para definir handle do usuário
CREATE OR REPLACE FUNCTION public.set_user_handle(new_handle TEXT)
RETURNS JSON
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