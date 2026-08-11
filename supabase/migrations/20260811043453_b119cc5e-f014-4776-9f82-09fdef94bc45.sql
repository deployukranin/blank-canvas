REVOKE EXECUTE ON FUNCTION public.use_invite_code(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_invite_code(text) TO authenticated, service_role;