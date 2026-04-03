
-- Create vip-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vip-media', 'vip-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins/creators to upload files
CREATE POLICY "Admins can upload vip media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vip-media'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'ceo'::public.app_role)
  )
);

-- Allow admins/creators to update files
CREATE POLICY "Admins can update vip media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vip-media'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'ceo'::public.app_role)
  )
);

-- Allow admins/creators to delete files
CREATE POLICY "Admins can delete vip media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vip-media'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'ceo'::public.app_role)
  )
);

-- Allow public read access to vip media
CREATE POLICY "Public can view vip media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vip-media');
