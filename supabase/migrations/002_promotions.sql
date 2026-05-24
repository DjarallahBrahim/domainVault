-- Migration 002: Promotions table
-- Tracks which domains have been promoted and when.
-- Each week a new promotion batch is generated; a domain can be promoted once per week.

CREATE TABLE IF NOT EXISTS public.promotions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id   UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  week_start  DATE NOT NULL,
  promoted_at TIMESTAMPTZ,
  UNIQUE(user_id, domain_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_promotions_user_week ON public.promotions(user_id, week_start);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own promotions" ON public.promotions;
CREATE POLICY "own promotions" ON public.promotions FOR ALL USING (auth.uid() = user_id);
