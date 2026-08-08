DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete banners" ON storage.objects;

CREATE POLICY "Store owners can upload banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (
    public.is_store_manager(((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'super_admin')
  )
);

CREATE POLICY "Store owners can update banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (
    public.is_store_manager(((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (
    public.is_store_manager(((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'super_admin')
  )
);

CREATE POLICY "Store owners can delete banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (
    public.is_store_manager(((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'super_admin')
  )
);