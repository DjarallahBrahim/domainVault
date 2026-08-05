-- DomainVault: Public showcase RLS policy
-- Phase 7: Featured Domains Showcase
-- Allows unauthenticated access to domains for the public showcase

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public_showcase'
      AND tablename = 'domains'
  ) THEN
    CREATE POLICY "public_showcase"
      ON public.domains
      FOR SELECT
      USING (true);
  END IF;
END $$;

COMMIT;

ALTER TABLE public.domains ADD COLUMN to_be_renewal BOOLEAN DEFAULT NULL;