-- Add pending_payment status to vip_subscriptions if not already handled
-- Update RLS policies to allow service role to update all subscriptions

-- Drop existing policy if it exists and recreate with proper permissions
DROP POLICY IF EXISTS "Service role can update all subscriptions" ON public.vip_subscriptions;

-- Create policy for service role to update subscriptions (for webhook)
CREATE POLICY "Service role can update all subscriptions" 
ON public.vip_subscriptions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow inserting pending_payment subscriptions
DROP POLICY IF EXISTS "Users can create their own VIP subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can create their own VIP subscriptions" 
ON public.vip_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to see their pending subscriptions too
DROP POLICY IF EXISTS "Users can view their own VIP subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can view their own VIP subscriptions" 
ON public.vip_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);