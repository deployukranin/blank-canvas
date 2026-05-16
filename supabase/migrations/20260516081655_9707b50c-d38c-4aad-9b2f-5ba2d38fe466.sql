
-- ─── store_affiliates ───
CREATE TABLE public.store_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id),
  UNIQUE (store_id, code),
  CHECK (status IN ('active','banned'))
);
CREATE INDEX idx_store_affiliates_user ON public.store_affiliates(user_id);
CREATE INDEX idx_store_affiliates_code ON public.store_affiliates(code);

-- ─── affiliate_commissions ───
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  affiliate_id uuid NOT NULL REFERENCES public.store_affiliates(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  base_amount_cents integer NOT NULL,
  commission_percent integer NOT NULL,
  commission_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  eligible_at timestamptz NOT NULL,
  paid_at timestamptz,
  paid_by_user_id uuid,
  payment_note text,
  cancel_reason text,
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id),
  CHECK (status IN ('pending','available','paid','cancelled')),
  CHECK (source_type IN ('custom_order','vip_subscription'))
);
CREATE INDEX idx_aff_commissions_store_status ON public.affiliate_commissions(store_id, status);
CREATE INDEX idx_aff_commissions_affiliate ON public.affiliate_commissions(affiliate_id, status);

-- ─── affiliate_payouts ───
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  affiliate_id uuid NOT NULL REFERENCES public.store_affiliates(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  paid_by_user_id uuid,
  note text,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('requested','paid','rejected'))
);
CREATE INDEX idx_aff_payouts_store ON public.affiliate_payouts(store_id, status);
CREATE INDEX idx_aff_payouts_affiliate ON public.affiliate_payouts(affiliate_id);

-- ─── Add affiliate_id to existing tables ───
ALTER TABLE public.custom_orders ADD COLUMN affiliate_id uuid;
ALTER TABLE public.vip_subscriptions ADD COLUMN affiliate_id uuid;

-- ─── generate_affiliate_code ───
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(p_store_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  LOOP
    v_code := upper(substring(md5(gen_random_uuid()::text || clock_timestamp()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.store_affiliates WHERE store_id = p_store_id AND code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN RAISE EXCEPTION 'Could not generate unique affiliate code'; END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

-- ─── default code trigger ───
CREATE OR REPLACE FUNCTION public.store_affiliates_defaults()
RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_affiliate_code(NEW.store_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_store_affiliates_defaults
BEFORE INSERT ON public.store_affiliates
FOR EACH ROW EXECUTE FUNCTION public.store_affiliates_defaults();

CREATE TRIGGER trg_store_affiliates_updated
BEFORE UPDATE ON public.store_affiliates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_affiliate_commissions_updated
BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_affiliate_payouts_updated
BEFORE UPDATE ON public.affiliate_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── commission auto-create on custom_order paid ───
CREATE OR REPLACE FUNCTION public.affiliate_commission_from_order()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_cfg jsonb;
  v_enabled boolean;
  v_percent int;
  v_hold int;
  v_commission_cents int;
  v_aff_user uuid;
BEGIN
  -- Only act when transitioning to paid (and we have an affiliate)
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF OLD.status = 'paid' THEN RETURN NEW; END IF;
  IF NEW.affiliate_id IS NULL OR NEW.store_id IS NULL THEN RETURN NEW; END IF;

  -- Skip vip_subscription rows (handled by vip_subscriptions trigger)
  IF NEW.product_type = 'vip_subscription' THEN RETURN NEW; END IF;

  -- Block self-purchase
  SELECT user_id INTO v_aff_user FROM public.store_affiliates WHERE id = NEW.affiliate_id;
  IF v_aff_user = NEW.user_id THEN RETURN NEW; END IF;

  SELECT config_value INTO v_cfg FROM public.app_configurations
   WHERE store_id = NEW.store_id AND config_key = 'affiliate_config' LIMIT 1;
  IF v_cfg IS NULL THEN RETURN NEW; END IF;

  v_enabled := COALESCE((v_cfg->>'enabled')::boolean, false);
  IF NOT v_enabled THEN RETURN NEW; END IF;

  v_percent := COALESCE((v_cfg->>'commission_percent')::int, 0);
  v_hold := COALESCE((v_cfg->>'holding_days')::int, 14);
  IF v_percent <= 0 THEN RETURN NEW; END IF;

  v_commission_cents := GREATEST(0, (NEW.amount_cents * v_percent) / 100);
  IF v_commission_cents <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.affiliate_commissions
    (store_id, affiliate_id, source_type, source_id, base_amount_cents,
     commission_percent, commission_cents, status, eligible_at)
  VALUES
    (NEW.store_id, NEW.affiliate_id, 'custom_order', NEW.id, NEW.amount_cents,
     v_percent, v_commission_cents, 'pending',
     COALESCE(NEW.paid_at, now()) + make_interval(days => v_hold))
  ON CONFLICT (source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_commission_from_order
AFTER UPDATE OF status ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.affiliate_commission_from_order();

-- Cancel commission if order is refunded/cancelled
CREATE OR REPLACE FUNCTION public.affiliate_commission_cancel_on_refund()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.status IN ('refunded','cancelled') AND OLD.status <> NEW.status THEN
    UPDATE public.affiliate_commissions
       SET status = 'cancelled',
           cancel_reason = COALESCE(cancel_reason, 'Order ' || NEW.status),
           updated_at = now()
     WHERE source_type = 'custom_order' AND source_id = NEW.id
       AND status IN ('pending','available');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_affiliate_commission_cancel_order
AFTER UPDATE OF status ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.affiliate_commission_cancel_on_refund();

-- VIP subscription → commission on activation
CREATE OR REPLACE FUNCTION public.affiliate_commission_from_vip()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_cfg jsonb; v_enabled boolean; v_percent int; v_hold int;
  v_commission_cents int; v_aff_user uuid;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF OLD.status = 'active' THEN RETURN NEW; END IF;
  IF NEW.affiliate_id IS NULL OR NEW.store_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_aff_user FROM public.store_affiliates WHERE id = NEW.affiliate_id;
  IF v_aff_user = NEW.user_id THEN RETURN NEW; END IF;

  SELECT config_value INTO v_cfg FROM public.app_configurations
   WHERE store_id = NEW.store_id AND config_key = 'affiliate_config' LIMIT 1;
  IF v_cfg IS NULL THEN RETURN NEW; END IF;
  v_enabled := COALESCE((v_cfg->>'enabled')::boolean, false);
  IF NOT v_enabled THEN RETURN NEW; END IF;
  v_percent := COALESCE((v_cfg->>'commission_percent')::int, 0);
  v_hold := COALESCE((v_cfg->>'holding_days')::int, 14);
  IF v_percent <= 0 THEN RETURN NEW; END IF;

  v_commission_cents := GREATEST(0, (NEW.price_cents * v_percent) / 100);
  IF v_commission_cents <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.affiliate_commissions
    (store_id, affiliate_id, source_type, source_id, base_amount_cents,
     commission_percent, commission_cents, status, eligible_at)
  VALUES
    (NEW.store_id, NEW.affiliate_id, 'vip_subscription', NEW.id, NEW.price_cents,
     v_percent, v_commission_cents, 'pending',
     COALESCE(NEW.started_at, now()) + make_interval(days => v_hold))
  ON CONFLICT (source_type, source_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_affiliate_commission_from_vip
AFTER UPDATE OF status ON public.vip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.affiliate_commission_from_vip();

-- ─── mark eligible cron function ───
CREATE OR REPLACE FUNCTION public.affiliate_mark_eligible()
RETURNS integer LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_count int;
BEGIN
  WITH upd AS (
    UPDATE public.affiliate_commissions
       SET status = 'available', updated_at = now()
     WHERE status = 'pending' AND eligible_at <= now()
     RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

-- ─── RLS ───
ALTER TABLE public.store_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- store_affiliates policies
CREATE POLICY "Deny anon affiliates" ON public.store_affiliates
  AS PERMISSIVE FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "User views own affiliate row" ON public.store_affiliates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User creates own affiliate row" ON public.store_affiliates
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.store_users su
       WHERE su.user_id = auth.uid() AND su.store_id = store_affiliates.store_id
         AND su.banned_at IS NULL
    )
  );

CREATE POLICY "Store owner manages affiliates" ON public.store_affiliates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
     WHERE s.id = store_affiliates.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()
       ))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
     WHERE s.id = store_affiliates.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()
       ))
  ));

CREATE POLICY "Super admins manage affiliates" ON public.store_affiliates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- affiliate_commissions policies
CREATE POLICY "Deny anon commissions" ON public.affiliate_commissions
  AS PERMISSIVE FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Affiliate views own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.store_affiliates sa
              WHERE sa.id = affiliate_commissions.affiliate_id AND sa.user_id = auth.uid())
  );

CREATE POLICY "Store owner manages commissions" ON public.affiliate_commissions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = affiliate_commissions.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = affiliate_commissions.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
  ));

CREATE POLICY "Super admins manage commissions" ON public.affiliate_commissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- affiliate_payouts policies
CREATE POLICY "Deny anon payouts" ON public.affiliate_payouts
  AS PERMISSIVE FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Affiliate views own payouts" ON public.affiliate_payouts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.store_affiliates sa
              WHERE sa.id = affiliate_payouts.affiliate_id AND sa.user_id = auth.uid())
  );

CREATE POLICY "Affiliate creates own payout" ON public.affiliate_payouts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_affiliates sa
              WHERE sa.id = affiliate_payouts.affiliate_id AND sa.user_id = auth.uid()
                AND sa.status = 'active')
  );

CREATE POLICY "Store owner manages payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = affiliate_payouts.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = affiliate_payouts.store_id
       AND (s.created_by = auth.uid() OR EXISTS (
         SELECT 1 FROM public.store_admins sa
          WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
  ));

CREATE POLICY "Super admins manage payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
