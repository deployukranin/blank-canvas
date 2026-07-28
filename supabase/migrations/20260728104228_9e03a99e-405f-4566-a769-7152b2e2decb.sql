-- Restrict raw SELECT to the row owner (auth user or guest) so user_id is not publicly linkable
DROP POLICY IF EXISTS "Anyone can view reaction counts" ON public.video_reactions;

CREATE POLICY "Users can view their own reaction"
  ON public.video_reactions
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

-- Public aggregate view exposes only counts, never user_id/guest_id
CREATE OR REPLACE VIEW public.video_reaction_counts
WITH (security_invoker = true) AS
SELECT video_id, reaction_type, count(*)::bigint AS count
FROM public.video_reactions
GROUP BY video_id, reaction_type;

-- Aggregate view needs its own policy path; use a SECURITY DEFINER function for safe public counts
CREATE OR REPLACE FUNCTION public.get_video_reaction_counts(p_video_id text)
RETURNS TABLE(reaction_type public.video_reaction_type, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT reaction_type, count(*)::bigint
  FROM public.video_reactions
  WHERE video_id = p_video_id
  GROUP BY reaction_type;
$$;

REVOKE ALL ON FUNCTION public.get_video_reaction_counts(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_video_reaction_counts(text) TO anon, authenticated;

-- Drop the view (superseded by the function which safely bypasses RLS for aggregates only)
DROP VIEW IF EXISTS public.video_reaction_counts;
