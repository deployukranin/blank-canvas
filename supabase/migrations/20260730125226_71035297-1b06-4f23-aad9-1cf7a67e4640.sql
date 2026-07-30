CREATE OR REPLACE FUNCTION public.enforce_store_plan_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_expires timestamptz;
BEGIN
  IF NEW.store_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan_type, plan_expires_at INTO v_plan, v_expires
  FROM public.stores WHERE id = NEW.store_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF COALESCE(v_plan, 'trial') = 'trial' AND v_expires IS NOT NULL AND v_expires < now() THEN
    RAISE EXCEPTION 'trial_expired: store trial period has ended';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_active_custom_orders ON public.custom_orders;
CREATE TRIGGER enforce_plan_active_custom_orders
BEFORE INSERT ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_store_plan_active();

DROP TRIGGER IF EXISTS enforce_plan_active_vip_subscriptions ON public.vip_subscriptions;
CREATE TRIGGER enforce_plan_active_vip_subscriptions
BEFORE INSERT ON public.vip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.enforce_store_plan_active();