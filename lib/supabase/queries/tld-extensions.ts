/**
 * Generic active-TLD fetch. Works with any Supabase client (browser or server)
 * and contains no server-only imports so it is safe to use from client code.
 */
export async function fetchActiveTlds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
) {
  const { data, error } = await client
    .from("tld_extensions")
    .select("extension")
    .eq("is_active", true)
    .order("sort_order");

  return { data, error };
}
