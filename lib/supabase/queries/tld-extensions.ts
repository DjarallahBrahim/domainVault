import { createClient as createServerClient } from "@/lib/supabase/server";

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

export async function serverFetchActiveTlds() {
  const client = await createServerClient();
  return fetchActiveTlds(client as unknown as Parameters<typeof fetchActiveTlds>[0]);
}
