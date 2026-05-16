DROP POLICY IF EXISTS "Anon can view active ideas" ON public.video_ideas;

CREATE POLICY "Anon can view active ideas"
ON public.video_ideas
FOR SELECT
TO anon
USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated users can view active ideas" ON public.video_ideas;

CREATE POLICY "Authenticated users can view active ideas"
ON public.video_ideas
FOR SELECT
TO authenticated
USING (status = 'active');