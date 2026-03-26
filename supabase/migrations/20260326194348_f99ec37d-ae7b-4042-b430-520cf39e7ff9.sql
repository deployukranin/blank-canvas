-- Add unique constraint on store_users for upsert support
ALTER TABLE public.store_users ADD CONSTRAINT store_users_store_id_user_id_key UNIQUE (store_id, user_id);