
-- Add read_at to support_messages for read receipts
ALTER TABLE public.support_messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add creator email/name to tickets for easy identification
ALTER TABLE public.support_tickets ADD COLUMN creator_email TEXT;
ALTER TABLE public.support_tickets ADD COLUMN store_name TEXT;
