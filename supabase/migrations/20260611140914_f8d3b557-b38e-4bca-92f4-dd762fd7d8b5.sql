-- Fix banner policies: qualify object path as storage.objects.name to avoid
-- ambiguous resolution to stores.name inside the EXISTS subquery
DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete banners" ON storage.objects;

CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
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
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
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
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  )
);

-- custom_orders: make admin delete policy explicitly target authenticated
DROP POLICY IF EXISTS "Admins can delete orders" ON public.custom_orders;
CREATE POLICY "Admins can delete orders"
ON public.custom_orders FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'super_admin')
);