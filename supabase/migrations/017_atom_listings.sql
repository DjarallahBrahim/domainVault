-- DomainVault: Atom.com Listings cache table
-- Phase 31: Atom Integration
-- Write-through cache keyed by domain_id. One row per listed domain per user.
-- Atom has no fixed status enum, so list_status is free-form TEXT.
-- listing_type is normalised to standard/plus/premium/geo for removal rules;
-- Standard and Plus can be removed through the API.
-- listing_type_raw preserves the provider label (e.g. "Plus").
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'atom_listings'
      AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.atom_listings (
      id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      domain_id         UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
      domain_name       TEXT NOT NULL,
      atom_id           BIGINT,
      list_status       TEXT NOT NULL DEFAULT 'pending',
      listing_type      TEXT NOT NULL DEFAULT 'standard'
                        CHECK (listing_type IN ('standard','plus','premium','geo')),
      listing_type_raw  TEXT,
      selling_price     DECIMAL(12,2),
      full_price        DECIMAL(12,2),
      discount          DECIMAL(5,2),
      primary_category  TEXT,
      logo_image        TEXT,
      listed_at         TIMESTAMPTZ,
      last_synced_at    TIMESTAMPTZ DEFAULT NOW(),
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_atom_listings_user_id      ON public.atom_listings(user_id);
    CREATE INDEX idx_atom_listings_domain_id    ON public.atom_listings(domain_id);
    CREATE INDEX idx_atom_listings_status       ON public.atom_listings(list_status);
    CREATE INDEX idx_atom_listings_type         ON public.atom_listings(listing_type);

    ALTER TABLE public.atom_listings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "own atom_listings"
      ON public.atom_listings
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
