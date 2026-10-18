-- ─── DOMAIN RENEWALS ───────────────────────────────────────────────────────
-- Records each renewal of a domain: the expiration dates before/after, the
-- cost paid, and when it happened. Domains keep denormalized counters
-- (renewal_count / renewal_cost) so the list can render the renewal badge
-- without an extra query per row.
-- Idempotent: safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.domain_renewals (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id           UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  renewed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_expiration_date DATE,
  new_expiration_date DATE NOT NULL,
  cost                NUMERIC(10,2) NOT NULL DEFAULT 10.44
                      CHECK (cost >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_renewals_user_id   ON public.domain_renewals(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_renewals_domain_id ON public.domain_renewals(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_renewals_date      ON public.domain_renewals(renewed_at);

ALTER TABLE public.domain_renewals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own domain_renewals" ON public.domain_renewals;
CREATE POLICY "own domain_renewals" ON public.domain_renewals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── DENORMALIZED COUNTERS ON DOMAINS ─────────────────────────────────────
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS renewal_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS renewal_cost NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Keep the counters in sync with the history table.
CREATE OR REPLACE FUNCTION public.sync_domain_renewal_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.domains
    SET renewal_count = renewal_count + 1,
        renewal_cost  = renewal_cost + NEW.cost
    WHERE id = NEW.domain_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.domains
    SET renewal_count = GREATEST(renewal_count - 1, 0),
        renewal_cost  = GREATEST(renewal_cost - OLD.cost, 0)
    WHERE id = OLD.domain_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_domain_renewals_sync ON public.domain_renewals;
CREATE TRIGGER trigger_domain_renewals_sync
  AFTER INSERT OR DELETE ON public.domain_renewals
  FOR EACH ROW EXECUTE FUNCTION public.sync_domain_renewal_counters();

-- ─── RECORD A RENEWAL (atomic) ────────────────────────────────────────────
-- Inserts the renewal history row and updates domains.expiration_date in one
-- transaction. The trigger above increments the renewal counters.
CREATE OR REPLACE FUNCTION public.record_domain_renewal(
  p_domain_id           UUID,
  p_new_expiration_date DATE,
  p_cost                NUMERIC DEFAULT 10.44
)
RETURNS public.domain_renewals
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_old_date DATE;
  v_row      public.domain_renewals;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_new_expiration_date IS NULL THEN
    RAISE EXCEPTION 'New expiration date is required';
  END IF;

  IF p_cost IS NULL OR p_cost < 0 THEN
    RAISE EXCEPTION 'Renewal cost must be a non-negative number';
  END IF;

  SELECT expiration_date
    INTO v_old_date
    FROM public.domains
   WHERE id = p_domain_id
     AND user_id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain not found';
  END IF;

  INSERT INTO public.domain_renewals (
    user_id, domain_id, old_expiration_date, new_expiration_date, cost
  ) VALUES (
    v_user_id, p_domain_id, v_old_date, p_new_expiration_date, p_cost
  )
  RETURNING * INTO v_row;

  UPDATE public.domains
     SET expiration_date = p_new_expiration_date,
         status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
   WHERE id = p_domain_id
     AND user_id = v_user_id;

  RETURN v_row;
END;
$$;

COMMIT;
