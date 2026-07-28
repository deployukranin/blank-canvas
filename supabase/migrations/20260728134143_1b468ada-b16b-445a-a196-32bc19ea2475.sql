
DO $$
DECLARE
  maria_id uuid := '1b6c08f0-e89e-42e6-a0e3-94e7480a12cc';
  max_id   uuid := 'dccd2077-ba17-4b41-8a2f-49e67bae4b72';
  store_lucia uuid := 'dd656d0e-e8d7-42c2-aee7-50022067b6ce';
BEGIN
  -- Remove dados da loja da Maria
  DELETE FROM public.store_admins    WHERE store_id = store_lucia;
  DELETE FROM public.store_users     WHERE store_id = store_lucia;
  DELETE FROM public.invite_codes    WHERE store_id = store_lucia;
  DELETE FROM public.app_configurations WHERE store_id = store_lucia;
  DELETE FROM public.custom_orders   WHERE store_id = store_lucia;
  DELETE FROM public.video_ideas     WHERE store_id = store_lucia;
  DELETE FROM public.video_chat_messages WHERE store_id = store_lucia;
  DELETE FROM public.stores          WHERE id = store_lucia;

  -- Limpar roles/associações que possam bloquear a deleção
  DELETE FROM public.user_roles      WHERE user_id IN (maria_id, max_id);
  DELETE FROM public.store_admins    WHERE user_id IN (maria_id, max_id);
  DELETE FROM public.store_users     WHERE user_id IN (maria_id, max_id);
  DELETE FROM public.profiles        WHERE user_id IN (maria_id, max_id);

  -- Remover os usuários do auth
  DELETE FROM auth.users WHERE id IN (maria_id, max_id);
END $$;
