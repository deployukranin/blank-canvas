ALTER TABLE public.vip_subscriptions
  DROP CONSTRAINT IF EXISTS vip_subscriptions_plan_type_check;

ALTER TABLE public.vip_subscriptions
  ADD CONSTRAINT vip_subscriptions_plan_type_check
  CHECK (plan_type IN ('monthly', 'quarterly', 'yearly'));