-- Add fallback storage policies so that any authenticated store owner
-- can upload/update/delete banner & icon images, even if their role
-- assignment hasn't propagated yet (race during signup).

CREATE POLICY "Store owners can upload banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s WHERE s.created_by = auth.uid()
  )
);

CREATE POLICY "Store owners can update banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s WHERE s.created_by = auth.uid()
  )
);

CREATE POLICY "Store owners can delete banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s WHERE s.created_by = auth.uid()
  )
);