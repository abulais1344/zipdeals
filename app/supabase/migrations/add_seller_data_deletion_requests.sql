-- Track seller data deletion requests for compliance workflows.
CREATE TABLE IF NOT EXISTS public.seller_data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_deletion_requests_seller_id
  ON public.seller_data_deletion_requests(seller_id, requested_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_seller_active_deletion_request
  ON public.seller_data_deletion_requests(seller_id)
  WHERE status IN ('pending', 'processing');
