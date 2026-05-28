-- Migration 002: Promotions table
-- Tracks which domains have been promoted and when.
-- Each week a new promotion batch is generated; a domain can be promoted once per week.

s-- Simple event log: one row per promotion action
CREATE TABLE IF NOT EXISTS public.promotion_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id    UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  promoted_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promo_events_user_domain
  ON public.promotion_events(user_id, domain_id);

ALTER TABLE public.promotion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own promotion_events"
  ON public.promotion_events FOR ALL USING (auth.uid() = user_id);