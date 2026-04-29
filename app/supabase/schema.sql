-- ============================================================
-- ZipDeals Database Schema — Phase 1 MVP
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_profile_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price > 0),
  original_price  NUMERIC(10,2) NOT NULL CHECK (original_price > 0),
  discount_pct    NUMERIC(5,2) GENERATED ALWAYS AS (
                    ROUND((1 - price / NULLIF(original_price, 0)) * 100, 2)
                  ) STORED,
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  seller_name     TEXT NOT NULL,
  seller_phone    TEXT NOT NULL,
  city            TEXT NOT NULL,
  taluka          TEXT,
  category        TEXT NOT NULL,
  is_bulk         BOOLEAN NOT NULL DEFAULT FALSE,
  min_order_qty   INTEGER CHECK (min_order_qty IS NULL OR min_order_qty > 0),
  bulk_price      NUMERIC(10,2) CHECK (bulk_price IS NULL OR bulk_price > 0),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'sold', 'expired', 'rejected')),
  sold_token      UUID NOT NULL DEFAULT gen_random_uuid(),
  views_count     INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT price_less_than_original CHECK (price < original_price)
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes for common query patterns
CREATE INDEX idx_products_status         ON public.products(status);
CREATE INDEX idx_products_city_category  ON public.products(city, category);
CREATE INDEX idx_products_seller_id      ON public.products(seller_id);
CREATE INDEX idx_products_seller_profile_id ON public.products(seller_profile_id);
CREATE INDEX idx_products_expires_at     ON public.products(expires_at) WHERE status = 'active';
CREATE INDEX idx_products_created_at     ON public.products(created_at DESC);

-- ============================================================
-- EVENTS TABLE (analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('view', 'whatsapp_click', 'report', 'seller_profile_click')),
  city        TEXT,
  event_context JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_product_id  ON public.events(product_id);
CREATE INDEX idx_events_type        ON public.events(event_type);
CREATE INDEX idx_events_created_at  ON public.events(created_at DESC);

-- ============================================================
-- REPORTS TABLE (abuse)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_product_id ON public.reports(product_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_admin_credentials(p_login_id TEXT, p_password TEXT)
RETURNS TABLE(admin_id UUID, login_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.login_id
  FROM public.admin_users au
  WHERE au.login_id = p_login_id
    AND au.password_hash = crypt(p_password, au.password_hash)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed your first admin user manually, example:
-- INSERT INTO public.admin_users (login_id, password_hash)
-- VALUES ('admin', crypt('change-this-password', gen_salt('bf')))
-- ON CONFLICT (login_id) DO NOTHING;

-- Products: anonymous users can only read active listings
CREATE POLICY "Public can view active listings"
  ON public.products FOR SELECT
  USING (status = 'active');

-- Products: authenticated sellers can read their own listings (any status)
CREATE POLICY "Sellers can view own listings"
  ON public.products FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Products: direct INSERT via anon/client is blocked; all inserts go through service-role API route
DROP POLICY IF EXISTS "Anyone can submit pending listings" ON public.products;

-- Products: sellers can update their own listings (e.g. mark as sold)
CREATE POLICY "Sellers can update own listings"
  ON public.products FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Events: anyone can insert (view/click tracking)
CREATE POLICY "Anyone can insert events"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- Reports: anyone can insert
CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- RPC: increment counters atomically
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_view(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products SET views_count = views_count + 1 WHERE id = product_uuid AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_whatsapp_click(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = product_uuid AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: mark listing as sold via token (no auth required)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_listing_sold(token UUID)
RETURNS TEXT AS $$
DECLARE
  updated_id UUID;
BEGIN
  UPDATE public.products
  SET status = 'sold'
  WHERE sold_token = token AND status = 'active'
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Storage bucket for listing images
-- ============================================================
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: listing-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Storage policy (run in SQL editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to listing-images bucket for no-auth MVP flow
DROP POLICY IF EXISTS "Public can upload listing images" ON storage.objects;
CREATE POLICY "Public can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images');

-- Allow public read of all listing images
CREATE POLICY "Public can view listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');
