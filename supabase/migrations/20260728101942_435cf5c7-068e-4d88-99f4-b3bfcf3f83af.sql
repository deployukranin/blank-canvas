-- 1) assign_creator_role: grant 'creator' (tenant-scoped) instead of global 'admin'
CREATE OR REPLACE FUNCTION public.assign_creator_role(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND created_by = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Not the owner of this store');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'creator') THEN
    RETURN json_build_object('success', true, 'message', 'Role already assigned');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'creator');

  RETURN json_build_object('success', true);
END;
$$;

-- 2) store_users: block joining suspended/inactive stores
DROP POLICY IF EXISTS "Users can register to stores" ON public.store_users;
CREATE POLICY "Users can register to active stores"
ON public.store_users FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_users.store_id
      AND s.status = 'active'
      AND s.suspended_at IS NULL
  )
);

-- 3) custom_orders: anti-tamper trigger for client-controlled updates
CREATE OR REPLACE FUNCTION public.custom_orders_prevent_client_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins / staff / super_admin / ceo to update anything
  IF public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'ceo')
     OR public.has_role(auth.uid(), 'super_admin')
     OR public.has_role(auth.uid(), 'creator')
     OR public.is_store_manager(NEW.store_id) THEN
    RETURN NEW;
  END IF;

  -- Owner (client) updates: forbid changes to sensitive fields
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.store_id IS DISTINCT FROM OLD.store_id
     OR NEW.affiliate_id IS DISTINCT FROM OLD.affiliate_id
     OR NEW.product_type IS DISTINCT FROM OLD.product_type
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
     OR NEW.payout_correlation_id IS DISTINCT FROM OLD.payout_correlation_id
     OR NEW.payout_amount_cents IS DISTINCT FROM OLD.payout_amount_cents
     OR NEW.payout_status IS DISTINCT FROM OLD.payout_status
     OR NEW.openpix_charge_id IS DISTINCT FROM OLD.openpix_charge_id
     OR NEW.br_code IS DISTINCT FROM OLD.br_code
     OR NEW.qr_code_image IS DISTINCT FROM OLD.qr_code_image
     OR NEW.correlation_id IS DISTINCT FROM OLD.correlation_id
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
  THEN
    RAISE EXCEPTION 'Not allowed to modify protected fields on custom_orders';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_custom_orders_prevent_tamper ON public.custom_orders;
CREATE TRIGGER trg_custom_orders_prevent_tamper
BEFORE UPDATE ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.custom_orders_prevent_client_tamper();