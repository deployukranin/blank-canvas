DROP POLICY IF EXISTS "Anon can read public configurations" ON public.app_configurations;

CREATE POLICY "Anon can read public configurations"
ON public.app_configurations
FOR SELECT
TO anon
USING (
  config_key = ANY (ARRAY[
    'white_label_config'::text,
    'video_config'::text,
    'youtube_channel'::text,
    'social_links'::text,
    'global_default_categories'::text,
    'platform_plans'::text
  ])
);