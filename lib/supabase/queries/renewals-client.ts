import { createClient } from "@/lib/supabase/client";
import type { DomainRenewalRow } from "@/types/renewal";

export interface RecordRenewalInput {
  domainId: string;
  newExpirationDate: string;
  cost: number;
}

/**
 * Records a renewal atomically: inserts the history row and updates the
 * domain's expiration date + renewal counters in one DB transaction.
 */
export async function recordDomainRenewal(input: RecordRenewalInput): Promise<DomainRenewalRow> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // @supabase/ssr's SupabaseClient typing does not expose the RPC schema
  // generic, so the generated Database function type is unavailable here.
  // The shape below mirrors `record_domain_renewal` in the migration.
  const rpc = supabase as unknown as {
    rpc: (
      fn: "record_domain_renewal",
      args: {
        p_domain_id: string;
        p_new_expiration_date: string;
        p_cost: number;
      }
    ) => PromiseLike<{
      data: DomainRenewalRow | DomainRenewalRow[] | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await rpc.rpc("record_domain_renewal", {
    p_domain_id: input.domainId,
    p_new_expiration_date: input.newExpirationDate,
    p_cost: input.cost,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Renewal was not recorded");

  return row;
}

export async function fetchDomainRenewals(domainId: string): Promise<DomainRenewalRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("domain_renewals")
    .select("*")
    .eq("domain_id", domainId)
    .order("renewed_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as DomainRenewalRow[];
}
