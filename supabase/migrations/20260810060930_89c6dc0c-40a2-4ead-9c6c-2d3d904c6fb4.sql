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
    SELECT 1
    FROM public.profiles
    WHERE lower(handle) = normalized_handle
      AND user_id <> current_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Handle já está em uso');
  END IF;

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