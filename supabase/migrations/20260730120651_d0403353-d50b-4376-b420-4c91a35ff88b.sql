UPDATE public.app_configurations
SET config_value = jsonb_set(
      jsonb_set(config_value::jsonb, '{colors,primary}', '"263 70% 58%"'),
      '{colors,accent}', '"263 50% 25%"')
WHERE config_key = 'white_label_config' AND store_id IS NULL;