

## Landing Page + Cadastro com Código de Convite

### Visão geral

Criar uma landing page pública atrativa para visitantes não logados e adicionar validação de código de convite no cadastro. A tabela `invite_codes` no banco armazenará os códigos válidos.

### Mudanças

#### 1. Migração de banco — tabela `invite_codes`
```sql
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode verificar se código existe (necessário no signup)
CREATE POLICY "Anyone can check invite codes" ON public.invite_codes
  FOR SELECT TO public USING (true);

-- Admins/CEOs gerenciam códigos
CREATE POLICY "Admins manage invite codes" ON public.invite_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));
```

Função para validar e consumir código:
```sql
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite RECORD;
BEGIN
  SELECT * INTO v_invite FROM invite_codes
  WHERE code = upper(trim(p_code)) AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND used_count < max_uses;
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Código inválido ou expirado');
  END IF;
  UPDATE invite_codes SET used_count = used_count + 1 WHERE id = v_invite.id;
  RETURN json_build_object('valid', true);
END; $$;
```

#### 2. Nova página — `src/pages/LandingPage.tsx`
- Hero section com imagem de fundo, título, subtítulo e CTA "Criar Conta"
- Seções: recursos/features do app, depoimentos, FAQ
- Botões "Entrar" e "Criar Conta" no header
- Visível apenas para usuários **não logados** (rota `/`)
- Usuários logados veem a `Index` atual

#### 3. Atualizar `src/pages/Auth.tsx`
- Adicionar campo "Código de Convite" na aba de cadastro (obrigatório)
- Antes de chamar `signUp`, chamar `supabase.rpc('use_invite_code', { p_code })` para validar
- Se inválido, mostrar erro e não prosseguir
- Campo com ícone de ticket/key e placeholder "Digite seu código de convite"

#### 4. Atualizar `src/App.tsx`
- Rota `/` renderiza `LandingPage` quando não logado, `Index` quando logado (ou usar lógica dentro do componente)

#### 5. Admin — gerenciar códigos (futuro, opcional)
- Pode ser adicionado depois em `/admin/convites`

### Fluxo do usuário
1. Visitante acessa `/` → vê landing page
2. Clica "Criar Conta" → vai para `/auth` aba signup
3. Preenche email, senha e **código de convite**
4. Código validado no banco → conta criada
5. Código inválido → erro exibido, signup bloqueado

