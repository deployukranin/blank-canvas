-- =====================================================
-- SECURITY FIX: Harden video_chat_messages RLS
-- This is a public video comment system (like YouTube comments)
-- All authenticated users can view comments, but anon must be blocked
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;

-- Revoke all access from anon to prevent any accidental public exposure
REVOKE ALL ON TABLE public.video_chat_messages FROM anon;

-- Drop and recreate the SELECT policy with explicit authenticated requirement
DROP POLICY IF EXISTS "Authenticated users can view video chat messages" ON public.video_chat_messages;

CREATE POLICY "Authenticated users can view video chat messages"
ON public.video_chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Ensure INSERT policy requires auth.uid() match
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.video_chat_messages;

CREATE POLICY "Authenticated users can insert messages"
ON public.video_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Ensure DELETE policy for own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.video_chat_messages;

CREATE POLICY "Users can delete their own messages"
ON public.video_chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admin policies already exist and are correct (has_role checks)