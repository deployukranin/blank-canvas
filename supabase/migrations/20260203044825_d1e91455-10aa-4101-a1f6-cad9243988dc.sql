-- Tabela para credenciais administrativas (admin e CEO)
CREATE TABLE public.admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin', 'ceo')),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role)
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Somente CEOs podem ver e gerenciar credenciais
CREATE POLICY "CEOs can view admin credentials"
ON public.admin_credentials
FOR SELECT
USING (has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can insert admin credentials"
ON public.admin_credentials
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can update admin credentials"
ON public.admin_credentials
FOR UPDATE
USING (has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can delete admin credentials"
ON public.admin_credentials
FOR DELETE
USING (has_role(auth.uid(), 'ceo'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_credentials_updated_at
BEFORE UPDATE ON public.admin_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir credenciais padrão
INSERT INTO public.admin_credentials (role, email, password_hash) VALUES
('admin', 'admin@whisperscape.com', 'admin123'),
('ceo', 'ceo@whisperscape.com', 'ceo123');