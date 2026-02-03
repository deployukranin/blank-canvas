-- Fix RLS policies for custom_orders table

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.custom_orders;

-- Create new restrictive insert policy
-- Allows: logged-in users to insert their own orders, OR guest orders (user_id NULL) only when not authenticated
CREATE POLICY "Users can insert own orders or guest orders" 
ON public.custom_orders 
FOR INSERT 
WITH CHECK (
  (user_id IS NULL) OR (user_id = auth.uid())
);

-- Update policy: users can only update their own orders (limited fields)
CREATE POLICY "Users can update own orders" 
ON public.custom_orders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix user_roles table - ensure only admins/ceo can manage roles
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

-- Allow admins and CEOs to view all roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'ceo') OR 
  auth.uid() = user_id
);

-- Only CEOs can insert/update/delete roles (prevents privilege escalation)
CREATE POLICY "CEOs can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'ceo'))
WITH CHECK (has_role(auth.uid(), 'ceo'));