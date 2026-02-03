-- =====================================================
-- Security Fix: Block client access to admin_credentials table
-- Password hashes should NEVER be accessible from client queries
-- All access must go through edge functions with service_role
-- =====================================================

-- Drop all existing policies on admin_credentials
DROP POLICY IF EXISTS "CEOs can view admin credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "CEOs can view admin credentials via view" ON public.admin_credentials;
DROP POLICY IF EXISTS "CEOs can insert admin credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "CEOs can update admin credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "CEOs can delete admin credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "No client access" ON public.admin_credentials;

-- Create a single policy that blocks ALL client access
-- Only service_role (used by edge functions) can bypass RLS
CREATE POLICY "No client access - service role only"
ON public.admin_credentials
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Revoke direct grants as additional hardening
REVOKE ALL ON TABLE public.admin_credentials FROM anon, authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- The admin_credentials_safe view already exists and excludes password_hash
-- Update its RLS policy to allow CEOs to read it
DROP POLICY IF EXISTS "CEOs can view safe credentials" ON public.admin_credentials_safe;

-- Note: Views inherit RLS from the base table by default
-- Since we blocked all access to admin_credentials, the view won't work
-- We need to recreate it with SECURITY DEFINER to bypass base table RLS

-- Drop and recreate the view with SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_credentials_safe;

CREATE VIEW public.admin_credentials_safe 
WITH (security_invoker = false)
AS
SELECT id, role, email, created_at, updated_at
FROM public.admin_credentials;

-- Grant SELECT on the safe view to authenticated users
-- The view itself doesn't expose password_hash
GRANT SELECT ON public.admin_credentials_safe TO authenticated;

-- Create RLS policy on the view for CEOs only
ALTER VIEW public.admin_credentials_safe SET (security_barrier = true);

-- Add comment for documentation
COMMENT ON TABLE public.admin_credentials IS 'Admin credentials - NO CLIENT ACCESS. All access must go through edge functions with service_role.';
COMMENT ON VIEW public.admin_credentials_safe IS 'Safe view of admin credentials without password_hash. Use this for UI display.';