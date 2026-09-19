-- Add sale_type (inbound / outbound) column to sales
-- Inbound  = buyer came to us (marketplace / landing page / direct enquiry)
-- Outbound = we proactively reached out to the buyer
-- Idempotent: safe to run multiple times

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales'
      AND column_name = 'sale_type'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.sales
      ADD COLUMN sale_type TEXT NOT NULL DEFAULT 'inbound';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sales_sale_type_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_sale_type_check
      CHECK (sale_type IN ('inbound', 'outbound'));
  END IF;
END $$;

COMMIT;
