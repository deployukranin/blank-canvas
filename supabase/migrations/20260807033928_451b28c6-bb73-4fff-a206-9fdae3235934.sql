REVOKE EXECUTE ON FUNCTION public.get_store_storage_quota(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_store_storage_quota(uuid) TO authenticated, service_role;