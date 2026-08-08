CREATE POLICY "Store managers can update their stores"
ON public.stores
FOR UPDATE
TO authenticated
USING (public.is_store_manager(id))
WITH CHECK (public.is_store_manager(id));