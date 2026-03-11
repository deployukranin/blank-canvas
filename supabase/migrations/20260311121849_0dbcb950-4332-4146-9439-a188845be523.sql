
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

CREATE POLICY "Anyone can check invite codes" ON public.invite_codes
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage invite codes" ON public.invite_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE OR REPLACE FUNCTION public.use_invite_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'pg_catalog', 'public' AS $$
DECLARE v_invite RECORD;
BEGIN
  SELECT * INTO v_invite FROM public.invite_codes
  WHERE code = upper(trim(p_code)) AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND used_count < max_uses;
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Código inválido ou expirado');
  END IF;
  UPDATE public.invite_codes SET used_count = used_count + 1 WHERE id = v_invite.id;
  RETURN json_build_object('valid', true);
END; $$;

REVOKE EXECUTE ON FUNCTION public.use_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_invite_code(text) TO anon, authenticated;
