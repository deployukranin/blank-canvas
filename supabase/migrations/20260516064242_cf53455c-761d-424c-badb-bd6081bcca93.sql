-- Add partner_id column on stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS partner_id uuid;
CREATE INDEX IF NOT EXISTS idx_stores_partner_id ON public.stores(partner_id);

-- RLS: partners see their assigned stores
DROP POLICY IF EXISTS "Partners can view assigned stores" ON public.stores;
CREATE POLICY "Partners can view assigned stores"
ON public.stores
FOR SELECT
TO authenticated
USING (partner_id = auth.uid() AND public.has_role(auth.uid(), 'partner'));

-- RLS: partners see VIP subscriptions from their assigned stores
DROP POLICY IF EXISTS "Partners can view assigned store subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Partners can view assigned store subscriptions"
ON public.vip_subscriptions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'partner')
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = vip_subscriptions.store_id AND s.partner_id = auth.uid()
  )
);

-- Function: super_admin assigns / unassigns store to partner
CREATE OR REPLACE FUNCTION public.assign_store_partner(p_store_id uuid, p_partner_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  -- If a partner is provided, validate they actually have the partner role
  IF p_partner_user_id IS NOT NULL AND NOT public.has_role(p_partner_user_id, 'partner') THEN
    RETURN json_build_object('success', false, 'error', 'Target user is not a partner');
  END IF;

  UPDATE public.stores SET partner_id = p_partner_user_id, updated_at = now() WHERE id = p_store_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Store not found');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_store_partner(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.assign_store_partner(uuid, uuid) TO authenticated;