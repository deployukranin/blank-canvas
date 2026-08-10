CREATE OR REPLACE FUNCTION public.profiles_protect_handle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.handle IS NOT NULL
       AND current_setting('app.setting_user_handle', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Handle must be set through set_user_handle';
    END IF;
  ELSIF NEW.handle IS DISTINCT FROM OLD.handle
     OR NEW.handle_set_at IS DISTINCT FROM OLD.handle_set_at THEN
    IF current_setting('app.setting_user_handle', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Handle cannot be changed directly';
    END IF;
    IF OLD.handle IS NOT NULL OR OLD.handle_set_at IS NOT NULL THEN
      RAISE EXCEPTION 'Handle is permanent and cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_protect_handle ON public.profiles;
CREATE TRIGGER trg_profiles_protect_handle
BEFORE INSERT OR UPDATE OF handle, handle_set_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_handle();

CREATE OR REPLACE FUNCTION public.set_user_handle(new_handle text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  current_user_id uuid;
  normalized_handle text;
  current_profile record;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  normalized_handle := lower(trim(COALESCE(new_handle, '')));

  IF length(normalized_handle) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve ter pelo menos 3 caracteres');
  END IF;

  IF length(normalized_handle) > 20 THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve ter no máximo 20 caracteres');
  END IF;

  IF normalized_handle !~ '^[a-z0-9_]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Handle deve conter apenas letras minúsculas, números e underscore');
  END IF;

  SELECT id, handle, handle_set_at
    INTO current_profile
  FROM public.profiles
  WHERE user_id = current_user_id
  FOR UPDATE;

  IF FOUND AND (current_profile.handle IS NOT NULL OR current_profile.handle_set_at IS NOT NULL) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Handle já foi definido e não pode ser alterado',
      'handle', current_profile.handle
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(handle) = normalized_handle AND user_id <> current_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Handle já está em uso');
  END IF;

  PERFORM set_config('app.setting_user_handle', 'on', true);

  INSERT INTO public.profiles (user_id, handle, handle_set_at)
  VALUES (current_user_id, normalized_handle, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    handle = EXCLUDED.handle,
    handle_set_at = EXCLUDED.handle_set_at,
    updated_at = now();

  RETURN json_build_object('success', true, 'handle', normalized_handle);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_user_handle(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_handle(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_handle(text) TO service_role;