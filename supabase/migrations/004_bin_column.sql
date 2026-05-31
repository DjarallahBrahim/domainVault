-- DomainVault: Add bin (asking price) column
-- Phase 4: Sales Tracking
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains'
      AND column_name = 'bin'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.domains
      ADD COLUMN bin DECIMAL(10,2);
  END IF;
END $$;

COMMIT;
