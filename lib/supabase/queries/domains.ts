import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { addMonths, format, startOfMonth } from "date-fns";

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
  expiryMin?: string;
  expiryMax?: string;
  registrars?: string;
  notListed?: string;
  lander?: string;
  shows?: string;
  renewed?: string;
  renewal?: string;
  created?: string;
  reservedTld?: string;
}

function normalizeReservedTld(value: string | undefined): string | null {
  if (!value) return null;
  const token = value
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)[0];
  if (!token) return null;
  const cleaned = token.replace(/^\.+/, "").replace(/\.+$/, "").toLowerCase();
  return cleaned || null;
}

const PLATFORM_LISTINGS_TABLE: Record<string, string> = {
  sedo: "sedo_listings",
  spaceship: "spaceship_listings",
  afternic: "afternic_listings",
};

const DEFAULT_PAGE_SIZE = 50;

export async function fetchDomains(filters: DomainFilters) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const {
    data: { user },
  } = await resolved.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = filters.page ?? 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const sortColumn = filters.sort ?? "created_at";
  const sortOrder = filters.order === "asc" ? true : false;
  const priceSort = sortColumn === "sedo_price" || sortColumn === "spaceship_price";
  // `total_cost` may not exist on older databases but both inputs always do,
  // so compute it client-side instead of ordering by a possibly-missing column.
  const totalCostSort = sortColumn === "total_cost";
  const clientSort = priceSort || totalCostSort;

  const reservedTld = normalizeReservedTld(filters.reservedTld);

  const selectFields = `${
    priceSort
      ? sortColumn === "sedo_price"
        ? "*, sedo_listings(sedo_price)"
        : "*, spaceship_listings(spaceship_price)"
      : "*"
  }${filters.lander || filters.shows ? ", afternic_listings!inner(domain_id)" : ""}${
    reservedTld ? ", domain_extension_checks!inner(tld)" : ""
  }`;

  let query = resolved
    .from("domains")
    .select(selectFields as never, { count: "exact" })
    .eq("user_id", user.id);

  if (filters.status === "all") {
    // No status filter — show all statuses
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "active");
  }

  if (filters.tld) {
    query = query.eq("tld", filters.tld.toLowerCase());
  }

  if (reservedTld) {
    query = query
      .eq("domain_extension_checks.tld", reservedTld)
      .eq("domain_extension_checks.is_reserved", true);
  }

  if (filters.search) {
    const tokens = filters.search
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length > 1) {
      query = query.or(tokens.map((t) => `domain.ilike.%${t}%`).join(","));
    } else if (tokens.length === 1) {
      query = query.ilike("domain", `%${tokens[0]}%`);
    }
  }

  const expiryMin = filters.expiryMin ? Number(filters.expiryMin) : NaN;
  const expiryMax = filters.expiryMax ? Number(filters.expiryMax) : NaN;
  const hasExpiryMin = !isNaN(expiryMin) && expiryMin >= 0;
  const hasExpiryMax = !isNaN(expiryMax) && expiryMax >= 0;

  if (hasExpiryMin || hasExpiryMax) {
    const now = new Date();
    const toDate = (months: number) => addMonths(now, months).toISOString().split("T")[0];
    if (hasExpiryMin) {
      query = query.gte("expiration_date", toDate(expiryMin));
    }
    if (hasExpiryMax) {
      query = query.lte("expiration_date", toDate(expiryMax));
    }
  } else if (filters.expiry) {
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
    const regTokens = filters.registrars
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (regTokens.length > 1) {
      query = query.in("registrar", regTokens);
    } else if (regTokens.length === 1) {
      query = query.eq("registrar", regTokens[0]);
    }
  }

  if (filters.notListed) {
    const platforms = filters.notListed
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => Boolean(PLATFORM_LISTINGS_TABLE[value]));

    const excluded = new Set<string>();

    for (const platform of platforms) {
      if (platform === "sedo") {
        const { data, error } = await resolved
          .from("sedo_listings")
          .select("domain_id")
          .eq("user_id", user.id);
        if (error) throw error;
        for (const row of (data ?? []) as Array<{ domain_id: string }>) {
          excluded.add(row.domain_id);
        }
      } else if (platform === "spaceship") {
        const { data, error } = await resolved
          .from("spaceship_listings")
          .select("domain_id")
          .eq("user_id", user.id);
        if (error) throw error;
        for (const row of (data ?? []) as Array<{ domain_id: string }>) {
          excluded.add(row.domain_id);
        }
      } else if (platform === "afternic") {
        const { data, error } = await resolved
          .from("afternic_listings")
          .select("domain_id")
          .eq("user_id", user.id);
        if (error) throw error;
        for (const row of (data ?? []) as Array<{ domain_id: string }>) {
          excluded.add(row.domain_id);
        }
      }
    }

    if (excluded.size > 0) {
      query = query.not("id", "in", `(${Array.from(excluded).join(",")})`);
    }
  }

  if (filters.lander || filters.shows) {
    if (filters.lander === "no_method") {
      query = query
        .eq("afternic_listings.intake_style", "CUSTOM_LANDER")
        .eq("afternic_listings.show_lander_buynow", false)
        .eq("afternic_listings.show_lander_makeoffer", false)
        .eq("afternic_listings.show_lander_lease", false);
    } else if (filters.lander) {
      const styles: Record<string, string> = {
        buynow: "BUYNOW",
        price_form: "PRICE_FORM",
        custom: "CUSTOM_LANDER",
      };
      const style = styles[filters.lander];
      if (style) {
        query = query.eq("afternic_listings.intake_style", style);
      }
    }

    if (filters.shows) {
      for (const show of filters.shows
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)) {
        if (show === "buynow") {
          query = query.eq("afternic_listings.show_lander_buynow", true);
        } else if (show === "makeoffer") {
          query = query.eq("afternic_listings.show_lander_makeoffer", true);
        } else if (show === "lease") {
          query = query.eq("afternic_listings.show_lander_lease", true);
        }
      }
    }
  }

  if (filters.renewed === "yes") {
    query = query.gt("renewal_count", 0);
  }

  if (filters.renewal === "yes") {
    query = query.eq("to_be_renewal", true);
  } else if (filters.renewal === "no") {
    query = query.eq("to_be_renewal", false);
  } else if (filters.renewal === "decided") {
    query = query.is("to_be_renewal", null);
  }

  if (filters.created === "1m") {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const nextMonthStart = format(startOfMonth(addMonths(now, 1)), "yyyy-MM-dd");
    query = query.gte("created_at", monthStart).lt("created_at", nextMonthStart);
  }

  let domains: DomainRow[];
  let count: number;

  if (clientSort) {
    const priceKey = sortColumn === "sedo_price" ? "sedo_listings" : "spaceship_listings";

    const {
      data,
      error,
      count: exactCount,
    } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    count = exactCount ?? 0;

    const all = (data ?? []) as unknown as Array<DomainRow & Record<string, unknown>>;

    const valueOf = (row: DomainRow & Record<string, unknown>): number | undefined => {
      if (totalCostSort) {
        const total = row.total_cost;
        if (total !== null && total !== undefined) return Number(total);
        return (Number(row.purchase_price) || 0) + (Number(row.renewal_cost) || 0);
      }

      const rel = row[priceKey];
      if (rel == null) return undefined;
      const rec = Array.isArray(rel)
        ? (rel[0] as Record<string, unknown> | undefined)
        : (rel as Record<string, unknown>);
      if (rec == null) return undefined;
      const p = rec[sortColumn] as number | string | null | undefined;
      return p == null ? undefined : Number(p);
    };

    const sorted = [...all].sort((a, b) => {
      const pa = valueOf(a);
      const pb = valueOf(b);
      if (pa === undefined && pb === undefined) return 0;
      if (pa === undefined) return 1;
      if (pb === undefined) return -1;
      return sortOrder ? pa - pb : pb - pa;
    });

    domains = sorted.slice(from, to) as unknown as DomainRow[];
  } else {
    query = query.order(sortColumn as keyof DomainRow, { ascending: sortOrder }).range(from, to);

    const { data, error, count: exactCount } = await query;
    if (error) throw error;
    count = exactCount ?? 0;
    domains = (data ?? []) as unknown as DomainRow[];
  }

  const reservedExtensions = new Map<string, string[]>();
  if (domains.length > 0) {
    const { data: extData } = await resolved
      .from("domain_extension_checks")
      .select("domain_id, tld")
      .in(
        "domain_id",
        domains.map((d) => d.id)
      )
      .eq("is_reserved", true);

    for (const row of (extData ?? []) as Array<{ domain_id: string; tld: string }>) {
      const list = reservedExtensions.get(row.domain_id) ?? [];
      list.push(row.tld);
      reservedExtensions.set(row.domain_id, list);
    }
  }

  return {
    domains,
    reservedExtensions,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

export async function fetchDomain(id: string) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const {
    data: { user },
  } = await resolved.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await resolved
    .from("domains")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return data as unknown as DomainRow;
}

export async function fetchAllTlds(): Promise<string[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const {
    data: { user },
  } = await resolved.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await resolved.from("domains").select("tld").eq("user_id", user.id);

  if (error) throw error;

  const tldSet = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ tld: string | null }>) {
    if (row.tld) tldSet.add(row.tld);
  }
  const tlds = Array.from(tldSet);
  tlds.sort();
  return tlds;
}

export async function checkExistingDomains(normalizedNames: string[]): Promise<Set<string>> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const {
    data: { user },
  } = await resolved.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await resolved
    .from("domains")
    .select("domain")
    .eq("user_id", user.id)
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

  const {
    data: { user },
  } = await resolved.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await resolved
    .from("domains")
    .select("registrar")
    .eq("user_id", user.id)
    .not("registrar", "is", null)
    .order("registrar");

  if (error) throw error;

  const registrars = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ registrar: string }>) {
    if (row.registrar.trim()) registrars.add(row.registrar.trim());
  }
  return Array.from(registrars);
}
