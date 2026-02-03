-- Create table to cache YouTube videos
CREATE TABLE public.youtube_videos_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  video_title TEXT NOT NULL,
  video_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, video_id)
);

-- Create table to track cache metadata per channel
CREATE TABLE public.youtube_cache_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  last_fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  video_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_videos_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Public read access (videos are public content)
CREATE POLICY "Anyone can view cached videos"
ON public.youtube_videos_cache
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view cache metadata"
ON public.youtube_cache_metadata
FOR SELECT
USING (true);

-- Service role only for writes (edge function uses service role)
CREATE POLICY "Service role can manage cached videos"
ON public.youtube_videos_cache
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role can manage cache metadata"
ON public.youtube_cache_metadata
FOR ALL
USING (false)
WITH CHECK (false);

-- Create indexes for performance
CREATE INDEX idx_youtube_videos_cache_channel ON public.youtube_videos_cache(channel_id);
CREATE INDEX idx_youtube_videos_cache_published ON public.youtube_videos_cache(published_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_youtube_videos_cache_updated_at
BEFORE UPDATE ON public.youtube_videos_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_youtube_cache_metadata_updated_at
BEFORE UPDATE ON public.youtube_cache_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();