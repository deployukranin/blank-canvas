CREATE POLICY "Users manage own profile media upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "Users manage own profile media update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[3] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "Users manage own profile media delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "Users can read own profile media"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = 'profiles'
  );