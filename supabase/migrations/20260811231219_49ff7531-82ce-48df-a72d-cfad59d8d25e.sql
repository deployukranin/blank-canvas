CREATE OR REPLACE FUNCTION public.get_store_currency(p_store_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN upper(coalesce(ac.config_value->>'currency', 'BRL')) = 'USD' THEN 'USD'
    ELSE 'BRL'
  END
  FROM public.app_configurations ac
  WHERE ac.store_id = p_store_id
    AND ac.config_key = 'payment_config'
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_store_currency(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_currency(uuid) TO anon, authenticated, service_role;