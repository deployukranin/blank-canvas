
CREATE TABLE public.youtube_metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  channel_id text NOT NULL,
  subscriber_count integer NOT NULL DEFAULT 0,
  total_view_count bigint NOT NULL DEFAULT 0,
  total_video_count integer NOT NULL DEFAULT 0,
  views_last_30d bigint NOT NULL DEFAULT 0,
  videos_last_30d integer NOT NULL DEFAULT 0,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, channel_id, recorded_at)
);

ALTER TABLE public.youtube_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own store metrics history"
  ON public.youtube_metrics_history FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM store_admins sa WHERE sa.store_id = youtube_metrics_history.store_id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM stores s WHERE s.id = youtube_metrics_history.store_id AND s.created_by = auth.uid())
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Service role manages metrics history"
  ON public.youtube_metrics_history FOR ALL TO public
  USING (false) WITH CHECK (false);
