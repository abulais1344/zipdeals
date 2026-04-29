-- ============================================================
-- Seller Dashboard Migration
-- Add sellers table for seller authentication and profile
-- Using username/password authentication (bcrypt)
-- ============================================================

-- Create sellers table
CREATE TABLE IF NOT EXISTS public.sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  seller_name     TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  city            TEXT,
  taluka          TEXT,
  bio             TEXT,
  verified_at     TIMESTAMPTZ,
  total_listings  INTEGER NOT NULL DEFAULT 0,
  active_listings INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(2,1),
  rating_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_username ON public.sellers(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_email_unique ON public.sellers ((lower(email))) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sellers_created_at ON public.sellers(created_at DESC);

-- Link products to sellers for durable ownership mapping.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_profile_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

UPDATE public.products p
SET seller_profile_id = s.id
FROM public.sellers s
WHERE p.seller_profile_id IS NULL
  AND p.seller_phone = s.phone;

CREATE INDEX IF NOT EXISTS idx_products_seller_profile_id ON public.products(seller_profile_id);

-- Create seller_sessions table for session management
CREATE TABLE IF NOT EXISTS public.seller_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  session_token   TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_seller_sessions_seller_id ON public.seller_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_sessions_token ON public.seller_sessions(session_token);

-- Create seller_reviews table for seller ratings
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_phone     TEXT NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON public.seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_product_id ON public.seller_reviews(product_id);

-- Enable RLS on sellers table
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sellers (public can view verified seller profiles)
DROP POLICY IF EXISTS "Public can view verified seller profiles" ON public.sellers;
CREATE POLICY "Public can view verified seller profiles" ON public.sellers FOR SELECT USING (verified_at IS NOT NULL);

-- RLS Policies for reviews (public can view)
DROP POLICY IF EXISTS "Public can view seller reviews" ON public.seller_reviews;
CREATE POLICY "Public can view seller reviews" ON public.seller_reviews FOR SELECT USING (true);

-- RPC: Verify seller credentials and return seller info
CREATE OR REPLACE FUNCTION public.verify_seller_credentials(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  seller_id UUID,
  seller_name TEXT,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.seller_name,
    s.username
  FROM public.sellers s
  WHERE s.username = p_username
    AND s.password_hash = crypt(p_password, s.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get seller's listings with stats
CREATE OR REPLACE FUNCTION public.get_seller_listings(p_seller_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  status TEXT,
  views_count INTEGER,
  whatsapp_clicks INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.status,
    p.views_count,
    p.whatsapp_clicks,
    p.image_urls[1],
    p.created_at
  FROM public.products p
  WHERE p.seller_phone = (SELECT phone FROM public.sellers WHERE id = p_seller_id)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
