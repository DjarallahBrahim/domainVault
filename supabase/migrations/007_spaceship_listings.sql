-- DomainVault: Spaceship SellerHub Listings Cache table
-- Phase 6: Spaceship SellerHub Integration
-- Write-through cache keyed by domain_id. One row per listed domain per user.
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
      AND column_name = 'spaceship_api_key'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN spaceship_api_key TEXT,
      ADD COLUMN spaceship_api_secret TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'spaceship_listings'
      AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.spaceship_listings (
      id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      domain_id             UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
      domain_name           TEXT NOT NULL,
      spaceship_domain_id   TEXT,
      spaceship_price       DECIMAL(10,2) NOT NULL,
      spaceship_minprice    DECIMAL(10,2) NOT NULL DEFAULT 0,
      spaceship_currency    TEXT NOT NULL DEFAULT 'USD',
      last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
      created_at            TIMESTAMPTZ DEFAULT NOW(),
      updated_at            TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_spaceship_listings_user_id   ON public.spaceship_listings(user_id);
    CREATE INDEX idx_spaceship_listings_domain_id ON public.spaceship_listings(domain_id);

    ALTER TABLE public.spaceship_listings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "own spaceship_listings"
      ON public.spaceship_listings
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
