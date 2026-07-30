import type { ExtensionResult, PersistOutcome } from "./types";
import {
  upsertExtensionCheck,
  recomputeReservedCount,
} from "@/lib/supabase/queries/extension-checks";

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

  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ tld: string; error: string }> = [];

  for (const result of results) {
    const { error } = await upsertExtensionCheck(client, {
      userId,
      domainId,
      tld: result.tld,
      fullDomain: result.fullDomain,
      isReserved: result.isReserved,
      isLive: result.isLive,
      resolver: result.resolver,
    });

    if (error) {
      failed++;
      errors.push({ tld: result.tld, error: error.message });
    } else {
      succeeded++;
    }
  }

  if (succeeded > 0) {
    await recomputeReservedCount(client, domainId);
  }

  return {
    succeeded,
    failed,
    ...(errors.length > 0 && { errors }),
  };
}
