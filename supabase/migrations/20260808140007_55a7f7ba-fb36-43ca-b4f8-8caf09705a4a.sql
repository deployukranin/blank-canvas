CREATE POLICY "Store managers can grant subscriptions"
ON public.vip_subscriptions FOR INSERT TO authenticated
WITH CHECK (public.is_store_manager(store_id));

CREATE POLICY "Store managers can update store subscriptions"
ON public.vip_subscriptions FOR UPDATE TO authenticated
USING (public.is_store_manager(store_id))
WITH CHECK (public.is_store_manager(store_id));

CREATE POLICY "Store managers can delete store subscriptions"
ON public.vip_subscriptions FOR DELETE TO authenticated
USING (public.is_store_manager(store_id));