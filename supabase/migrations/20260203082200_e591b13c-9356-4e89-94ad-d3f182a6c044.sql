-- Create video_ideas table for user-submitted video ideas
CREATE TABLE public.video_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reported', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_idea_votes table to track who voted
CREATE TABLE public.video_idea_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.video_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.video_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_idea_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_ideas
-- Anyone authenticated can view active ideas
CREATE POLICY "Authenticated users can view active ideas"
ON public.video_ideas
FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'active');

-- Admins can view all ideas
CREATE POLICY "Admins can view all ideas"
ON public.video_ideas
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Authenticated users can insert their own ideas
CREATE POLICY "Users can insert their own ideas"
ON public.video_ideas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ideas
CREATE POLICY "Users can update their own ideas"
ON public.video_ideas
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update all ideas (for moderation)
CREATE POLICY "Admins can update all ideas"
ON public.video_ideas
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Users can delete their own ideas
CREATE POLICY "Users can delete their own ideas"
ON public.video_ideas
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any idea
CREATE POLICY "Admins can delete any idea"
ON public.video_ideas
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- RLS Policies for video_idea_votes
-- Users can view their own votes
CREATE POLICY "Users can view their own votes"
ON public.video_idea_votes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes"
ON public.video_idea_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes (unvote)
CREATE POLICY "Users can delete their own votes"
ON public.video_idea_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_video_ideas_updated_at
BEFORE UPDATE ON public.video_ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment/decrement votes
CREATE OR REPLACE FUNCTION public.toggle_idea_vote(p_idea_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_existing_vote UUID;
  v_new_votes INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;
  
  -- Check if user already voted
  SELECT id INTO v_existing_vote
  FROM public.video_idea_votes
  WHERE idea_id = p_idea_id AND user_id = v_user_id;
  
  IF v_existing_vote IS NOT NULL THEN
    -- Remove vote
    DELETE FROM public.video_idea_votes WHERE id = v_existing_vote;
    UPDATE public.video_ideas SET votes = votes - 1 WHERE id = p_idea_id RETURNING votes INTO v_new_votes;
    RETURN json_build_object('success', true, 'voted', false, 'votes', v_new_votes);
  ELSE
    -- Add vote
    INSERT INTO public.video_idea_votes (idea_id, user_id) VALUES (p_idea_id, v_user_id);
    UPDATE public.video_ideas SET votes = votes + 1 WHERE id = p_idea_id RETURNING votes INTO v_new_votes;
    RETURN json_build_object('success', true, 'voted', true, 'votes', v_new_votes);
  END IF;
END;
$$;