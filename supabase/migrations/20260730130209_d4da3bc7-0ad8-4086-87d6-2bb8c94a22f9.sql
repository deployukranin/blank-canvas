CREATE OR REPLACE FUNCTION public.get_store_trial_status(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_store RECORD;
  v_seconds bigint;
BEGIN
  IF p_store_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'store_id required');
  END IF;

  SELECT id, plan_type, plan_expires_at, status
    INTO v_store
  FROM public.stores
  WHERE id = p_store_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Store not found');
  END IF;

  v_seconds := CASE
    WHEN v_store.plan_expires_at IS NULL THEN NULL
    ELSE GREATEST(0, EXTRACT(EPOCH FROM (v_store.plan_expires_at - now()))::bigint)
  END;

  RETURN json_build_object(
    'success', true,
    'store_id', v_store.id,
    'plan_type', v_store.plan_type,
    'status', v_store.status,
    'plan_expires_at', to_char(v_store.plan_expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'server_now', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'seconds_remaining', v_seconds,
    'expired', (COALESCE(v_store.plan_type, 'trial') = 'trial'
                AND v_store.plan_expires_at IS NOT NULL
                AND v_store.plan_expires_at < now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_trial_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_trial_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_trial_status(uuid) TO service_role;