-- ─── DOMAIN TOTAL COST ─────────────────────────────────────────────────────
-- Exposes the lifetime cost of a domain (purchase price + all renewal costs)
-- as a stored generated column. This lets the domains table display and sort
-- by total cost without client-side aggregation.
-- Idempotent: safe to run multiple times.

BEGIN;

ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2)
  GENERATED ALWAYS AS (
    COALESCE(purchase_price, 0) + COALESCE(renewal_cost, 0)
  ) STORED;

COMMIT;
