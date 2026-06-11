-- 1. user_roles: restrict management/view policies to authenticated role (remove public/anon from policy scope)
DROP POLICY IF EXISTS "CEOs can manage roles" ON public.user_roles;
CREATE POLICY "CEOs can manage roles" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ceo'::app_role) OR (auth.uid() = user_id));

-- 2. payment-proofs: add owner-scoped DELETE policy (no UPDATE policy => updates remain denied)
DROP POLICY IF EXISTS "Users can delete own payment proofs" ON storage.objects;
CREATE POLICY "Users can delete own payment proofs" ON storage.objects
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. banners: enforce path-based store ownership (first folder segment must be a store the user owns/admins)
DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
CREATE POLICY "Store owners can upload banners" ON storage.objects
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'banners' AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND (s.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Store owners can update banners" ON storage.objects;
CREATE POLICY "Store owners can update banners" ON storage.objects
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    bucket_id = 'banners' AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND (s.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Store owners can delete banners" ON storage.objects;
CREATE POLICY "Store owners can delete banners" ON storage.objects
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    bucket_id = 'banners' AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND (s.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
    )
  );

-- 4. stores: stop exposing sensitive business columns to other users via the Data API.
-- These columns are never selected client-side except by the owner (referral_code/referred_by_store_id).
REVOKE SELECT (stripe_account_id, partner_id, referred_by_store_id, referral_code) ON public.stores FROM anon;
REVOKE SELECT (stripe_account_id, partner_id) ON public.stores FROM authenticated;