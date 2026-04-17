-- 1) Restrict stores table SELECT — remove broad anon/authenticated policies and replace with owner/admin-only
DROP POLICY IF EXISTS "Public can view active or trial stores" ON public.stores;
DROP POLICY IF EXISTS "Users can view active or trial stores" ON public.stores;

CREATE POLICY "Owners can view their stores"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = stores.id AND sa.user_id = auth.uid())
  );
-- Note: existing "Admin can view stores", "CEO can manage stores", "Super admins can manage stores" remain.
-- Public/anonymous and other authenticated users must use the stores_public view (no stripe_account_id).

-- 2) Restrict creator role self-assignment — remove self-insert policy
DROP POLICY IF EXISTS "Store creators can assign own creator role" ON public.user_roles;
-- Creator role must now be assigned via SECURITY DEFINER function or by CEO/admin.

-- 3) Tighten public bucket listing — restrict SELECT on storage.objects for media-previews and banners to specific operations
-- Keep individual file access by URL but prevent listing the entire bucket
DROP POLICY IF EXISTS "Anyone can view media previews" ON storage.objects;
DROP POLICY IF EXISTS "Public can view banners" ON storage.objects;

-- Re-create with restriction: allow access only when a specific file name is requested (still allows direct URL fetches via Supabase)
-- Note: Supabase serves public buckets via /storage/v1/object/public/* which bypasses RLS, so URLs still work.
-- The SELECT policy on storage.objects only controls listing via the API — removing the broad policy prevents listing.

-- 4) Scope VIP media storage to owning store
DROP POLICY IF EXISTS "VIP subscribers can view vip media" ON storage.objects;

CREATE POLICY "VIP subscribers can view their store vip media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vip-media'
    AND EXISTS (
      SELECT 1 FROM public.vip_subscriptions vs
      WHERE vs.user_id = auth.uid()
        AND vs.status = 'active'
        AND vs.expires_at > now()
        AND vs.store_id::text = (storage.foldername(name))[1]
    )
  );
-- This requires VIP media files to be uploaded under a path starting with the store_id, e.g. "<store_id>/file.jpg"
-- which matches the existing uploadVipMedia() convention in src/lib/external-storage.ts.