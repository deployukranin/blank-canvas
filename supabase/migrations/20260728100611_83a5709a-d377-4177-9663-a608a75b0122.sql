CREATE TABLE public.csp_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violated_directive text,
  effective_directive text,
  blocked_uri text,
  document_uri text,
  source_file text,
  line_number integer,
  column_number integer,
  disposition text,
  script_sample text,
  referrer text,
  user_agent text,
  ip_hash text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.csp_violations TO authenticated;
GRANT ALL ON public.csp_violations TO service_role;

ALTER TABLE public.csp_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csp_violations_select_admins"
  ON public.csp_violations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE INDEX csp_violations_created_at_idx ON public.csp_violations (created_at DESC);
CREATE INDEX csp_violations_violated_directive_idx ON public.csp_violations (violated_directive);
CREATE INDEX csp_violations_document_uri_idx ON public.csp_violations (document_uri);
CREATE INDEX csp_violations_blocked_uri_idx ON public.csp_violations (blocked_uri);