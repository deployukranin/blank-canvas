
-- Add store_id to custom_orders
ALTER TABLE public.custom_orders
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add store_id to video_ideas
ALTER TABLE public.video_ideas
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add store_id to app_configurations
ALTER TABLE public.app_configurations
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add store_id to invite_codes
ALTER TABLE public.invite_codes
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add store_id to video_chat_messages
ALTER TABLE public.video_chat_messages
  ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_custom_orders_store_id ON public.custom_orders(store_id);
CREATE INDEX idx_video_ideas_store_id ON public.video_ideas(store_id);
CREATE INDEX idx_app_configurations_store_id ON public.app_configurations(store_id);
CREATE INDEX idx_invite_codes_store_id ON public.invite_codes(store_id);
CREATE INDEX idx_video_chat_messages_store_id ON public.video_chat_messages(store_id);

-- Add unique constraint for store-scoped config keys
CREATE UNIQUE INDEX idx_app_configurations_store_key ON public.app_configurations(store_id, config_key) WHERE store_id IS NOT NULL;
