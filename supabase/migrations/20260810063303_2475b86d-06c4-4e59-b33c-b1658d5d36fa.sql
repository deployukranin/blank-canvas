-- Personal data filter
CREATE OR REPLACE FUNCTION public.text_has_personal_data(p_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE t text;
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN RETURN false; END IF;
  t := lower(p_text);
  -- emails
  IF t ~ '[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}' THEN RETURN true; END IF;
  -- urls / domains
  IF t ~ '(https?://|www\.)' THEN RETURN true; END IF;
  IF t ~ '[a-z0-9-]+\.(com|net|org|br|io|co|me|app|xyz|link|gg|tv|shop|store|info|biz|ru|es|us)(/|\s|$)' THEN RETURN true; END IF;
  -- social handles
  IF t ~ '(^|\s)@[a-z0-9._]{3,}' THEN RETURN true; END IF;
  -- phone numbers (7+ digits, allowing separators)
  IF regexp_replace(t, '[^0-9]', '', 'g') ~ '[0-9]{8,}' AND t ~ '[0-9][0-9 ().+-]{6,}[0-9]' THEN RETURN true; END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_personal_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE col text; val text;
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    EXECUTE format('SELECT ($1).%I::text', col) INTO val USING NEW;
    IF public.text_has_personal_data(val) THEN
      RAISE EXCEPTION 'personal_data_blocked: contact info or links are not allowed';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Bug reports
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  user_id uuid,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text,
  route text,
  user_agent text,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit bug reports"
  ON public.bug_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view bug reports"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update bug reports"
  ON public.bug_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_bug_reports_updated
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_bug_reports_no_personal_data
  BEFORE INSERT OR UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.block_personal_data('description');

CREATE INDEX idx_bug_reports_status ON public.bug_reports(status, created_at DESC);

-- Content reports
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  reporter_id uuid,
  target_type text NOT NULL,
  target_id text NOT NULL,
  target_title text,
  target_author text,
  reason_code text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit content reports"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Store managers and super admins can view content reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (public.is_store_manager(store_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Store managers and super admins can update content reports"
  ON public.content_reports FOR UPDATE TO authenticated
  USING (public.is_store_manager(store_id) OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.is_store_manager(store_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE UNIQUE INDEX idx_content_reports_unique_reporter
  ON public.content_reports(target_type, target_id, reporter_id);
CREATE INDEX idx_content_reports_store_status ON public.content_reports(store_id, status, created_at DESC);

CREATE TRIGGER trg_content_reports_updated
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_content_reports_no_personal_data
  BEFORE INSERT OR UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.block_personal_data('detail');

-- Block personal data on user-generated content
CREATE TRIGGER trg_video_ideas_no_personal_data
  BEFORE INSERT OR UPDATE ON public.video_ideas
  FOR EACH ROW EXECUTE FUNCTION public.block_personal_data('title', 'description');

CREATE TRIGGER trg_video_chat_no_personal_data
  BEFORE INSERT OR UPDATE ON public.video_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.block_personal_data('message');
