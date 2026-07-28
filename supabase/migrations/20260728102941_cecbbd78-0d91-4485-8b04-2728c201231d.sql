
-- =========================================================
-- 1) Audit table for blocked custom_orders tamper attempts
-- =========================================================
CREATE TABLE IF NOT EXISTS public.custom_orders_tamper_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  store_id uuid,
  user_id uuid,
  user_role text,
  attempted_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_orders_tamper_attempts TO authenticated;
GRANT ALL ON public.custom_orders_tamper_attempts TO service_role;

ALTER TABLE public.custom_orders_tamper_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tamper_attempts_admin_read" ON public.custom_orders_tamper_attempts;
CREATE POLICY "tamper_attempts_admin_read"
  ON public.custom_orders_tamper_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'ceo'));

-- Block direct writes; only the SECURITY DEFINER trigger may insert.
DROP POLICY IF EXISTS "tamper_attempts_no_write" ON public.custom_orders_tamper_attempts;
CREATE POLICY "tamper_attempts_no_write"
  ON public.custom_orders_tamper_attempts
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_tamper_attempts_order ON public.custom_orders_tamper_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_tamper_attempts_user ON public.custom_orders_tamper_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_tamper_attempts_created ON public.custom_orders_tamper_attempts(created_at DESC);

-- =========================================================
-- 2) Updated tamper-prevention trigger with audit logging
-- =========================================================
CREATE OR REPLACE FUNCTION public.custom_orders_prevent_client_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_fields jsonb := '[]'::jsonb;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_role text;
BEGIN
  -- Allow admins / staff / creators / store managers
  IF public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'ceo')
     OR public.has_role(auth.uid(), 'super_admin')
     OR public.has_role(auth.uid(), 'creator')
     OR public.is_store_manager(NEW.store_id) THEN
    RETURN NEW;
  END IF;

  -- Collect any protected-field changes
  IF NEW.user_id                IS DISTINCT FROM OLD.user_id                THEN v_fields := v_fields || to_jsonb('user_id'); v_old := v_old || jsonb_build_object('user_id', OLD.user_id); v_new := v_new || jsonb_build_object('user_id', NEW.user_id); END IF;
  IF NEW.amount_cents           IS DISTINCT FROM OLD.amount_cents           THEN v_fields := v_fields || to_jsonb('amount_cents'); v_old := v_old || jsonb_build_object('amount_cents', OLD.amount_cents); v_new := v_new || jsonb_build_object('amount_cents', NEW.amount_cents); END IF;
  IF NEW.status                 IS DISTINCT FROM OLD.status                 THEN v_fields := v_fields || to_jsonb('status'); v_old := v_old || jsonb_build_object('status', OLD.status); v_new := v_new || jsonb_build_object('status', NEW.status); END IF;
  IF NEW.store_id               IS DISTINCT FROM OLD.store_id               THEN v_fields := v_fields || to_jsonb('store_id'); v_old := v_old || jsonb_build_object('store_id', OLD.store_id); v_new := v_new || jsonb_build_object('store_id', NEW.store_id); END IF;
  IF NEW.affiliate_id           IS DISTINCT FROM OLD.affiliate_id           THEN v_fields := v_fields || to_jsonb('affiliate_id'); END IF;
  IF NEW.product_type           IS DISTINCT FROM OLD.product_type           THEN v_fields := v_fields || to_jsonb('product_type'); END IF;
  IF NEW.product_id             IS DISTINCT FROM OLD.product_id             THEN v_fields := v_fields || to_jsonb('product_id'); END IF;
  IF NEW.paid_at                IS DISTINCT FROM OLD.paid_at                THEN v_fields := v_fields || to_jsonb('paid_at'); END IF;
  IF NEW.delivered_at           IS DISTINCT FROM OLD.delivered_at           THEN v_fields := v_fields || to_jsonb('delivered_at'); END IF;
  IF NEW.payout_correlation_id  IS DISTINCT FROM OLD.payout_correlation_id  THEN v_fields := v_fields || to_jsonb('payout_correlation_id'); END IF;
  IF NEW.payout_amount_cents    IS DISTINCT FROM OLD.payout_amount_cents    THEN v_fields := v_fields || to_jsonb('payout_amount_cents'); END IF;
  IF NEW.payout_status          IS DISTINCT FROM OLD.payout_status          THEN v_fields := v_fields || to_jsonb('payout_status'); END IF;
  IF NEW.openpix_charge_id      IS DISTINCT FROM OLD.openpix_charge_id      THEN v_fields := v_fields || to_jsonb('openpix_charge_id'); END IF;
  IF NEW.br_code                IS DISTINCT FROM OLD.br_code                THEN v_fields := v_fields || to_jsonb('br_code'); END IF;
  IF NEW.qr_code_image          IS DISTINCT FROM OLD.qr_code_image          THEN v_fields := v_fields || to_jsonb('qr_code_image'); END IF;
  IF NEW.correlation_id         IS DISTINCT FROM OLD.correlation_id         THEN v_fields := v_fields || to_jsonb('correlation_id'); END IF;
  IF NEW.expires_at             IS DISTINCT FROM OLD.expires_at             THEN v_fields := v_fields || to_jsonb('expires_at'); END IF;

  IF jsonb_array_length(v_fields) > 0 THEN
    -- Best-effort role label for investigators
    SELECT string_agg(role::text, ',') INTO v_role FROM public.user_roles WHERE user_id = auth.uid();

    INSERT INTO public.custom_orders_tamper_attempts
      (order_id, store_id, user_id, user_role, attempted_fields, old_values, new_values)
    VALUES
      (OLD.id, OLD.store_id, auth.uid(), COALESCE(v_role, 'anonymous'), v_fields, v_old, v_new);

    RAISE EXCEPTION 'Not allowed to modify protected fields on custom_orders';
  END IF;

  RETURN NEW;
END;
$function$;

-- =========================================================
-- 3) Convert legacy global 'admin' role to tenant-scoped 'creator'
--    - keeps existing per-tenant power via stores.created_by / store_admins
--    - preserves ceo/super_admin untouched
-- =========================================================
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT ur.user_id, 'creator'::app_role
FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id AND ur2.role = 'creator'
  );

DELETE FROM public.user_roles WHERE role = 'admin';
