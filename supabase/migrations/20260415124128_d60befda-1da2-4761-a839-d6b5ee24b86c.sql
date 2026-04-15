
-- Update RLS: allow anon and authenticated to see trial stores (for offline screen)
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active or trial stores" ON public.stores
FOR SELECT TO anon
USING (status = 'active' OR plan_type = 'trial');

DROP POLICY IF EXISTS "Users can view active stores" ON public.stores;
CREATE POLICY "Users can view active or trial stores" ON public.stores
FOR SELECT TO authenticated
USING (status = 'active' OR plan_type = 'trial');
