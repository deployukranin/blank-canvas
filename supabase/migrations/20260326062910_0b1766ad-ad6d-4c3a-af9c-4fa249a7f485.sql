-- Create banners storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Allow authenticated users to upload banners
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Allow public read access to banners
CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Allow admins to delete banners
CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Allow admins to update banners
CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'creator') OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'super_admin'))
);