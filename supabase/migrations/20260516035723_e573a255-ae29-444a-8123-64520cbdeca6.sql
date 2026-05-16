DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Public can view active or trial stores" ON public.stores;
DROP POLICY IF EXISTS "Users can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Users can view active or trial stores" ON public.stores;

CREATE POLICY "Public can view active or trial stores"
ON public.stores
FOR SELECT
TO anon
USING (status = 'active' OR plan_type = 'trial');

CREATE POLICY "Users can view active or trial stores"
ON public.stores
FOR SELECT
TO authenticated
USING (status = 'active' OR plan_type = 'trial');