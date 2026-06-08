-- DomainVault: User Settings table for third-party API credentials
-- Phase 5: Sedo Integration
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_settings'
      AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.user_settings (
      id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
      sedo_partner_id  INTEGER,
      sedo_signkey     TEXT,
      sedo_username    TEXT CHECK (char_length(sedo_username) <= 25),
      sedo_password    TEXT CHECK (char_length(sedo_password) <= 16),
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "own settings"
      ON public.user_settings
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
