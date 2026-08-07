CREATE TABLE public.youtube_channel_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  channel_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.youtube_channel_changes TO authenticated;
GRANT ALL ON public.youtube_channel_changes TO service_role;

ALTER TABLE public.youtube_channel_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store managers view channel changes"
ON public.youtube_channel_changes
FOR SELECT
TO authenticated
USING (public.is_store_manager(store_id) OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ycc_store_created ON public.youtube_channel_changes (store_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_youtube_channel_change(p_store_id uuid, p_channel_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_count int;
  v_oldest timestamptz;
  v_limit int := 3;
  v_window interval := interval '14 days';
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  IF p_store_id IS NULL OR coalesce(trim(p_channel_id), '') = '' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid input');
  END IF;
  IF NOT public.is_store_manager(p_store_id) THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  SELECT count(*), min(created_at) INTO v_count, v_oldest
  FROM public.youtube_channel_changes
  WHERE store_id = p_store_id AND created_at > now() - v_window;

  IF v_count >= v_limit THEN
    RETURN json_build_object(
      'success', false,
      'error', 'limit_reached',
      'used', v_count,
      'limit', v_limit,
      'next_available_at', to_char((v_oldest + v_window) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
  END IF;

  INSERT INTO public.youtube_channel_changes (store_id, user_id, channel_id)
  VALUES (p_store_id, auth.uid(), trim(p_channel_id));

  RETURN json_build_object('success', true, 'used', v_count + 1, 'limit', v_limit, 'remaining', v_limit - (v_count + 1));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_youtube_channel_change_status(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_count int;
  v_oldest timestamptz;
  v_limit int := 3;
  v_window interval := interval '14 days';
BEGIN
  IF p_store_id IS NULL OR NOT public.is_store_manager(p_store_id) THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden');
  END IF;

  SELECT count(*), min(created_at) INTO v_count, v_oldest
  FROM public.youtube_channel_changes
  WHERE store_id = p_store_id AND created_at > now() - v_window;

  RETURN json_build_object(
    'success', true,
    'used', v_count,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_count),
    'next_available_at', CASE WHEN v_count >= v_limit
      THEN to_char((v_oldest + v_window) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END
  );
END;
$$;