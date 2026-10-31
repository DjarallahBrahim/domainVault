-- DomainVault: support Atom Plus listings
-- Phase 31: Atom Integration
-- Atom exposes Standard, Plus, Premium and Geo listing types. Migration 017
-- originally normalised Plus to Premium; this widens the constraint so Plus can
-- be stored separately (and removed through the API).
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'atom_listings'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.atom_listings
      DROP CONSTRAINT IF EXISTS atom_listings_listing_type_check;

    ALTER TABLE public.atom_listings
      ADD CONSTRAINT atom_listings_listing_type_check
      CHECK (listing_type IN ('standard','plus','premium','geo'));

    -- Fix rows cached by the previous mapper, which treated Plus as Premium.
    UPDATE public.atom_listings
    SET listing_type = 'plus'
    WHERE listing_type = 'premium'
      AND lower(coalesce(listing_type_raw, '')) LIKE '%plus%';
  END IF;
END $$;

COMMIT;
