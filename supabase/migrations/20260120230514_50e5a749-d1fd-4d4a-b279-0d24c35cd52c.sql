-- Create video watch history table
CREATE TABLE public.video_watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id TEXT,
    last_position_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure one entry per user per video
    CONSTRAINT unique_user_video_history UNIQUE (video_id, user_id),
    CONSTRAINT unique_guest_video_history UNIQUE (video_id, guest_id),
    
    -- At least one identifier must be present
    CONSTRAINT history_user_or_guest_required CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.video_watch_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watch history"
ON public.video_watch_history
FOR SELECT
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_id IS NOT NULL));

CREATE POLICY "Users can insert their own watch history"
ON public.video_watch_history
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_id IS NOT NULL));

CREATE POLICY "Users can update their own watch history"
ON public.video_watch_history
FOR UPDATE
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_id IS NOT NULL));

-- Indexes for performance
CREATE INDEX idx_video_watch_history_user_id ON public.video_watch_history(user_id);
CREATE INDEX idx_video_watch_history_guest_id ON public.video_watch_history(guest_id);
CREATE INDEX idx_video_watch_history_video_id ON public.video_watch_history(video_id);
CREATE INDEX idx_video_watch_history_updated_at ON public.video_watch_history(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_video_watch_history_updated_at
BEFORE UPDATE ON public.video_watch_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();