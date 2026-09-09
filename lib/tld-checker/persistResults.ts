import type { ExtensionResult, PersistOutcome } from "./types";
import { recomputeReservedCount } from "@/lib/supabase/queries/extension-checks";

/**
 * Persists a whole batch of extension checks in a single upsert (one DB round
 * trip instead of one per TLD), then recomputes the reserved count.
 */
export async function persistResults(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  domainId: string,
  userId: string,
  results: ExtensionResult[]
): Promise<PersistOutcome> {
  if (results.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  const rows = results.map((result) => ({
    user_id: userId,
    domain_id: domainId,
    tld: result.tld,
    full_domain: result.fullDomain,
    is_reserved: result.isReserved,
    is_live: result.isLive,
    resolver: result.resolver,
    checked_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from("domain_extension_checks")
    .upsert(rows, { onConflict: "domain_id,tld" });

  if (error) {
    return {
      succeeded: 0,
      failed: results.length,
      errors: results.map((r) => ({ tld: r.tld, error: error.message })),
    };
  }

  await recomputeReservedCount(client, domainId);

  return { succeeded: results.length, failed: 0 };
}
