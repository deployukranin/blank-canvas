-- Create reaction type enum
CREATE TYPE public.video_reaction_type AS ENUM ('relaxante', 'dormi', 'arrepios', 'favorito');

-- Create video_reactions table
CREATE TABLE public.video_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id TEXT,
    reaction_type video_reaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure one reaction per user per video (either user_id OR guest_id)
    CONSTRAINT unique_user_video_reaction UNIQUE (video_id, user_id),
    CONSTRAINT unique_guest_video_reaction UNIQUE (video_id, guest_id),
    
    -- At least one identifier must be present
    CONSTRAINT user_or_guest_required CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.video_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view reaction counts"
ON public.video_reactions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert their own reactions"
ON public.video_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_id IS NOT NULL));

CREATE POLICY "Authenticated users can update their own reactions"
ON public.video_reactions
FOR UPDATE
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_id = guest_id));

CREATE POLICY "Authenticated users can delete their own reactions"
ON public.video_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_video_reactions_video_id ON public.video_reactions(video_id);
CREATE INDEX idx_video_reactions_user_id ON public.video_reactions(user_id);
CREATE INDEX idx_video_reactions_guest_id ON public.video_reactions(guest_id);
CREATE INDEX idx_video_reactions_type ON public.video_reactions(reaction_type);

-- Trigger for updated_at
CREATE TRIGGER update_video_reactions_updated_at
BEFORE UPDATE ON public.video_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_reactions;