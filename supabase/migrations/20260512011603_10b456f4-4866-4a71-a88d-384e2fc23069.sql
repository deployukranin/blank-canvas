ALTER TABLE public.vip_subscriptions
  DROP CONSTRAINT IF EXISTS vip_subscriptions_user_id_status_key;

DROP INDEX IF EXISTS public.idx_vip_subscriptions_one_active_per_store;
CREATE UNIQUE INDEX idx_vip_subscriptions_one_active_per_store
  ON public.vip_subscriptions (user_id, store_id)
  WHERE status = 'active' AND store_id IS NOT NULL;

DROP INDEX IF EXISTS public.idx_vip_subscriptions_one_active_global;
CREATE UNIQUE INDEX idx_vip_subscriptions_one_active_global
  ON public.vip_subscriptions (user_id)
  WHERE status = 'active' AND store_id IS NULL;