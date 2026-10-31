-- DomainVault: Atom.com API credentials on user_settings
-- Phase 31: Atom Integration
-- Extends the existing user_settings table from Migration 005.
-- RLS already covers user_settings — no policy changes needed.
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
      AND column_name = 'atom_api_token'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN atom_api_token TEXT,
      ADD COLUMN atom_user_id   BIGINT;
  END IF;
END $$;

COMMIT;
