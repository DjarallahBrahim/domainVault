import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSyncJob } from "@/lib/tld-checker/jobs/createJob";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { scope?: string; domainIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scope = body.scope;

  if (scope !== "all" && scope !== "page") {
    return NextResponse.json(
      { error: "scope must be 'all' or 'page'" },
      { status: 400 }
    );
  }

  if (scope === "page" && (!body.domainIds || body.domainIds.length === 0)) {
    return NextResponse.json(
      { error: "domainIds required when scope is 'page'" },
      { status: 400 }
    );
  }

  const { data: tldRows } = await supabase
    .from("tld_extensions")
    .select("extension")
    .eq("is_active", true);

  const activeTldCount = tldRows?.length ?? 0;

  const result = await createSyncJob({
    client: supabase,
    userId: authData.user.id,
    scope,
    domainIds: body.domainIds,
    activeTldCount,
  });

  if (result.conflict) {
    return NextResponse.json(
      { error: "A sync job is already in progress" },
      { status: 409 }
    );
  }

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error?.message ?? "Failed to create job" },
      { status: 500 }
    );
  }

  const job = result.data;

  // Start processing in background
  import("@/lib/tld-checker/jobs/processJob").then(({ processJob }) => {
    (globalThis as Record<string, unknown>).__supabase_client__ = supabase;
    processJob(job).catch(() => {});
  });

  return NextResponse.json(
    {
      data: {
        jobId: job.id,
        status: job.status,
        totalPairs: job.total_pairs,
      },
    },
    { status: 201 }
  );
}
