-- DomainVault Core Schema
-- Phase 1: Foundation
-- Idempotent: safe to run multiple times

BEGIN;

-- ─── HELPER: updated_at trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── DOMAINS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domains (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain          TEXT NOT NULL,
  tld             TEXT GENERATED ALWAYS AS (split_part(domain, '.', -1)) STORED,
  expiration_date DATE NOT NULL,
  purchase_price  DECIMAL(10,2),
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','expired','sold','pending')),
  registrar       TEXT,
  notes           TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id    ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_expiration ON domains(expiration_date);
CREATE INDEX IF NOT EXISTS idx_domains_status     ON domains(status);

DROP TRIGGER IF EXISTS trigger_domains_updated_at ON domains;
CREATE TRIGGER trigger_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── SALES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id   UUID REFERENCES domains(id) ON DELETE SET NULL,
  domain_name TEXT NOT NULL,
  sale_price  DECIMAL(10,2) NOT NULL,
  sold_at     DATE NOT NULL,
  buyer       TEXT,
  platform    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);

-- ─── IMPORT LOGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename   TEXT NOT NULL,
  total_rows INT NOT NULL,
  imported   INT NOT NULL,
  skipped    INT NOT NULL,
  errors     JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE public.domains     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own domains"     ON public.domains;
DROP POLICY IF EXISTS "own sales"       ON public.sales;
DROP POLICY IF EXISTS "own import_logs" ON public.import_logs;

CREATE POLICY "own domains"     ON public.domains     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own sales"       ON public.sales       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own import_logs" ON public.import_logs FOR ALL USING (auth.uid() = user_id);

COMMIT;
