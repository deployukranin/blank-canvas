
-- Add slug column to stores for unique store URLs
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create store_users table to link users to specific stores
CREATE TABLE public.store_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one user per store
ALTER TABLE public.store_users ADD CONSTRAINT store_users_store_user_unique UNIQUE (store_id, user_id);

-- Enable RLS
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own store memberships
CREATE POLICY "Users can view own memberships"
ON public.store_users FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own membership (during registration)
CREATE POLICY "Users can register to stores"
ON public.store_users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins/CEOs can view all memberships
CREATE POLICY "Admins can view all memberships"
ON public.store_users FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ceo'::app_role));

-- CEOs can manage all memberships
CREATE POLICY "CEOs can manage memberships"
ON public.store_users FOR ALL TO authenticated
USING (has_role(auth.uid(), 'ceo'::app_role))
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

-- Deny anonymous access
CREATE POLICY "Deny anon access store_users"
ON public.store_users FOR ALL TO anon
USING (false)
WITH CHECK (false);
