
CREATE TABLE public.youtube_channel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  subscriber_count integer NOT NULL DEFAULT 0,
  total_view_count bigint NOT NULL DEFAULT 0,
  total_video_count integer NOT NULL DEFAULT 0,
  views_last_30d bigint NOT NULL DEFAULT 0,
  videos_last_30d integer NOT NULL DEFAULT 0,
  top_videos jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, channel_id)
);

ALTER TABLE public.youtube_channel_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own store metrics"
  ON public.youtube_channel_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_admins sa
      WHERE sa.store_id = youtube_channel_metrics.store_id
        AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = youtube_channel_metrics.store_id
        AND s.created_by = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Service role manages metrics"
  ON public.youtube_channel_metrics FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);
