
-- ============================================
-- FASE 1.1: VIP Subscriptions — Remove dangerous client INSERT/UPDATE
-- ============================================
DROP POLICY IF EXISTS "Users can create their own VIP subscriptions" ON public.vip_subscriptions;
DROP POLICY IF EXISTS "Users can update their own VIP subscriptions" ON public.vip_subscriptions;

-- Create SECURITY DEFINER function for safe VIP subscription creation
CREATE OR REPLACE FUNCTION public.create_vip_subscription(
  p_store_id uuid,
  p_plan_type text DEFAULT 'monthly',
  p_price_cents integer DEFAULT 0,
  p_payment_ref text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_sub_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF p_store_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'store_id required');
  END IF;
  
  IF p_price_cents < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid price');
  END IF;
  
  -- Check user is member of the store
  IF NOT EXISTS (SELECT 1 FROM public.store_users WHERE user_id = v_user_id AND store_id = p_store_id AND banned_at IS NULL) THEN
    RETURN json_build_object('success', false, 'error', 'Not a member of this store');
  END IF;
  
  -- Check no existing active subscription for this store
  IF EXISTS (SELECT 1 FROM public.vip_subscriptions WHERE user_id = v_user_id AND store_id = p_store_id AND status = 'active' AND expires_at > now()) THEN
    RETURN json_build_object('success', false, 'error', 'Already has active subscription');
  END IF;
  
  INSERT INTO public.vip_subscriptions (user_id, store_id, plan_type, price_cents, status, started_at, expires_at)
  VALUES (v_user_id, p_store_id, p_plan_type, p_price_cents, 'active', now(), now() + interval '30 days')
  RETURNING id INTO v_sub_id;
  
  RETURN json_build_object('success', true, 'subscription_id', v_sub_id);
END;
$$;

-- ============================================
-- FASE 1.2: Remove self-assign client role
-- ============================================
DROP POLICY IF EXISTS "Users can assign own client role" ON public.user_roles;

-- Create SECURITY DEFINER function for safe client role assignment
CREATE OR REPLACE FUNCTION public.assign_client_role(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Verify user is registered in this store
  IF NOT EXISTS (SELECT 1 FROM public.store_users WHERE user_id = v_user_id AND store_id = p_store_id) THEN
    RETURN json_build_object('success', false, 'error', 'Not registered in this store');
  END IF;
  
  -- Check if already has client role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'client') THEN
    RETURN json_build_object('success', true, 'message', 'Role already assigned');
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'client');
  
  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- FASE 1.3: Restrict app_configurations SELECT for authenticated
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read configurations" ON public.app_configurations;

CREATE POLICY "Authenticated users can read scoped configurations"
ON public.app_configurations
FOR SELECT
TO authenticated
USING (
  store_id IS NULL
  OR store_id IN (SELECT su.store_id FROM public.store_users su WHERE su.user_id = auth.uid())
  OR store_id IN (SELECT sa.store_id FROM public.store_admins sa WHERE sa.user_id = auth.uid())
  OR store_id IN (SELECT s.id FROM public.stores s WHERE s.created_by = auth.uid())
);

-- ============================================
-- FASE 1.5: Stores public view (hides stripe_account_id)
-- ============================================
CREATE OR REPLACE VIEW public.stores_public AS
SELECT 
  id, name, slug, description, avatar_url, banner_url,
  status, plan_type, plan_expires_at, custom_domain, domain_verified,
  url, username, created_at, updated_at, created_by, onboarding_completed
FROM public.stores;

-- Grant access to the view
GRANT SELECT ON public.stores_public TO anon;
GRANT SELECT ON public.stores_public TO authenticated;

-- ============================================
-- FASE 5: Audit Logs table
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  target_table text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- No direct inserts from clients
CREATE POLICY "No direct client access"
ON public.audit_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Block authenticated direct INSERT (force use of function)
CREATE POLICY "No direct authenticated insert"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

-- SECURITY DEFINER function to log audit events (used by edge functions and triggers)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_action text,
  p_target_table text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, target_table, target_id, metadata)
  VALUES (p_user_id, p_action, p_target_table, p_target_id, p_metadata);
END;
$$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
