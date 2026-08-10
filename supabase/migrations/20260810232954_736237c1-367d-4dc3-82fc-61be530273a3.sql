ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamptz;

-- Prevent users from setting verification fields directly
CREATE OR REPLACE FUNCTION public.profiles_protect_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF current_setting('app.setting_email_verification', true) IS DISTINCT FROM 'on' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.email_verified_at := NULL;
      NEW.email_verification_sent_at := NULL;
    ELSE
      NEW.email_verified_at := OLD.email_verified_at;
      NEW.email_verification_sent_at := OLD.email_verification_sent_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_verification ON public.profiles;
CREATE TRIGGER trg_profiles_protect_verification
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_verification();

-- Mark current user's email as verified
CREATE OR REPLACE FUNCTION public.mark_email_verified()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  PERFORM set_config('app.setting_email_verification', 'on', true);

  INSERT INTO public.profiles (user_id, email_verified_at)
  VALUES (v_user, now())
  ON CONFLICT (user_id) DO UPDATE
    SET email_verified_at = COALESCE(public.profiles.email_verified_at, now()),
        updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

-- Record that a verification email was sent
CREATE OR REPLACE FUNCTION public.mark_email_verification_sent()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_last timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT email_verification_sent_at INTO v_last FROM public.profiles WHERE user_id = v_user;

  IF v_last IS NOT NULL AND v_last > now() - interval '60 seconds' THEN
    RETURN json_build_object('success', false, 'error', 'cooldown');
  END IF;

  PERFORM set_config('app.setting_email_verification', 'on', true);

  INSERT INTO public.profiles (user_id, email_verification_sent_at)
  VALUES (v_user, now())
  ON CONFLICT (user_id) DO UPDATE
    SET email_verification_sent_at = now(),
        updated_at = now();

  RETURN json_build_object('success', true);
END;
$$;

-- Status helper for the current user
CREATE OR REPLACE FUNCTION public.get_email_verification_status()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_verified timestamptz;
  v_sent timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN json_build_object('authenticated', false, 'verified', false);
  END IF;

  SELECT email_verified_at, email_verification_sent_at
    INTO v_verified, v_sent
  FROM public.profiles WHERE user_id = v_user;

  RETURN json_build_object(
    'authenticated', true,
    'verified', v_verified IS NOT NULL,
    'verified_at', v_verified,
    'sent_at', v_sent
  );
END;
$$;

-- Backfill: users already confirmed in auth are considered verified
DO $$
BEGIN
  PERFORM set_config('app.setting_email_verification', 'on', true);
  UPDATE public.profiles p
     SET email_verified_at = u.email_confirmed_at
    FROM auth.users u
   WHERE u.id = p.user_id
     AND p.email_verified_at IS NULL
     AND u.email_confirmed_at IS NOT NULL;
END $$;