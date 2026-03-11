
-- Create storage bucket for media preview files (audio, video, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-previews',
  'media-previews',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
);

-- Admins and CEOs can upload/manage files
CREATE POLICY "Admins can upload media previews"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-previews'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
);

CREATE POLICY "Admins can update media previews"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-previews'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
);

CREATE POLICY "Admins can delete media previews"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-previews'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
);

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view media previews"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media-previews');
