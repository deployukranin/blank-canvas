-- store_users: scope admin reads to their own store
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.store_users;
CREATE POLICY "Admins can view their store memberships"
ON public.store_users FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_users.store_id
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
      )
  )
);

-- video_chat_messages: scope reads to stores the user belongs to / owns / admins
DROP POLICY IF EXISTS "Authenticated users can view video chat messages" ON public.video_chat_messages;
CREATE POLICY "Members can view their store video chat messages"
ON public.video_chat_messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.store_users su
    WHERE su.store_id = video_chat_messages.store_id
      AND su.user_id = auth.uid()
      AND su.banned_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = video_chat_messages.store_id
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid())
      )
  )
);