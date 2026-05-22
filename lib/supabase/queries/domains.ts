import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export interface DomainFilters {
  status?: string;
  tld?: string;
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
}

const PAGE_SIZE = 50;

export async function fetchDomains(filters: DomainFilters) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = resolved
    .from("domains")
    .select("*", { count: "exact" });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.tld) {
    query = query.eq("tld", filters.tld.toLowerCase());
  }

  if (filters.search) {
    query = query.ilike("domain", `%${filters.search}%`);
  }

  const sortColumn = (filters.sort ?? "expiration_date") as keyof DomainRow;
  const sortOrder = filters.order === "desc" ? false : true;

  query = query
    .order(sortColumn, { ascending: sortOrder })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    domains: (data ?? []) as unknown as DomainRow[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function fetchDomain(id: string) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as unknown as DomainRow;
}

export async function fetchAllTlds(): Promise<string[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("tld");

  if (error) throw error;

  const tldSet = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ tld: string | null }>) {
    if (row.tld) tldSet.add(row.tld);
  }
  const tlds = Array.from(tldSet);
  tlds.sort();
  return tlds;
}

export async function checkExistingDomains(
  normalizedNames: string[]
): Promise<Set<string>> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("domain")
    .in("domain", normalizedNames);

  if (error) throw error;

  const existing = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ domain: string }>) {
    existing.add(row.domain.toLowerCase());
  }
  return existing;
}
