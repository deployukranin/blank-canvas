
-- Helpers
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _store_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.store_users
    WHERE store_id = _store_id AND user_id = auth.uid() AND banned_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.is_store_manager(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _store_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.store_admins WHERE store_id = _store_id AND user_id = auth.uid())
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_store_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_manager(uuid) TO authenticated;

-- ============ app_configurations ============
DROP POLICY IF EXISTS "Admins can manage configurations" ON public.app_configurations;
CREATE POLICY "Store managers manage their store configurations"
  ON public.app_configurations FOR ALL TO authenticated
  USING (store_id IS NOT NULL AND public.is_store_manager(store_id))
  WITH CHECK (store_id IS NOT NULL AND public.is_store_manager(store_id));

-- CEO manages any (including NULL/global)
CREATE POLICY "CEOs manage all configurations"
  ON public.app_configurations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'::app_role));

-- ============ feed_posts ============
DROP POLICY IF EXISTS "Admins manage feed posts" ON public.feed_posts;
CREATE POLICY "Store managers manage their feed posts"
  ON public.feed_posts FOR ALL TO authenticated
  USING (store_id IS NOT NULL AND public.is_store_manager(store_id))
  WITH CHECK (store_id IS NOT NULL AND public.is_store_manager(store_id));

CREATE POLICY "CEOs and super admins manage all feed posts"
  ON public.feed_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ============ invite_codes ============
DROP POLICY IF EXISTS "Admins can view all invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins manage invite codes" ON public.invite_codes;

CREATE POLICY "Store managers manage their invite codes"
  ON public.invite_codes FOR ALL TO authenticated
  USING (store_id IS NOT NULL AND public.is_store_manager(store_id))
  WITH CHECK (store_id IS NOT NULL AND public.is_store_manager(store_id));

CREATE POLICY "CEOs manage all invite codes"
  ON public.invite_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'::app_role));

-- ============ video_ideas ============
DROP POLICY IF EXISTS "Admins can delete any idea" ON public.video_ideas;
DROP POLICY IF EXISTS "Admins can update all ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Admins can view all ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Anon can view active ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Authenticated users can view active ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas" ON public.video_ideas;
DROP POLICY IF EXISTS "Users can update their own ideas" ON public.video_ideas;

-- Deny anon (ideas are scoped per tenant, not public)
CREATE POLICY "Deny anon ideas" ON public.video_ideas
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Members view store ideas"
  ON public.video_ideas FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND store_id IS NOT NULL
    AND (public.is_store_member(store_id) OR public.is_store_manager(store_id))
  );

CREATE POLICY "Store managers view all their ideas"
  ON public.video_ideas FOR SELECT TO authenticated
  USING (store_id IS NOT NULL AND public.is_store_manager(store_id));

CREATE POLICY "Members create ideas in their store"
  ON public.video_ideas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND store_id IS NOT NULL AND public.is_store_member(store_id));

CREATE POLICY "Users update own ideas"
  ON public.video_ideas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ideas"
  ON public.video_ideas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Store managers manage their store ideas"
  ON public.video_ideas FOR ALL TO authenticated
  USING (store_id IS NOT NULL AND public.is_store_manager(store_id))
  WITH CHECK (store_id IS NOT NULL AND public.is_store_manager(store_id));

CREATE POLICY "CEO super admin manage all ideas"
  ON public.video_ideas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'ceo'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

-- ============ video_chat_messages ============
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.video_chat_messages;
CREATE POLICY "Store members can insert chat messages"
  ON public.video_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND store_id IS NOT NULL
    AND (public.is_store_member(store_id) OR public.is_store_manager(store_id))
  );

-- ============ custom_orders ============
DROP POLICY IF EXISTS "Auth users create own orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.custom_orders;
CREATE POLICY "Members create orders in their store"
  ON public.custom_orders FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      store_id IS NULL
      OR public.is_store_member(store_id)
      OR public.is_store_manager(store_id)
    )
  );

-- ============ video_idea_votes ============
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.video_idea_votes;
CREATE POLICY "Members vote on ideas in their store"
  ON public.video_idea_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.video_ideas vi
      WHERE vi.id = video_idea_votes.idea_id
        AND vi.store_id IS NOT NULL
        AND (public.is_store_member(vi.store_id) OR public.is_store_manager(vi.store_id))
    )
  );
