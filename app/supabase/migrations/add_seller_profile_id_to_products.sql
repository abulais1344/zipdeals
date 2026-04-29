-- ============================================================
-- Migration: link products to sellers by seller_profile_id
-- ============================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_profile_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- Backfill historical rows using seller phone mapping.
UPDATE public.products p
SET seller_profile_id = s.id
FROM public.sellers s
WHERE p.seller_profile_id IS NULL
  AND p.seller_phone = s.phone;

CREATE INDEX IF NOT EXISTS idx_products_seller_profile_id
  ON public.products(seller_profile_id);

NOTIFY pgrst, 'reload schema';