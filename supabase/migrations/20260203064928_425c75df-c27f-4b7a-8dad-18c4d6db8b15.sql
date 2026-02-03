-- =====================================================
-- Security Fix: Hash default admin credentials with bcrypt
-- This migration replaces the insecure default plaintext passwords
-- with properly hashed values using pgcrypto's crypt function
-- =====================================================

-- Enable pgcrypto if not already enabled (for crypt function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generate secure bcrypt hashes for the default credentials
-- These are strong random passwords that MUST be changed via the CEO dashboard
UPDATE public.admin_credentials 
SET password_hash = crypt('admin_secure_' || gen_random_uuid()::text, gen_salt('bf', 10)),
    updated_at = now()
WHERE role = 'admin' AND password_hash = 'admin123';

UPDATE public.admin_credentials 
SET password_hash = crypt('ceo_secure_' || gen_random_uuid()::text, gen_salt('bf', 10)),
    updated_at = now()
WHERE role = 'ceo' AND password_hash = 'ceo123';

-- Also update any plaintext passwords that may have been set
-- (passwords not starting with $2 are plaintext)
UPDATE public.admin_credentials 
SET password_hash = crypt(password_hash, gen_salt('bf', 10)),
    updated_at = now()
WHERE password_hash NOT LIKE '$2%';

-- Add a comment to remind about password reset
COMMENT ON TABLE public.admin_credentials IS 'Admin credentials table. IMPORTANT: Default passwords have been reset for security. Use the CEO dashboard to set new passwords.';