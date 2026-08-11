-- 1) Remove dangerous maintenance privileges from client roles on every public table
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated', t.relname);
  END LOOP;
END $$;

-- 2) Anonymous (no session) role: revoke everything, then re-grant only what public pages need
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

-- public storefront reads (guarded by existing anon SELECT policies)
GRANT SELECT ON public.app_configurations TO anon;
GRANT SELECT ON public.feed_posts TO anon;
GRANT SELECT ON public.youtube_videos_cache TO anon;
GRANT SELECT ON public.youtube_cache_metadata TO anon;

-- guest (session-less) playback state, still constrained by existing guest_id policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_watch_history TO anon;

-- 3) Block executable/active file types in user-writable storage paths
DROP POLICY IF EXISTS "Users manage own profile media upload" ON storage.objects;
CREATE POLICY "Users manage own profile media upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[3] = (auth.uid())::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif')
);

DROP POLICY IF EXISTS "Users manage own profile media update" ON storage.objects;
CREATE POLICY "Users manage own profile media update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[3] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[3] = (auth.uid())::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif')
);

DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (is_store_manager(((storage.foldername(name))[1])::uuid) OR has_role(auth.uid(), 'super_admin'::app_role))
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif','ico')
);

DROP POLICY IF EXISTS "Store owners can update banners" ON storage.objects;
CREATE POLICY "Store owners can update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (is_store_manager(((storage.foldername(name))[1])::uuid) OR has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND (is_store_manager(((storage.foldername(name))[1])::uuid) OR has_role(auth.uid(), 'super_admin'::app_role))
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif','ico')
);

DROP POLICY IF EXISTS "Auth users can upload payment proofs" ON storage.objects;
CREATE POLICY "Auth users can upload payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','pdf')
);