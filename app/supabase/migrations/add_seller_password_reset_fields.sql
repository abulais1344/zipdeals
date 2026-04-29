-- Add fields required for email-based seller password reset
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- Keep email optional, but unique when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_email_unique
ON public.sellers ((lower(email)))
WHERE email IS NOT NULL;
