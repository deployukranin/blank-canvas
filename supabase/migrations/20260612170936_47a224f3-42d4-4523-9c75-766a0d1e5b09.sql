-- Trackers can only READ their own links; management is CEO/super_admin only.
DROP POLICY IF EXISTS "Trackers manage own links" ON public.tracker_links;

CREATE POLICY "Trackers read own links"
  ON public.tracker_links
  FOR SELECT
  TO authenticated
  USING (public.owns_tracker(tracker_id));