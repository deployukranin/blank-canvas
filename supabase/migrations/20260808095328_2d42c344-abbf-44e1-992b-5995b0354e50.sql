DROP POLICY IF EXISTS "Store owners can view banner objects" ON storage.objects;

CREATE POLICY "Store owners can view banner objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (
    public.is_store_manager(((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'super_admin')
  )
);