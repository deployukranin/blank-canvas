
CREATE OR REPLACE FUNCTION public.generate_referral_code()
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
    SELECT EXISTS (SELECT 1 FROM public.stores WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.stores WHERE referral_code IS NULL LOOP
    UPDATE public.stores SET referral_code = public.generate_referral_code() WHERE id = r.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.stores_referral_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  IF NEW.referred_by_store_id IS NOT NULL AND NEW.referred_by_store_id = NEW.id THEN
    NEW.referred_by_store_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stores_referral_defaults ON public.stores;
CREATE TRIGGER trg_stores_referral_defaults
  BEFORE INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.stores_referral_defaults();

CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  referred_store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  base_amount_cents integer NOT NULL CHECK (base_amount_cents >= 0),
  commission_cents integer NOT NULL CHECK (commission_cents >= 0),
  commission_percent integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','available','paid','cancelled')),
  eligible_at timestamptz NOT NULL,
  paid_at timestamptz,
  paid_by_user_id uuid,
  payment_note text,
  cancel_reason text,
  triggered_by_payment_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referrer_store_id <> referred_store_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON public.referral_commissions(referrer_store_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON public.referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_eligible_at ON public.referral_commissions(eligible_at);

DROP TRIGGER IF EXISTS update_referral_commissions_updated_at ON public.referral_commissions;
CREATE TRIGGER update_referral_commissions_updated_at
  BEFORE UPDATE ON public.referral_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view own referral commissions" ON public.referral_commissions;
CREATE POLICY "Owners view own referral commissions"
  ON public.referral_commissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = referral_commissions.referrer_store_id
        AND (s.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.store_admins sa WHERE sa.store_id = s.id AND sa.user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Super admins manage referral commissions" ON public.referral_commissions;
CREATE POLICY "Super admins manage referral commissions"
  ON public.referral_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Deny anon referral commissions" ON public.referral_commissions;
CREATE POLICY "Deny anon referral commissions"
  ON public.referral_commissions FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.mark_eligible_commissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_count integer;
BEGIN
  WITH upd AS (
    UPDATE public.referral_commissions rc
    SET status = 'available', updated_at = now()
    WHERE rc.status = 'pending'
      AND rc.eligible_at <= now()
      AND EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = rc.referred_store_id
          AND s.status = 'active'
          AND s.plan_type <> 'trial'
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;
