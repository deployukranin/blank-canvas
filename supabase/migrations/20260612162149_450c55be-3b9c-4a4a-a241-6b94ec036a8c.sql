-- Tracking system: isolated traffic admins ("trackers")

-- 1. trackers
CREATE TABLE public.trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dashboard_token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trackers TO authenticated;
GRANT ALL ON public.trackers TO service_role;
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage trackers" ON public.trackers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 2. tracker_links
CREATE TABLE public.tracker_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL REFERENCES public.trackers(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  channel text NOT NULL DEFAULT 'other',
  destination text NOT NULL DEFAULT '/',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracker_links TO authenticated;
GRANT ALL ON public.tracker_links TO service_role;
ALTER TABLE public.tracker_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage tracker links" ON public.tracker_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_tracker_links_tracker ON public.tracker_links(tracker_id);

-- 3. tracker_clicks
CREATE TABLE public.tracker_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.tracker_links(id) ON DELETE CASCADE,
  tracker_id uuid NOT NULL REFERENCES public.trackers(id) ON DELETE CASCADE,
  visitor_id text,
  referrer text,
  user_agent text,
  ip_hash text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tracker_clicks TO service_role;
ALTER TABLE public.tracker_clicks ENABLE ROW LEVEL SECURITY;
-- no anon/authenticated policies: only service_role (edge functions) access
CREATE INDEX idx_tracker_clicks_tracker ON public.tracker_clicks(tracker_id);
CREATE INDEX idx_tracker_clicks_link ON public.tracker_clicks(link_id);
CREATE INDEX idx_tracker_clicks_time ON public.tracker_clicks(occurred_at);

-- 4. tracker_conversions
CREATE TABLE public.tracker_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.tracker_links(id) ON DELETE CASCADE,
  tracker_id uuid NOT NULL REFERENCES public.trackers(id) ON DELETE CASCADE,
  type text NOT NULL,
  subject_id uuid,
  store_id uuid,
  email text,
  name text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tracker_conversions TO service_role;
ALTER TABLE public.tracker_conversions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tracker_conversions_tracker ON public.tracker_conversions(tracker_id);
CREATE INDEX idx_tracker_conversions_link ON public.tracker_conversions(link_id);

-- updated_at triggers
CREATE TRIGGER update_trackers_updated_at BEFORE UPDATE ON public.trackers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tracker_links_updated_at BEFORE UPDATE ON public.tracker_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();