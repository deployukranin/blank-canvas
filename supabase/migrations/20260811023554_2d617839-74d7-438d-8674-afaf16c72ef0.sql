CREATE OR REPLACE FUNCTION public.has_active_vip_for_store(_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.vip_subscriptions vs
    WHERE vs.user_id = auth.uid()
      AND vs.status = 'active'
      AND vs.expires_at > now()
      AND (_store_id IS NULL OR vs.store_id = _store_id)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_vip_for_store(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_vip_for_store(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public can view non-exclusive feed posts" ON public.feed_posts;
CREATE POLICY "Public can view non-exclusive feed posts"
ON public.feed_posts FOR SELECT TO anon, authenticated
USING (
  type <> 'exclusive'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'ceo'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_active_vip_for_store(store_id)
);