
-- Add store_id to vip_subscriptions
ALTER TABLE public.vip_subscriptions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Add store_id to vip_content  
ALTER TABLE public.vip_content ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Update RLS policies for vip_content to allow store-scoped access
DROP POLICY IF EXISTS "VIP users can view VIP content" ON public.vip_content;
CREATE POLICY "VIP users can view VIP content"
ON public.vip_content
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE vip_subscriptions.user_id = auth.uid()
      AND vip_subscriptions.status = 'active'
      AND vip_subscriptions.expires_at > now()
      AND vip_subscriptions.store_id = vip_content.store_id
  )
);

-- Allow creators (admin role) to manage their store's VIP content
DROP POLICY IF EXISTS "Admins can manage VIP content" ON public.vip_content;
CREATE POLICY "Admins can manage VIP content"
ON public.vip_content
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ceo'::app_role)
);

-- Update vip_subscriptions RLS for store-scoped reads
DROP POLICY IF EXISTS "Users can view their own VIP subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can view their own VIP subscriptions"
ON public.vip_subscriptions
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Enable realtime for vip_content
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_content;
