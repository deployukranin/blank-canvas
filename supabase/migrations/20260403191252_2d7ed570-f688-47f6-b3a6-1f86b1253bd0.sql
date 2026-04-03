
-- Drop the unprotected admin_credentials_safe view
-- The get_admin_credentials_safe() function already handles this securely
DROP VIEW IF EXISTS public.admin_credentials_safe;

-- Restrict app_configurations: replace public SELECT with authenticated-only
DROP POLICY IF EXISTS "Anyone can read configurations" ON public.app_configurations;

CREATE POLICY "Authenticated users can read configurations"
ON public.app_configurations
FOR SELECT
TO authenticated
USING (true);

-- Also allow anon to read non-sensitive configs (needed for public store pages)
CREATE POLICY "Anon can read public configurations"
ON public.app_configurations
FOR SELECT
TO anon
USING (config_key IN ('white_label_config', 'video_config', 'youtube_channel', 'social_links', 'global_default_categories'));
