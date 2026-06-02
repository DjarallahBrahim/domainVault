import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { addMonths } from "date-fns";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export interface DomainFilters {
  status?: string;
  tld?: string;
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
  expiry?: string;
  registrars?: string;
}

const DEFAULT_PAGE_SIZE = 50;

export async function fetchDomains(filters: DomainFilters) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = filters.page ?? 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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
    const tokens = filters.search.split(",").map(t => t.trim()).filter(Boolean);
    if (tokens.length > 1) {
      query = query.or(tokens.map(t => `domain.ilike.%${t}%`).join(","));
    } else if (tokens.length === 1) {
      query = query.ilike("domain", `%${tokens[0]}%`);
    }
  }

  if (filters.expiry) {
    const now = new Date();
    if (filters.expiry === "1m") {
      query = query.lte("expiration_date", addMonths(now, 1).toISOString().split("T")[0]);
    } else if (filters.expiry === "3m") {
      query = query.lte("expiration_date", addMonths(now, 3).toISOString().split("T")[0]);
    } else if (filters.expiry === "6m") {
      query = query.lte("expiration_date", addMonths(now, 6).toISOString().split("T")[0]);
    } else if (filters.expiry === "9m") {
      query = query.lte("expiration_date", addMonths(now, 9).toISOString().split("T")[0]);
    }
  }

  if (filters.registrars) {
    const regTokens = filters.registrars.split(",").map(r => r.trim()).filter(Boolean);
    if (regTokens.length > 1) {
      query = query.in("registrar", regTokens);
    } else if (regTokens.length === 1) {
      query = query.eq("registrar", regTokens[0]);
    }
  }

  const sortColumn = (filters.sort ?? "created_at") as keyof DomainRow;
  const sortOrder = filters.order === "asc" ? true : false;

  query = query
    .order(sortColumn, { ascending: sortOrder })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    domains: (data ?? []) as unknown as DomainRow[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
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

export async function fetchAllRegistrars(): Promise<string[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("registrar")
    .not("registrar", "is", null)
    .order("registrar");

  if (error) throw error;

  const registrars = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ registrar: string }>) {
    if (row.registrar.trim()) registrars.add(row.registrar.trim());
  }
  return Array.from(registrars);
}
