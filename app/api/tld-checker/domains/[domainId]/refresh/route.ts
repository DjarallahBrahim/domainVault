import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { persistResults } from "@/lib/tld-checker/persistResults";

const DEFAULT_TLDS = ["com", "net", "org", "io", "ai", "co", "app", "dev"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = await params;

  const { data: domain } = await supabase
    .from("domains")
    .select("id, domain")
    .eq("id", domainId)
    .eq("user_id", authData.user.id)
    .single();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const { data: tldRows, error: tldError } = await supabase
    .from("tld_extensions")
    .select("extension")
    .eq("is_active", true)
    .order("sort_order");

  console.log(`[tld-refresh] tld_extensions query: rows=${tldRows?.length ?? 0}, error=${tldError?.message ?? "none"}`);

  let tlds: string[];
  if (tldRows?.length) {
    tlds = (tldRows as Array<{ extension: string }>).map((r) => r.extension);
  } else {
    tlds = DEFAULT_TLDS;
  }

  const root = extractRootWord((domain as { domain: string }).domain);

  console.log(`[tld-refresh] checking ${tlds.length} TLDs for domain="${(domain as { domain: string }).domain}" root="${root}"`);

  const startedAt = Date.now();
  const results = await checkAllExtensionsForRoot(root, tlds, "cloudflare");
  const elapsed = Date.now() - startedAt;

  console.log(`[tld-refresh] done in ${elapsed}ms — ${results.filter(r => r.isReserved).length} reserved, ${results.filter(r => r.isLive).length} live, ${results.filter(r => r.error).length} errors`);

  await persistResults(
    supabase as unknown as Record<string, unknown>,
    domainId,
    authData.user.id,
    results
  );

  const reservedCount = results.filter((r) => r.isReserved).length;

  return NextResponse.json({
    data: {
      domainId,
      reservedTldsCount: reservedCount,
      tldsChecked: tlds.length,
      elapsedMs: elapsed,
      checkedAt: new Date().toISOString(),
      results: results.map((r) => ({
        tld: r.tld,
        fullDomain: r.fullDomain,
        isReserved: r.isReserved,
        isLive: r.isLive,
      })),
    },
  });
}
