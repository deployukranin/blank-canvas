UPDATE public.app_configurations
SET config_value = jsonb_set(config_value, '{activeGateway}', '"pix_manual"'::jsonb, true),
    updated_at = now()
WHERE config_key = 'payment_config'
  AND COALESCE(config_value->>'activeGateway', '') = ''
  AND COALESCE(config_value->'pixManual'->>'key', '') <> ''
  AND COALESCE(config_value->'pixManual'->>'receiverName', '') <> ''
  AND COALESCE(config_value->'pixManual'->>'city', '') <> '';