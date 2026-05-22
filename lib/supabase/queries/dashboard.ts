import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export async function autoTransitionExpired(): Promise<number> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .update({ status: "expired" } as never)
    .eq("status", "active")
    .lt("expiration_date", new Date().toISOString().split("T")[0]);

  if (error) throw error;

  return (data ?? []).length;
}

export async function fetchDomainsForDashboard(): Promise<DomainRow[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("*");

  if (error) throw error;

  return (data ?? []) as unknown as DomainRow[];
}
