
-- 1. Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS: CEO can manage all stores
CREATE POLICY "CEO can manage stores" ON public.stores
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- RLS: Admin can view stores
CREATE POLICY "Admin can view stores" ON public.stores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Authenticated users can view active stores
CREATE POLICY "Users can view active stores" ON public.stores
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Updated_at trigger
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create youtube_api_usage table for real quota tracking
CREATE TABLE public.youtube_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  units_used integer NOT NULL DEFAULT 0,
  endpoint text NOT NULL DEFAULT 'playlistItems',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_api_usage ENABLE ROW LEVEL SECURITY;

-- Only service role can write (edge function), CEO/admin can read
CREATE POLICY "Service role only write" ON public.youtube_api_usage
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Admin can view usage" ON public.youtube_api_usage
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));
