-- Public storefront lookup function (no sensitive columns)
CREATE OR REPLACE FUNCTION public.get_store_public(
  _slug TEXT DEFAULT NULL,
  _domain TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  status TEXT,
  plan_type TEXT,
  plan_expires_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    name,
    slug,
    description,
    avatar_url,
    banner_url,
    status,
    plan_type,
    plan_expires_at
  FROM public.stores
  WHERE (
    (_slug IS NOT NULL AND slug = _slug)
    OR (_domain IS NOT NULL AND custom_domain = _domain)
  )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_public(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_public(TEXT, TEXT) TO authenticated;

-- Replace the old public view with the function
DROP VIEW IF EXISTS public.stores_public;

-- Remove public/anonymous direct access to the raw stores table
DROP POLICY IF EXISTS "Public can view active or trial stores" ON public.stores;
REVOKE SELECT ON public.stores FROM anon;

-- Harden video_reactions: only the real auth user (authenticated or anonymous) can touch their row
DROP POLICY IF EXISTS "Users can view their own reaction" ON public.video_reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON public.video_reactions;
DROP POLICY IF EXISTS "Authenticated users can insert their own reactions" ON public.video_reactions;
DROP POLICY IF EXISTS "Authenticated users can delete their own reactions" ON public.video_reactions;

CREATE POLICY "Users can view their own reaction"
ON public.video_reactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can insert their own reaction"
ON public.video_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can update their own reaction"
ON public.video_reactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id)
WITH CHECK (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can delete their own reaction"
ON public.video_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id);

-- Harden video_watch_history the same way
DROP POLICY IF EXISTS "Users can view their own watch history" ON public.video_watch_history;
DROP POLICY IF EXISTS "Users can update their own watch history" ON public.video_watch_history;
DROP POLICY IF EXISTS "Users can insert their own watch history" ON public.video_watch_history;
DROP POLICY IF EXISTS "Users can delete their own watch history" ON public.video_watch_history;

CREATE POLICY "Users can view their own watch history"
ON public.video_watch_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can insert their own watch history"
ON public.video_watch_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can update their own watch history"
ON public.video_watch_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id)
WITH CHECK (auth.uid() = user_id OR auth.uid()::text = guest_id);

CREATE POLICY "Users can delete their own watch history"
ON public.video_watch_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = guest_id);

-- Revoke anon EXECUTE on internal security definer functions that are not used by anonymous policies
REVOKE EXECUTE ON FUNCTION public.get_store_trial_status(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_video_reaction_counts(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_vip_for_store(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_store_manager(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_store_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_vip(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_tracker(UUID) FROM anon;