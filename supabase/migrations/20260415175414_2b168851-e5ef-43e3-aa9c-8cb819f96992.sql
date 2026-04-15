
-- Fix stores_public view to use SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public
WITH (security_invoker = true)
AS
SELECT 
  id, name, slug, description, avatar_url, banner_url,
  status, plan_type, plan_expires_at, custom_domain, domain_verified,
  url, username, created_at, updated_at, created_by, onboarding_completed
FROM public.stores;

GRANT SELECT ON public.stores_public TO anon;
GRANT SELECT ON public.stores_public TO authenticated;
