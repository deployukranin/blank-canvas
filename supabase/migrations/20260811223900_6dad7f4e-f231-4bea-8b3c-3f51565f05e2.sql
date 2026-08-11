CREATE OR REPLACE FUNCTION public.admin_mark_email_verified(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.setting_email_verification', 'on', true);
  UPDATE public.profiles
     SET email_verified_at = COALESCE(email_verified_at, now()),
         updated_at = now()
   WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, email_verified_at)
    VALUES (p_user_id, now());
  END IF;
  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_email_verified(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_email_verified(uuid) TO service_role;

-- backfill user whose token was consumed but profile never updated
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT t.user_id FROM public.email_verification_tokens t
           JOIN public.profiles p ON p.user_id = t.user_id
           WHERE t.used_at IS NOT NULL AND p.email_verified_at IS NULL
  LOOP
    PERFORM public.admin_mark_email_verified(r.user_id);
  END LOOP;
END $$;