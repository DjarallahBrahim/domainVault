import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { addMonths } from "date-fns";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];
type DomainUpdate = Database["public"]["Tables"]["domains"]["Update"];

const DEFAULT_PAGE_SIZE = 50;

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
  notListed?: string;
}

const PLATFORM_LISTINGS_TABLE: Record<string, string> = {
  sedo: "sedo_listings",
  spaceship: "spaceship_listings",
};

export async function fetchDomains(filters: DomainFilters) {
  const supabase = createClient();

  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = filters.page ?? 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
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

  if (filters.notListed) {
    const table = PLATFORM_LISTINGS_TABLE[filters.notListed];
    if (table) {
      const { data: listed } = await supabase
        .from(table as "domains")
        .select("domain_id");

      const listedIds = ((listed ?? []) as unknown as Array<{ domain_id: string }>).map(r => r.domain_id);

      if (listedIds.length > 0) {
        query = query.not("id", "in", `(${listedIds.join(",")})`);
      }
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

export async function updateDomain(id: string, updates: DomainUpdate) {
  const supabase = createClient();

  const { error } = await supabase
    .from("domains")
    .update(updates as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteDomain(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("domains").delete().eq("id", id);

  if (error) throw error;
}

export async function deleteDomains(ids: string[]) {
  const supabase = createClient();

  const { error } = await supabase.from("domains").delete().in("id", ids);

  if (error) throw error;
}

export interface UpsertRow {
  domain: string;
  expiration_date: string;
  purchase_price?: number | null;
  bin?: number | null;
  registrar?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

export async function upsertDomains(
  rows: UpsertRow[],
  mode: "skip" | "update"
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const payload = rows.map((row) => ({
    user_id: user.id,
    domain: row.domain,
    expiration_date: row.expiration_date,
    purchase_price: row.purchase_price ?? null,
    bin: row.bin ?? null,
    registrar: row.registrar ?? null,
    notes: row.notes ?? null,
    tags: row.tags ?? null,
  }));

  if (mode === "skip") {
    const { data, error } = await supabase
      .from("domains")
      .upsert(payload as never, {
        onConflict: "user_id,domain",
        ignoreDuplicates: true,
      });

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("domains")
    .upsert(payload as never, {
      onConflict: "user_id,domain",
    });

  if (error) throw error;
  return data;
}

export async function checkExistingDomains(
  normalizedNames: string[]
): Promise<Set<string>> {
  const supabase = createClient();

  const { data, error } = await supabase
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

export async function insertSingleDomain(input: {
  domain: string;
  expiration_date: string;
  purchase_price?: number | null;
  registrar?: string | null;
  notes?: string | null;
  tags?: string | null;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("domains")
    .select("id")
    .ilike("domain", input.domain)
    .maybeSingle();

  if (existing) {
    throw new Error("Domain already exists in your portfolio");
  }

  const { data: domain, error } = await supabase
    .from("domains")
    .insert({
      user_id: user.id,
      domain: input.domain,
      expiration_date: input.expiration_date,
      purchase_price: input.purchase_price ?? null,
      registrar: input.registrar ?? null,
      notes: input.notes ?? null,
      tags: input.tags
        ? input.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : null,
      status: "active",
    } as never)
    .select()
    .single();

  if (error) throw error;

  return domain as unknown as DomainRow;
}

export async function fetchRegistrarList(): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
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
