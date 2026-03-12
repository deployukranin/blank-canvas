-- Add new columns to stores table
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Update existing stores: set username = slug where slug exists
UPDATE public.stores SET username = slug WHERE slug IS NOT NULL AND username IS NULL;

-- Allow public (unauthenticated) read access to active stores for subdomain resolution
CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
TO anon
USING (status = 'active');