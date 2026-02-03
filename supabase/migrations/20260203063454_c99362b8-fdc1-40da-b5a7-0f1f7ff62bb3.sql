-- =====================================================
-- Fix: video_chat_messages privacy - restrict to authenticated users
-- =====================================================

-- Drop the public SELECT policy that allows anyone to read messages
DROP POLICY IF EXISTS "Anyone can view video chat messages" ON public.video_chat_messages;

-- Create new policy: Only authenticated users can read chat messages
CREATE POLICY "Authenticated users can view video chat messages" 
  ON public.video_chat_messages 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Note: The following policies already exist and are secure:
-- - "Authenticated users can insert messages" (INSERT with auth.uid() = user_id)
-- - "Users can delete their own messages" (DELETE with auth.uid() = user_id)
-- - "Admins can manage all messages" (ALL for admin/ceo roles)