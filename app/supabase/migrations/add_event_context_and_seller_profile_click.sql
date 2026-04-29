-- ============================================================
-- Migration: Add analytics event context + seller profile click event
-- ============================================================

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_context JSONB;

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE public.events
ADD CONSTRAINT events_event_type_check
CHECK (event_type IN ('view', 'whatsapp_click', 'report', 'seller_profile_click'));

CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_context_gin ON public.events USING GIN (event_context);
