-- =====================================================
-- SECURITY FIX: Block public access to admin_credentials_safe VIEW
-- Access should only be via get_admin_credentials_safe() RPC function
-- =====================================================

-- Revoke all privileges from the view for anon and authenticated
REVOKE ALL ON public.admin_credentials_safe FROM anon;
REVOKE ALL ON public.admin_credentials_safe FROM authenticated;
REVOKE ALL ON public.admin_credentials_safe FROM public;

-- The view should only be accessed via the get_admin_credentials_safe() RPC function
-- which already has CEO role verification built in