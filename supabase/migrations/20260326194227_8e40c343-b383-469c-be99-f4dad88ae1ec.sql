-- Allow super_admin to view all custom_orders (for revenue metrics)
CREATE POLICY "Super admins can view all orders"
ON public.custom_orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to view all profiles (for user count)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to view all VIP subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON public.vip_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));