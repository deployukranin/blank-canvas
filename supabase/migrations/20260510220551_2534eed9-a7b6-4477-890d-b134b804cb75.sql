
-- RPC to allow a store owner to assign themselves the 'admin' role
CREATE OR REPLACE FUNCTION public.assign_creator_role(p_store_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Verify the caller actually created this store
  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND created_by = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Not the owner of this store');
  END IF;

  -- Idempotent
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', true, 'message', 'Role already assigned');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');

  RETURN json_build_object('success', true);
END;
$$;

-- Backfill: give the 'admin' role to every existing store owner missing it
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.created_by, 'admin'::app_role
FROM public.stores s
WHERE s.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = s.created_by AND ur.role = 'admin'
  );
