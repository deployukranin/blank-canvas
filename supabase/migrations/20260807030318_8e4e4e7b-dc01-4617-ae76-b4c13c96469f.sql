CREATE TABLE public.drive_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  file_id text NOT NULL,
  name text,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL CHECK (kind IN ('vip','custom')),
  order_id uuid REFERENCES public.custom_orders(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX drive_files_file_id_key ON public.drive_files(file_id);
CREATE INDEX drive_files_store_idx ON public.drive_files(store_id);

GRANT SELECT ON public.drive_files TO authenticated;
GRANT ALL ON public.drive_files TO service_role;

ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store managers can view their drive files"
ON public.drive_files FOR SELECT TO authenticated
USING (public.is_store_manager(store_id));

ALTER TABLE public.custom_orders ADD COLUMN IF NOT EXISTS delivery_file_id text;