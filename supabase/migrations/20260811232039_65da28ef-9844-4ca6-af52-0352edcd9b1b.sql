CREATE POLICY "Authenticated can read public configurations"
ON public.app_configurations
FOR SELECT
TO authenticated
USING (config_key = ANY (ARRAY['white_label_config','video_config','youtube_channel','social_links','global_default_categories','platform_plans','content_settings','vip_config','vip_adult_content']));