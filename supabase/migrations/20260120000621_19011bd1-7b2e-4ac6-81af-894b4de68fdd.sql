-- Create helper function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table with unique handle
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  handle_set_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile, but handle can only be set once
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (handle_set_at IS NULL OR handle = (SELECT handle FROM public.profiles WHERE id = auth.uid()))
  );

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to validate and set handle
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
$$ LANGUAGE plpgsql SECURITY DEFINER;