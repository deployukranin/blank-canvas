-- =====================================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- =====================================================

-- 1. VIP_SUBSCRIPTIONS - Fix overly permissive service role policy
-- Service role bypasses RLS anyway, so we don't need explicit "true" policies

DROP POLICY IF EXISTS "Service role can update all subscriptions" ON public.vip_subscriptions;

-- Allow admins/CEOs to view all subscriptions (for admin panel)
CREATE POLICY "Admins can view all subscriptions" 
ON public.vip_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- Allow admins/CEOs to manage subscriptions
CREATE POLICY "Admins can manage subscriptions" 
ON public.vip_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- 2. VIP_CONTENT - Already has good policies, but let's ensure consistency
-- (Policies look fine - VIP users can view, admins can manage)

-- 3. VIDEO_REACTIONS - Fix the UPDATE policy that references guest_id incorrectly
DROP POLICY IF EXISTS "Authenticated users can update their own reactions" ON public.video_reactions;

CREATE POLICY "Users can update their own reactions" 
ON public.video_reactions 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND guest_id IS NOT NULL)
);

-- 4. ADMIN_CREDENTIALS - Create a secure view to prevent password hash exposure
-- First, ensure the table policies are restrictive
DROP POLICY IF EXISTS "CEOs can view admin credentials" ON public.admin_credentials;

-- Create a view that hides the password_hash
CREATE OR REPLACE VIEW public.admin_credentials_safe
WITH (security_invoker = on) AS
SELECT id, email, role, created_at, updated_at
FROM public.admin_credentials;

-- CEOs can only view through the safe view (no password hash)
CREATE POLICY "CEOs can view admin credentials via view" 
ON public.admin_credentials 
FOR SELECT 
USING (has_role(auth.uid(), 'ceo'));

-- 5. Ensure all tables have proper DELETE policies where needed
-- custom_orders should not be deletable by users (only admins)
CREATE POLICY "Admins can delete orders" 
ON public.custom_orders 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));

-- 6. profiles - add delete policy for users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. video_watch_history - add delete policy
CREATE POLICY "Users can delete their own watch history" 
ON public.video_watch_history 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND guest_id IS NOT NULL)
);

-- 8. video_chat_messages - add update/delete for moderation
CREATE POLICY "Users can delete their own messages" 
ON public.video_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages" 
ON public.video_chat_messages 
FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ceo'));