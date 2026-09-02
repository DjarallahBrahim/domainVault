-- ─── TLD OUTREACH ─────────────────────────────────────────────────────────
-- Tracks manual outreach to the owners of reserved TLD variants of a domain.
-- One row per (domain, TLD) pair the user has interacted with; rows are
-- created lazily on first interaction. Scoped to the owning user via RLS.
CREATE TABLE IF NOT EXISTS public.tld_outreach (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id     UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  tld           TEXT NOT NULL,
  full_domain   TEXT NOT NULL,                 -- e.g. 'word.io' — denormalized for fast render
  contacted     BOOLEAN NOT NULL DEFAULT false,
  contacted_at  TIMESTAMPTZ,
  reply_status  TEXT NOT NULL DEFAULT 'negative'
                CHECK (reply_status IN ('pending', 'positive', 'negative')),
  reply_at      TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (domain_id, tld)
);

CREATE INDEX idx_tld_outreach_user_id   ON public.tld_outreach(user_id);
CREATE INDEX idx_tld_outreach_domain_id ON public.tld_outreach(domain_id);
CREATE INDEX idx_tld_outreach_reply     ON public.tld_outreach(reply_status);

ALTER TABLE public.tld_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tld_outreach" ON public.tld_outreach
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);