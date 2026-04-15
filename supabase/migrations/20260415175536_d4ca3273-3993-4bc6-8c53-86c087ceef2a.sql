
CREATE OR REPLACE FUNCTION public.cancel_vip_subscription(p_subscription_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_sub RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  SELECT * INTO v_sub FROM public.vip_subscriptions
  WHERE id = p_subscription_id AND user_id = v_user_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Subscription not found or not active');
  END IF;
  
  UPDATE public.vip_subscriptions
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = p_subscription_id AND user_id = v_user_id;
  
  RETURN json_build_object('success', true);
END;
$$;
