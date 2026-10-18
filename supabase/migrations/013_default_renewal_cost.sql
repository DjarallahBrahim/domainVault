-- ─── DEFAULT RENEWAL COST ──────────────────────────────────────────────────
-- Renewals default to $10.44 instead of $10.99.
-- Idempotent: safe to run multiple times.

BEGIN;

ALTER TABLE public.domain_renewals
  ALTER COLUMN cost SET DEFAULT 10.44;

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
