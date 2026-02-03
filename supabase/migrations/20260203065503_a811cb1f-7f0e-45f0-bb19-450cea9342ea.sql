-- =====================================================
-- Fix: Replace SECURITY DEFINER view with SECURITY INVOKER + proper function
-- This addresses the security linter warning about SECURITY DEFINER views
-- =====================================================

-- Drop the SECURITY DEFINER view
DROP VIEW IF EXISTS public.admin_credentials_safe;

-- Recreate as SECURITY INVOKER view (default, safer)
CREATE VIEW public.admin_credentials_safe AS
SELECT id, role, email, created_at, updated_at
FROM public.admin_credentials;

-- Since the base table blocks all client access, the view won't work for clients
-- This is intentional - all credential access MUST go through edge functions
-- The view exists only for service_role access in edge functions

-- Grant to service role only (not to authenticated/anon)
REVOKE ALL ON public.admin_credentials_safe FROM anon, authenticated;

-- Create a secure RPC function that CEOs can call to list admin emails (no passwords)
-- This function uses SECURITY DEFINER but with strict checks
CREATE OR REPLACE FUNCTION public.get_admin_credentials_safe()
RETURNS TABLE (
  id uuid,
  role text,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has CEO role
  IF NOT has_role(auth.uid(), 'ceo') THEN
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

-- Grant execute to authenticated users (function checks CEO role internally)
GRANT EXECUTE ON FUNCTION public.get_admin_credentials_safe() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_admin_credentials_safe() IS 'Returns admin credentials without password_hash. CEO role required.';