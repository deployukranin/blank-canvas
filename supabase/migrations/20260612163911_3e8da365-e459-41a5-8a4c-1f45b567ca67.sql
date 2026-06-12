-- Link each tracker to an owner auth user
ALTER TABLE public.trackers ADD COLUMN IF NOT EXISTS owner_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_trackers_owner ON public.trackers(owner_user_id);

-- Helper: does the current user own the given tracker?
CREATE OR REPLACE FUNCTION public.owns_tracker(_tracker_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trackers
    WHERE id = _tracker_id AND owner_user_id = auth.uid()
  )
$$;

-- trackers: a tracker can see its own row
CREATE POLICY "Trackers see own row" ON public.trackers
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- tracker_links: a tracker manages its own links
CREATE POLICY "Trackers manage own links" ON public.tracker_links
  FOR ALL TO authenticated
  USING (public.owns_tracker(tracker_id))
  WITH CHECK (public.owns_tracker(tracker_id));

-- tracker_clicks: a tracker can read its own clicks
CREATE POLICY "Trackers read own clicks" ON public.tracker_clicks
  FOR SELECT TO authenticated
  USING (public.owns_tracker(tracker_id));

-- tracker_conversions: a tracker can read its own conversions
CREATE POLICY "Trackers read own conversions" ON public.tracker_conversions
  FOR SELECT TO authenticated
  USING (public.owns_tracker(tracker_id));