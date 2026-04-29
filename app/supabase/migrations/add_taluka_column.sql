-- ============================================================
-- Migration: Add taluka column to products table
-- Run this in Supabase SQL Editor to add hyperlocal taluka support
-- ============================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS taluka TEXT;

-- Add index for taluka filtering (useful for future analytics)
CREATE INDEX IF NOT EXISTS idx_products_taluka ON public.products(taluka);

-- Optional: Add composite index for city.taluka queries
CREATE INDEX IF NOT EXISTS idx_products_city_taluka ON public.products(city, taluka) WHERE status = 'active';
