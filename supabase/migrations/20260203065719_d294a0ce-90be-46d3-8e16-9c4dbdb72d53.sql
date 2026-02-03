-- =====================================================
-- SECURITY HARDENING: Authorization Functions
-- =====================================================

-- 1) TRIGGER FUNCTIONS → SECURITY INVOKER (don't need DEFINER)
-- These run in the context of the triggering operation

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_pix_payments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2) ROLE-CHECK FUNCTION: has_role
-- Keep SECURITY DEFINER (needed to bypass RLS on user_roles)
-- Harden with safe search_path and strict NULL handling

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

-- 3) VIP CHECK FUNCTION: is_vip
-- Keep SECURITY DEFINER (needed to bypass RLS on vip_subscriptions)
-- Harden with safe search_path and strict NULL handling

CREATE OR REPLACE FUNCTION public.is_vip(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN check_user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.vip_subscriptions
      WHERE user_id = check_user_id
        AND status = 'active'
        AND expires_at > now()
    )
  END
$$;

-- 4) RATE LIMITING FUNCTION: check_rate_limit
-- Keep SECURITY DEFINER (needs to write to rate_limits table)
-- Harden with safe search_path and input validation

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_result JSON;
BEGIN
  -- Input validation
  IF p_identifier IS NULL OR p_identifier = '' THEN
    RETURN json_build_object('allowed', false, 'error', 'Invalid identifier');
  END IF;
  
  IF p_endpoint IS NULL OR p_endpoint = '' THEN
    RETURN json_build_object('allowed', false, 'error', 'Invalid endpoint');
  END IF;
  
  IF p_max_requests < 1 OR p_max_requests > 10000 THEN
    p_max_requests := 10;
  END IF;
  
  IF p_window_minutes < 1 OR p_window_minutes > 1440 THEN
    p_window_minutes := 60;
  END IF;

  -- Calculate window start (rounded to minute)
  v_window_start := date_trunc('minute', now()) - (EXTRACT(minute FROM now())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  -- Try to get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    request_count = public.rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;
  
  -- Check if over limit
  IF v_current_count > p_max_requests THEN
    RETURN json_build_object(
      'allowed', false,
      'current_count', v_current_count,
      'max_requests', p_max_requests,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_window_start + (p_window_minutes || ' minutes')::INTERVAL - now()))::INTEGER
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true,
    'current_count', v_current_count,
    'max_requests', p_max_requests,
    'remaining', p_max_requests - v_current_count
  );
END;
$$;

-- 5) CLEANUP FUNCTION: cleanup_old_rate_limits
-- Keep SECURITY DEFINER but restrict to service role only
-- Should only be called by system/cron jobs

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - INTERVAL '2 hours';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- 6) ADMIN CREDENTIALS SAFE FUNCTION
-- Keep SECURITY DEFINER (needs to read admin_credentials)
-- Already has CEO check, add search_path hardening

CREATE OR REPLACE FUNCTION public.get_admin_credentials_safe()
RETURNS TABLE(
  id uuid,
  role text,
  email text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Strict auth check - fail if not authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  -- Verify caller has CEO role
  IF NOT public.has_role(auth.uid(), 'ceo') THEN
    RAISE EXCEPTION 'Access denied: CEO role required';
  END IF;
  
  -- Return only safe fields (no password_hash)
  RETURN QUERY
  SELECT 
    ac.id,
    ac.role,
    ac.email,
    ac.created_at,
    ac.updated_at
  FROM public.admin_credentials ac
  ORDER BY ac.role;
END;
$$;

-- 7) SET USER HANDLE FUNCTION
-- Keep SECURITY DEFINER (needs to write to profiles)
-- Already uses auth.uid(), add search_path hardening

CREATE OR REPLACE FUNCTION public.set_user_handle(new_handle text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_user_id UUID;
  existing_profile RECORD;
BEGIN
  current_user_id := auth.uid();
  
  -- Strict auth check
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;
  
  -- Input validation
  IF new_handle IS NULL OR length(trim(new_handle)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve ter pelo menos 3 caracteres');
  END IF;
  
  IF length(new_handle) > 30 THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve ter no máximo 30 caracteres');
  END IF;
  
  -- Only allow alphanumeric and underscores
  IF new_handle !~ '^[a-zA-Z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve conter apenas letras, números e underscore');
  END IF;
  
  -- Check if handle already exists for another user
  SELECT * INTO existing_profile 
  FROM public.profiles 
  WHERE handle = new_handle AND user_id != current_user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Handle já está em uso');
  END IF;
  
  -- Insert or update profile
  INSERT INTO public.profiles (user_id, handle, handle_set_at)
  VALUES (current_user_id, new_handle, now())
  ON CONFLICT (user_id)
  DO UPDATE SET handle = new_handle, handle_set_at = now(), updated_at = now();
  
  RETURN json_build_object('success', true);
END;
$$;

-- =====================================================
-- PERMISSION RESTRICTIONS
-- =====================================================

-- Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_vip(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_credentials_safe() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_user_handle(text) FROM PUBLIC;

-- Grant EXECUTE only to authenticated users (minimal required role)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_credentials_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_handle(text) TO authenticated;

-- cleanup_old_rate_limits should only be called by service_role (cron/system)
-- Do NOT grant to authenticated - only service_role can call it
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- Trigger functions don't need explicit grants (called by trigger system)
-- But ensure they're not directly callable
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_pix_payments_updated_at() FROM PUBLIC;