UPDATE app_configurations 
SET store_id = '73f3a7a1-2b9f-4bf0-87d4-3e5854306d16',
    config_value = jsonb_set(config_value, '{activeGateway}', '"pix_manual"')
WHERE config_key = 'payment_config' 
  AND store_id IS NULL;