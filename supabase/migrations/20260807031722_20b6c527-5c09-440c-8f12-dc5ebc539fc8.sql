UPDATE public.app_configurations
SET config_value = (
  SELECT jsonb_agg(
    CASE p->>'id'
      WHEN 'basic' THEN
        jsonb_set(p - 'capabilities', '{limits,storageGB}', '15')
        || jsonb_build_object(
             'capabilities', (p->'capabilities') - 'zeroPlatformFee',
             'features_pt', (p->'features_pt') || '["15 GB de armazenamento"]'::jsonb,
             'features_en', (p->'features_en') || '["15 GB storage"]'::jsonb,
             'features_es', (p->'features_es') || '["15 GB de almacenamiento"]'::jsonb)
      WHEN 'pro' THEN
        jsonb_set(p - 'capabilities', '{limits,storageGB}', '50')
        || jsonb_build_object(
             'capabilities', (p->'capabilities') - 'zeroPlatformFee',
             'features_pt', (p->'features_pt') || '["50 GB de armazenamento"]'::jsonb,
             'features_en', (p->'features_en') || '["50 GB storage"]'::jsonb,
             'features_es', (p->'features_es') || '["50 GB de almacenamiento"]'::jsonb)
      ELSE
        jsonb_set(p - 'capabilities', '{limits,storageGB}', '0')
        || jsonb_build_object(
             'capabilities', (p->'capabilities') - 'zeroPlatformFee',
             'features_pt', (p->'features_pt') || '["Armazenamento ilimitado"]'::jsonb,
             'features_en', (p->'features_en') || '["Unlimited storage"]'::jsonb,
             'features_es', (p->'features_es') || '["Almacenamiento ilimitado"]'::jsonb)
    END
    ORDER BY ord
  )
  FROM jsonb_array_elements(config_value::jsonb) WITH ORDINALITY AS t(p, ord)
)
WHERE config_key = 'platform_plans' AND store_id IS NULL;