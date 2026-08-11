-- Migration: Security hardening for production readiness
-- Fixes: stores_public view exposure, email-assets bucket policy scope,
-- and SECURITY DEFINER functions callable by PUBLIC.

-- 1) Harden the public storefront view: expose only columns needed for
-- public display, removing created_by (internal owner UUID) and any
-- future financial columns. The view uses security_invoker = off so it
-- runs with the view owner's privileges, which lets anonymous users read
-- the view without needing direct access to the underlying stores table.
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public WITH (security_invoker = off) AS
SELECT
    id,
    name,
    slug,
    description,
    avatar_url,
    banner_url,
    status,
    plan_type,
    plan_expires_at,
    custom_domain,
    domain_verified,
    domain_added_at,
    url,
    username,
    created_at,
    updated_at,
    onboarding_completed,
    suspended_at
FROM public.stores
WHERE status = 'active' OR plan_type = 'trial';

COMMENT ON VIEW public.stores_public IS 'Public storefront view: exposes only safe, non-sensitive columns for anonymous/guest visitors. Row filtering is built into the view.';

-- The view must be reachable by anonymous users and authenticated users.
GRANT SELECT ON public.stores_public TO anon, authenticated;

-- 2) Remove the ability of anonymous users to read the raw stores table directly.
-- They must use the public view above.
REVOKE SELECT ON public.stores FROM anon;

-- 3) Fix the email-assets bucket policy: the bucket is private but the
-- policy grants public SELECT to everything. Since the workspace blocks
-- public buckets, scope the public policy to a dedicated 'public/' sub-path
-- so that only intentionally public assets are exposed, while private
-- email assets remain protected.
DROP POLICY IF EXISTS "Public read email-assets" ON storage.objects;

CREATE POLICY "Public read email-assets public folder"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
    bucket_id = 'email-assets'
    AND (storage.filename(name)) LIKE 'public/%'
);

-- 4) SECURITY DEFINER functions currently executable by PUBLIC role
-- (is_store_manager, is_store_member, owns_tracker) are only used inside
-- RLS policies scoped to the authenticated role. Revoke from PUBLIC and
-- grant only to authenticated to prevent anonymous or unauthenticated
-- direct invocation.
REVOKE EXECUTE ON FUNCTION public.is_store_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_manager(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_store_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.owns_tracker(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_tracker(uuid) TO authenticated;

-- 5) Service role keeps full access for maintenance and edge functions.
GRANT ALL ON public.stores_public TO service_role;
GRANT ALL ON public.stores TO service_role;