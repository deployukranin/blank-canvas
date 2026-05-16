DROP POLICY IF EXISTS "Anyone can view feed posts" ON public.feed_posts;

CREATE POLICY "Public can view non-exclusive feed posts"
ON public.feed_posts FOR SELECT
TO anon, authenticated
USING (
  type <> 'exclusive'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'ceo'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.vip_subscriptions vs
    WHERE vs.user_id = auth.uid()
      AND vs.status = 'active'
      AND vs.expires_at > now()
      AND (vs.store_id = feed_posts.store_id OR feed_posts.store_id IS NULL)
  )
);