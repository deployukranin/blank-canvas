
-- 1. Make vip-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'vip-media';

-- 2. Drop existing public storage policies for vip-media
DROP POLICY IF EXISTS "Public can view vip media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vip media" ON storage.objects;

-- 3. Add VIP-only SELECT policy for vip-media storage
CREATE POLICY "VIP subscribers can view vip media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vip-media' AND
  (
    EXISTS (
      SELECT 1 FROM public.vip_subscriptions
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND expires_at > now()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ceo')
  )
);

-- 4. Remove self-service admin role assignment policy (privilege escalation fix)
DROP POLICY IF EXISTS "Store creators can assign own admin role" ON public.user_roles;

-- 5. Replace with creator-only role assignment (creator role, not admin)
CREATE POLICY "Store creators can assign own creator role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'creator'
  AND EXISTS (SELECT 1 FROM public.stores WHERE created_by = auth.uid())
);

-- 6. Fix invite codes - restrict public SELECT to prevent enumeration
DROP POLICY IF EXISTS "Anyone can check invite codes" ON public.invite_codes;

-- Only admins can list all invite codes
CREATE POLICY "Admins can view all invite codes"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'ceo')
);
