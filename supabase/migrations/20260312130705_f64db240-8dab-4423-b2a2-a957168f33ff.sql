
-- Tabela para vincular admins a lojas específicas
CREATE TABLE public.store_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

-- Enable RLS
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;

-- CEOs podem gerenciar tudo
CREATE POLICY "CEOs can manage store_admins"
  ON public.store_admins
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

-- Admins podem ver seus próprios vínculos
CREATE POLICY "Admins can view own store assignments"
  ON public.store_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Negar acesso anon
CREATE POLICY "Deny anon access store_admins"
  ON public.store_admins
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
