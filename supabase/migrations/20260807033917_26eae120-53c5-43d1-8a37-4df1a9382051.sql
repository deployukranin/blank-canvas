CREATE OR REPLACE FUNCTION public.get_store_storage_quota(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_expires timestamptz;
  v_drive bigint := 0;
  v_banners bigint := 0;
  v_limit bigint;
  v_trial boolean;
BEGIN
  IF NOT public.is_store_manager(p_store_id) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT plan_type, plan_expires_at INTO v_plan, v_expires FROM public.stores WHERE id = p_store_id;
  IF v_plan IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  v_trial := (v_plan IS NULL OR v_plan IN ('trial', 'free', 'none'));

  SELECT COALESCE(SUM(size_bytes), 0) INTO v_drive FROM public.drive_files WHERE store_id = p_store_id;

  BEGIN
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO v_banners
    FROM storage.objects
    WHERE bucket_id = 'banners' AND name LIKE p_store_id::text || '/%';
  EXCEPTION WHEN OTHERS THEN
    v_banners := 0;
  END;

  v_limit := CASE
    WHEN v_trial THEN 100 * 1024 * 1024
    WHEN v_plan IN ('basic', 'basico', 'básico') THEN 15::bigint * 1024 * 1024 * 1024
    WHEN v_plan IN ('pro', 'profissional') THEN 50::bigint * 1024 * 1024 * 1024
    WHEN v_plan IN ('premium') THEN 0
    ELSE 100 * 1024 * 1024
  END;

  RETURN json_build_object(
    'plan_type', v_plan,
    'is_trial', v_trial,
    'used_bytes', v_drive + v_banners,
    'limit_bytes', v_limit,
    'unlimited', v_limit = 0,
    'expires_at', v_expires
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_storage_quota(uuid) TO authenticated, service_role;