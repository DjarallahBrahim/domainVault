import { createJob } from "@/lib/supabase/queries/tld-jobs";

export interface CreateSyncJobParams {
  client: unknown;
  userId: string;
  scope: "all" | "page";
  domainIds?: string[];
  activeTldCount: number;
}

export async function createSyncJob(params: CreateSyncJobParams) {
  const { client, userId, scope, domainIds, activeTldCount } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;

  let resolvedDomainIds: string[] = [];

  if (scope === "all") {
    const { data: domains } = await c
      .from("domains")
      .select("id")
      .eq("user_id", userId)
      .order("domain");

    resolvedDomainIds = (domains ?? []).map((d: { id: string }) => d.id);
  } else if (domainIds?.length) {
    const { data: domains } = await c
      .from("domains")
      .select("id")
      .eq("user_id", userId)
      .in("id", domainIds)
      .order("domain");

    resolvedDomainIds = (domains ?? []).map((d: { id: string }) => d.id);
  }

  if (resolvedDomainIds.length === 0) {
    return { data: null, error: new Error("No domains to sync"), conflict: false };
  }

  const totalPairs = resolvedDomainIds.length * activeTldCount;

  return createJob(c, {
    userId,
    scope,
    domainIds: resolvedDomainIds,
    totalPairs,
  });
}
