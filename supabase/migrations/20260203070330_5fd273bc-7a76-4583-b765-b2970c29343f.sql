-- =====================================================
-- SECURITY FIX: Remove public access to profiles table
-- =====================================================

-- Drop the overly permissive policy that allows anyone to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Revoke all access from anon role for extra safety
REVOKE ALL ON TABLE public.profiles FROM anon;

-- Create new policy: Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: Update/Insert/Delete policies already correctly use auth.uid() = user_id
-- No changes needed for those