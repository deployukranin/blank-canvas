-- =====================================================
-- CRITICAL FIX: Remove guest order exposure via user_id IS NULL
-- =====================================================

-- Drop the unsafe policies that allow user_id IS NULL
DROP POLICY IF EXISTS "Users view own orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can insert own orders or guest orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.custom_orders;

-- Revoke anon access completely
REVOKE ALL ON TABLE public.custom_orders FROM anon;

-- Create safe policies - authenticated users only, must match auth.uid()

-- SELECT: Users can only view their own orders (no NULL user_id allowed)
CREATE POLICY "Auth users view own orders"
ON public.custom_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can only create orders for themselves (no NULL user_id allowed)
CREATE POLICY "Auth users create own orders"
ON public.custom_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own orders
CREATE POLICY "Auth users update own orders"
ON public.custom_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin policies remain unchanged (they use has_role checks)