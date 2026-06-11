-- 1) Restrict column exposure on public.stores
-- Revoke broad table-level SELECT (which exposed ALL columns incl. stripe_account_id)
REVOKE SELECT ON public.stores FROM anon;
REVOKE SELECT ON public.stores FROM authenticated;

-- Re-grant SELECT only on non-sensitive columns to anon
GRANT SELECT (
  id, name, url, status, created_by, created_at, updated_at, slug, username,
  description, avatar_url, banner_url, plan_type, plan_expires_at, suspended_at,
  onboarding_completed, custom_domain, domain_verified, domain_added_at
) ON public.stores TO anon;

-- Authenticated users also get the store's own referral_code/referred_by/partner for owner UIs?
-- Keep sensitive fields hidden from generic authenticated SELECT; owners read via dedicated paths.
GRANT SELECT (
  id, name, url, status, created_by, created_at, updated_at, slug, username,
  description, avatar_url, banner_url, plan_type, plan_expires_at, suspended_at,
  onboarding_completed, custom_domain, domain_verified, domain_added_at
) ON public.stores TO authenticated;

-- 2) Banners bucket: remove loose admin write policies (not store-scoped)
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;

-- Recreate store-scoped banner write policies referencing the OBJECT path (name)
DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete banners" ON storage.objects;

CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  )
);

CREATE POLICY "Store owners can update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  )
);

CREATE POLICY "Store owners can delete banners"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  )
);