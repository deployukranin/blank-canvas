-- Drop the incorrect unique constraint on config_key alone
ALTER TABLE public.app_configurations DROP CONSTRAINT IF EXISTS app_configurations_config_key_key;

-- Drop the partial unique index (only for non-null store_id)
DROP INDEX IF EXISTS idx_app_configurations_store_key;

-- Create a proper unique constraint that handles both null and non-null store_id
CREATE UNIQUE INDEX idx_app_configurations_store_key ON public.app_configurations (config_key, store_id) WHERE store_id IS NOT NULL;
CREATE UNIQUE INDEX idx_app_configurations_global_key ON public.app_configurations (config_key) WHERE store_id IS NULL;