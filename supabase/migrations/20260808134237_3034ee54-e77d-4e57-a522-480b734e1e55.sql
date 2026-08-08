CREATE POLICY "Store managers manage own VIP content"
ON public.vip_content
FOR ALL
TO authenticated
USING (public.is_store_manager(store_id))
WITH CHECK (public.is_store_manager(store_id));