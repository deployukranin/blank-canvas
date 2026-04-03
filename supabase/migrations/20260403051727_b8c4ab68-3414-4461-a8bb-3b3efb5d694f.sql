UPDATE app_configurations 
SET store_id = '73f3a7a1-2b9f-4bf0-87d4-3e5854306d16'
WHERE store_id IS NULL 
  AND config_key IN ('video_config', 'vip_config');