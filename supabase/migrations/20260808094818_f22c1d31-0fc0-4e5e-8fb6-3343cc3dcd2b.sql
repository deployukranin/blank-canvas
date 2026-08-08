DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  )
);