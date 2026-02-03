-- =====================================================
-- SECURITY HARDENING: Explicit anon denial for profiles and video_chat_messages
-- =====================================================

-- PROFILES: Force RLS and add explicit anon deny
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon access" ON public.profiles;
CREATE POLICY "Deny anon access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- VIDEO_CHAT_MESSAGES: Force RLS and add explicit anon deny
ALTER TABLE public.video_chat_messages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon access" ON public.video_chat_messages;
CREATE POLICY "Deny anon access"
ON public.video_chat_messages
FOR ALL
TO anon
USING (false)
WITH CHECK (false);