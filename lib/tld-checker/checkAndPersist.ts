import type { PersistOutcome } from "./types";
import { extractRootWord } from "./rootExtractor";
import { checkAllExtensionsForRoot } from "./checkExtensions";
import { persistResults } from "./persistResults";
import { fetchActiveTlds } from "@/lib/supabase/queries/tld-extensions";

export interface CheckAndPersistResult {
  domainName: string;
  rootWord: string;
  tldCount: number;
  checksCompleted: number;
  persistOutcome: PersistOutcome;
}

export async function checkAndPersist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  domainId: string,
  userId: string,
  domainName: string
): Promise<CheckAndPersistResult> {
  const root = extractRootWord(domainName);

  const { data: tldRows, error: tldError } = await fetchActiveTlds(client);
  if (tldError || !tldRows) {
    throw new Error(
      `Failed to fetch TLDs: ${tldError?.message ?? "no data returned"}`
    );
  }

  const tlds = (tldRows as Array<{ extension: string }>).map(
    (r) => r.extension
  );

  if (tlds.length === 0) {
    return {
      domainName,
      rootWord: root,
      tldCount: 0,
      checksCompleted: 0,
      persistOutcome: { succeeded: 0, failed: 0 },
    };
  }

  const results = await checkAllExtensionsForRoot(root, tlds, "cloudflare");

  const errorsCount = results.filter((r) => r.error).length;
  if (errorsCount === results.length) {
    return {
      domainName,
      rootWord: root,
      tldCount: tlds.length,
      checksCompleted: 0,
      persistOutcome: {
        succeeded: 0,
        failed: results.length,
        errors: results.map((r) => ({ tld: r.tld, error: r.error ?? "unknown" })),
      },
    };
  }

  const persistOutcome = await persistResults(
    client,
    domainId,
    userId,
    results
  );

  return {
    domainName,
    rootWord: root,
    tldCount: tlds.length,
    checksCompleted: results.length - errorsCount,
    persistOutcome,
  };
}
