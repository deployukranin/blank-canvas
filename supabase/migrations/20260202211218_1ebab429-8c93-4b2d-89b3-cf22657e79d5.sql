-- Create VIP subscriptions table
CREATE TABLE public.vip_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly')),
  price_cents INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, status) -- Only one active subscription per user
);

-- Enable Row Level Security
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own VIP subscriptions"
ON public.vip_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create their own VIP subscriptions"
ON public.vip_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (e.g., cancel)
CREATE POLICY "Users can update their own VIP subscriptions"
ON public.vip_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create VIP content table for exclusive posts/content
CREATE TABLE public.vip_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'video', 'audio', 'image')),
  media_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for VIP content
ALTER TABLE public.vip_content ENABLE ROW LEVEL SECURITY;

-- Only VIP users can view VIP content
CREATE POLICY "VIP users can view VIP content"
ON public.vip_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND expires_at > now()
  )
);

-- Admins can manage VIP content
CREATE POLICY "Admins can manage VIP content"
ON public.vip_content
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

-- Function to check if user has active VIP
CREATE OR REPLACE FUNCTION public.is_vip(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = check_user_id
    AND status = 'active'
    AND expires_at > now()
  )
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_vip_subscriptions_updated_at
BEFORE UPDATE ON public.vip_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vip_content_updated_at
BEFORE UPDATE ON public.vip_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();