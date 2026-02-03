-- Add RLS policy for admins to view all orders
CREATE POLICY "Admins can view all orders" 
ON public.custom_orders 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));