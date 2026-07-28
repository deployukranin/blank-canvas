
-- =========================================================
-- 1) PROFILES: restringir SELECT
-- =========================================================

-- Helper: dois usuários compartilham alguma loja ativa?
CREATE OR REPLACE FUNCTION public.users_share_store(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.store_users su1
    JOIN public.store_users su2 ON su2.store_id = su1.store_id
    WHERE su1.user_id = _a AND su2.user_id = _b
      AND su1.banned_at IS NULL AND su2.banned_at IS NULL
  ) OR EXISTS (
    -- criador/admin da loja em que o outro é membro
    SELECT 1 FROM public.store_users su
    WHERE su.user_id = _b AND (
      public.is_store_manager(su.store_id)
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.users_share_store(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.users_share_store(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users view own or shared-store profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.users_share_store(auth.uid(), user_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'ceo'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- =========================================================
-- 2) STORAGE: reforçar INSERT policies (bucket + role/owner)
-- =========================================================

DROP POLICY IF EXISTS "Admins can upload media previews" ON storage.objects;
CREATE POLICY "Admins can upload media previews"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media-previews'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ceo'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Admins can upload vip media" ON storage.objects;
CREATE POLICY "Admins can upload vip media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vip-media'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ceo'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Auth users can upload payment proofs" ON storage.objects;
CREATE POLICY "Auth users can upload payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Store owners can upload banners" ON storage.objects;
CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
);

-- =========================================================
-- 3) ÍNDICES em Foreign Keys ausentes
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_stores_referred_by_store_id  ON public.stores(referred_by_store_id);
CREATE INDEX IF NOT EXISTS idx_video_ideas_user_id          ON public.video_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_video_idea_votes_user_id     ON public.video_idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_store_id   ON public.vip_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_vip_content_store_id         ON public.vip_content(store_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_store_id     ON public.support_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id   ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id      ON public.order_messages(order_id);
