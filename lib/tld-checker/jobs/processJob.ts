import { updateJobStatus, incrementProcessedPairs } from "@/lib/supabase/queries/tld-jobs";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { persistResults } from "@/lib/tld-checker/persistResults";
import type { TldCheckJobRow } from "@/lib/supabase/queries/tld-jobs";

const CHUNK_SIZE = 5;
const RESOLVERS = ["cloudflare", "google"] as const;

export async function processJob(job: TldCheckJobRow) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (globalThis as any).__supabase_client__;
  if (!client) throw new Error("No Supabase client available");

  await updateJobStatus(client, job.id, { status: "running" });

  const domainIds = job.domain_ids;
  try {
    for (let i = 0; i < domainIds.length; i += CHUNK_SIZE) {
      const chunk = domainIds.slice(i, i + CHUNK_SIZE);
      const resolver = RESOLVERS[Math.floor(i / CHUNK_SIZE) % 2];

      for (const domainId of chunk) {
        // Fetch domain name
        const { data: domainRow } = await client
          .from("domains")
          .select("domain")
          .eq("id", domainId)
          .single();

        if (!domainRow) continue;

        const root = extractRootWord(domainRow.domain);

        // Fetch active TLDs
        const { data: tldRows } = await client
          .from("tld_extensions")
          .select("extension")
          .eq("is_active", true)
          .order("sort_order");

        if (!tldRows?.length) continue;

        const tlds = (tldRows as Array<{ extension: string }>).map(
          (r) => r.extension
        );

        // Check with retry
        let results = await checkAllExtensionsForRoot(root, tlds, resolver);

        const errorCount = results.filter((r) => r.error).length;
        const totalCount = results.length;

        // Retry once if >50% errors (likely rate limiting)
        if (errorCount > totalCount * 0.5) {
          await new Promise((r) => setTimeout(r, 1000));
          results = await checkAllExtensionsForRoot(root, tlds, resolver);
        }

        await persistResults(client, domainId, job.user_id, results);
      }

      await incrementProcessedPairs(
        client,
        job.id,
        chunk.length * (await getActiveTldCount(client))
      );
    }

    await updateJobStatus(client, job.id, { status: "completed" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJobStatus(client, job.id, {
      status: "failed",
      error: message,
    });
  }
}

async function getActiveTldCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
): Promise<number> {
  const { count } = await client
    .from("tld_extensions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return count ?? 0;
}
