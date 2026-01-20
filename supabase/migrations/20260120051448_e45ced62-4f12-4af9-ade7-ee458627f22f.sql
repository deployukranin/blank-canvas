-- Tables for video analytics + resume

CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own video views"
ON public.video_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read aggregated stats via security definer function
CREATE POLICY "Video views are not directly readable"
ON public.video_views
FOR SELECT
USING (false);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id_created_at
ON public.video_views (video_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_views_user_id_created_at
ON public.video_views (user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video progress"
ON public.video_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video progress"
ON public.video_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress"
ON public.video_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_video_progress_user_last_watched
ON public.video_progress (user_id, last_watched_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_video_progress_updated_at ON public.video_progress;
CREATE TRIGGER update_video_progress_updated_at
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Trending videos helper (views over last N days)
CREATE OR REPLACE FUNCTION public.get_trending_videos(p_limit INT DEFAULT 8, p_days INT DEFAULT 7)
RETURNS TABLE(video_id TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      LEAST(GREATEST(p_limit, 1), 50) AS lim,
      LEAST(GREATEST(p_days, 1), 365) AS days
  )
  SELECT v.video_id, COUNT(*)::bigint AS views
  FROM public.video_views v
  CROSS JOIN params p
  WHERE v.created_at >= now() - make_interval(days => p.days)
  GROUP BY v.video_id
  ORDER BY views DESC
  LIMIT (SELECT lim FROM params);
$$;
