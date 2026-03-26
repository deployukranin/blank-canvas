
-- Add plan management columns to stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Allow super_admin to manage stores
CREATE POLICY "Super admins can manage stores"
  ON public.stores
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
