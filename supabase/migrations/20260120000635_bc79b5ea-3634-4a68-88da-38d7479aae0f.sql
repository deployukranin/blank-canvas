-- Fix search_path for security definer functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_user_handle(new_handle TEXT)
RETURNS JSON AS $$
DECLARE
  profile_record RECORD;
  cleaned_handle TEXT;
BEGIN
  -- Clean and validate handle
  cleaned_handle := LOWER(TRIM(new_handle));
  
  -- Check length
  IF LENGTH(cleaned_handle) < 3 OR LENGTH(cleaned_handle) > 20 THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve ter entre 3 e 20 caracteres');
  END IF;
  
  -- Check format (only lowercase letters, numbers, underscore)
  IF cleaned_handle !~ '^[a-z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Handle pode conter apenas letras minúsculas, números e underscore (_)');
  END IF;
  
  -- Get current profile
  SELECT * INTO profile_record FROM public.profiles WHERE id = auth.uid();
  
  -- Check if handle already set
  IF profile_record.handle_set_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Você já escolheu seu @ e não pode alterá-lo');
  END IF;
  
  -- Check if handle is taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = cleaned_handle AND id != auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Este @ já está em uso');
  END IF;
  
  -- Update handle
  UPDATE public.profiles 
  SET handle = cleaned_handle, handle_set_at = now()
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'handle', cleaned_handle);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;