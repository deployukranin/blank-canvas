-- =====================================================
-- SECURITY HARDENING: Explicit anon denial for custom_orders
-- =====================================================

-- Ensure RLS is enabled (should already be, but verify)
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra safety)
ALTER TABLE public.custom_orders FORCE ROW LEVEL SECURITY;

-- Revoke all permissions from anon role
REVOKE ALL ON TABLE public.custom_orders FROM anon;

-- Add explicit deny policy for anon (belt and suspenders)
DROP POLICY IF EXISTS "Deny anon access" ON public.custom_orders;
CREATE POLICY "Deny anon access"
ON public.custom_orders
FOR ALL
TO anon
USING (false)
WITH CHECK (false);