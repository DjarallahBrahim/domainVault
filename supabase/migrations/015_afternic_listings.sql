-- DomainVault: Afternic Listings cache table
-- Phase 24: Afternic Integration
-- Write-through cache keyed by domain_id. One row per listed domain per user.
-- Prices are stored in USD dollars (converted from Afternic microunits).
-- Includes Lease-to-Own / lander columns used by Phase 28.
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'afternic_listings'
      AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.afternic_listings (
      id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      domain_id             UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
      domain_name           TEXT NOT NULL,
      display_name          TEXT,
      list_status           TEXT NOT NULL DEFAULT 'PENDING'
                            CHECK (list_status IN (
                              'PENDING','FAILED_COMPLIANCE','ACTIVE','HIDDEN',
                              'ON_HOLD','SOLD','INACTIVE'
                            )),
      fast_transfer_status  TEXT,
      buynow_price          DECIMAL(10,2),
      floor_price           DECIMAL(10,2),
      minbid_price          DECIMAL(10,2),
      landing_page          TEXT NOT NULL DEFAULT 'SALES_TYPE'
                            CHECK (landing_page IN ('SALES_TYPE','PARKING_TYPE')),
      intake_style          TEXT NOT NULL DEFAULT 'BUYNOW'
                            CHECK (intake_style IN ('BUYNOW','PRICE_FORM','CUSTOM_LANDER')),
      hidden                BOOLEAN NOT NULL DEFAULT false,
      featured              BOOLEAN NOT NULL DEFAULT false,
      leasing_enabled       BOOLEAN NOT NULL DEFAULT false,
      max_lease_period      INTEGER CHECK (max_lease_period BETWEEN 2 AND 60),
      show_lander_buynow    BOOLEAN NOT NULL DEFAULT true,
      show_lander_makeoffer BOOLEAN NOT NULL DEFAULT false,
      show_lander_lease     BOOLEAN NOT NULL DEFAULT false,
      intake_views          INTEGER,
      intake_leads          INTEGER,
      afternic_registrar    TEXT,
      listed_at             TIMESTAMPTZ,
      last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
      created_at            TIMESTAMPTZ DEFAULT NOW(),
      updated_at            TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_afternic_listings_user_id   ON public.afternic_listings(user_id);
    CREATE INDEX idx_afternic_listings_domain_id ON public.afternic_listings(domain_id);
    CREATE INDEX idx_afternic_listings_status    ON public.afternic_listings(list_status);
    CREATE INDEX idx_afternic_listings_ft_status ON public.afternic_listings(fast_transfer_status);

    ALTER TABLE public.afternic_listings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "own afternic_listings"
      ON public.afternic_listings
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
