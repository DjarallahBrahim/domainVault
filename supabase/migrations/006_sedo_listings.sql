-- DomainVault: Sedo Listings Cache table
-- Phase 5: Sedo Integration
-- Write-through cache keyed by domain_id. One row per listed domain per user.
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'sedo_listings'
      AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.sedo_listings (
      id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      domain_id        UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
      domain_name      TEXT NOT NULL,
      sedo_price       DECIMAL(10,2) NOT NULL,
      sedo_minprice    DECIMAL(10,2) NOT NULL DEFAULT 0,
      sedo_fixedprice  INTEGER NOT NULL DEFAULT 1,
      sedo_currency    INTEGER NOT NULL DEFAULT 1,
      sedo_forsale     INTEGER NOT NULL DEFAULT 1,
      last_synced_at   TIMESTAMPTZ DEFAULT NOW(),
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_sedo_listings_user_id   ON public.sedo_listings(user_id);
    CREATE INDEX idx_sedo_listings_domain_id ON public.sedo_listings(domain_id);

    ALTER TABLE public.sedo_listings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "own sedo_listings"
      ON public.sedo_listings
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
