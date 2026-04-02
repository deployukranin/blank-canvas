ALTER TABLE public.stores
ADD COLUMN custom_domain text DEFAULT NULL,
ADD COLUMN domain_verified boolean DEFAULT false,
ADD COLUMN domain_added_at timestamp with time zone DEFAULT NULL;