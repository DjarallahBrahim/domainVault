export interface ExtensionCheckUpsertParams {
  userId: string;
  domainId: string;
  tld: string;
  fullDomain: string;
  isReserved: boolean;
  isLive: boolean;
  resolver: string;
}

export async function upsertExtensionCheck(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  params: ExtensionCheckUpsertParams
) {
  const { data, error } = await client
    .from("domain_extension_checks")
    .upsert(
      {
        user_id: params.userId,
        domain_id: params.domainId,
        tld: params.tld,
        full_domain: params.fullDomain,
        is_reserved: params.isReserved,
        is_live: params.isLive,
        resolver: params.resolver,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "domain_id,tld" }
    )
    .select()
    .single();

  return { data, error };
}

export async function recomputeReservedCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  domainId: string
) {
  const { count, error: countError } = await client
    .from("domain_extension_checks")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .eq("is_reserved", true);

  if (countError) return { error: countError };

  const { error: updateError } = await client
    .from("domains")
    .update({
      reserved_tlds_count: count ?? 0,
      tlds_last_checked_at: new Date().toISOString(),
    })
    .eq("id", domainId);

  return { error: updateError };
}

export async function fetchExtensionChecks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  domainId: string
) {
  const { data, error } = await client
    .from("domain_extension_checks")
    .select("*")
    .eq("domain_id", domainId)
    .order("tld");

  return { data, error };
}
