-- DomainVault: Afternic API credentials on user_settings
-- Phase 24: Afternic Integration
-- Extends the existing user_settings table from Migration 005.
-- RLS already covers user_settings — no policy changes needed.
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings'
      AND column_name = 'afternic_api_key'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN afternic_api_key    TEXT,
      ADD COLUMN afternic_api_secret TEXT;
  END IF;
END $$;

COMMIT;
