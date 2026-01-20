-- Fix migration: create chat table + indexes + RLS + realtime
CREATE TABLE IF NOT EXISTS public.video_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_chat_messages_video_id_created_at
  ON public.video_chat_messages (video_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_chat_messages_user_id_created_at
  ON public.video_chat_messages (user_id, created_at DESC);

ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Video chat messages are viewable by authenticated users"
  ON public.video_chat_messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own video chat messages"
  ON public.video_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own video chat messages"
  ON public.video_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.video_chat_messages;