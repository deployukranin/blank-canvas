-- Drop the existing check constraint and add a new one that includes 'pending_payment'
ALTER TABLE public.vip_subscriptions DROP CONSTRAINT IF EXISTS vip_subscriptions_status_check;

ALTER TABLE public.vip_subscriptions ADD CONSTRAINT vip_subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'pending_payment'));