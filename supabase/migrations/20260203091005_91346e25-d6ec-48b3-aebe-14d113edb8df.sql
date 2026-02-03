-- Create table for app configurations
CREATE TABLE public.app_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_configurations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read configurations (public app settings)
CREATE POLICY "Anyone can read configurations" 
ON public.app_configurations 
FOR SELECT 
USING (true);

-- Only authenticated users with admin/ceo role can modify
CREATE POLICY "Admins can manage configurations" 
ON public.app_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ceo')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_configurations_updated_at
BEFORE UPDATE ON public.app_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();