import { createClient } from "@/lib/supabase/client";
import { addMonths } from "date-fns";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export async function updatePromotion(promotionId: string, updates: { promoted_at: string }) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("promotions")
    .update({ promoted_at: updates.promoted_at } as never)
    .eq("id", promotionId)
    .eq("user_id", user.id)
    .select("id, promoted_at");

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Update blocked — you may not own this promotion");
  }

  return data;
}

export async function generatePromotionBatch(pool: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartStr = weekStart.toISOString().split("T")[0];

  await supabase
    .from("promotions")
    .delete()
    .eq("user_id", user.id)
    .eq("week_start", weekStartStr);

  let query = supabase
    .from("domains")
    .select("id, domain, registrar, expiration_date")
    .eq("status", "active");

  const now = new Date();
  if (pool === "1m") {
    query = query.lte("expiration_date", addMonths(now, 1).toISOString().split("T")[0]);
  } else if (pool === "3m") {
    query = query.lte("expiration_date", addMonths(now, 3).toISOString().split("T")[0]);
  } else if (pool === "6m") {
    query = query.lte("expiration_date", addMonths(now, 6).toISOString().split("T")[0]);
  } else if (pool === "9m") {
    query = query.lte("expiration_date", addMonths(now, 9).toISOString().split("T")[0]);
  }

  const { data: domains, error } = await query;

  if (error) throw error;

  const rows = (domains ?? []) as unknown as Array<{
    id: string;
    domain: string;
    registrar: string | null;
    expiration_date: string;
  }>;

  if (rows.length < 10) return null;

  const seed = `${user.id}_${weekStartStr}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const shuffled = [...rows].sort((a, b) => {
    const ha = Math.abs(hash ^ hashString(a.domain));
    const hb = Math.abs(hash ^ hashString(b.domain));
    return ha - hb;
  }).slice(0, 10);

  const payload = shuffled.map((d) => ({
    user_id: user.id,
    domain_id: d.id,
    week_start: weekStartStr,
    promoted_at: null,
  }));

  const { error: insertError } = await supabase
    .from("promotions")
    .insert(payload as never);

  if (insertError) throw insertError;

  return shuffled;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface DashboardStats {
  total_active: number;
  portfolio_value: number;
  expiring_90d: number;
  expiring_30d: number;
  sold_this_year: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data: domains, error } = await supabase.from("domains").select("purchase_price, status, expiration_date");
  if (error) throw error;
  const { data: salesRaw, error: sErr } = await supabase.from("sales").select("sold_at");
  if (sErr) throw sErr;
  const sales = (salesRaw ?? []) as unknown as Array<{ sold_at: string }>;
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const rows = (domains ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");
  return {
    total_active: active.length,
    portfolio_value: active.reduce((sum, d) => sum + (d.purchase_price ?? 0), 0),
    expiring_90d: active.filter((d) => {
      const diff = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
      return diff <= 90;
    }).length,
    expiring_30d: active.filter((d) => {
      const diff = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
      return diff <= 30 && diff >= 0;
    }).length,
    sold_this_year: sales.filter((s) => s.sold_at >= yearStart).length,
  };
}

export interface ExpirySegments {
  exp_1m: number; exp_3m: number; exp_6m: number; exp_9m: number;
}

export async function fetchExpirySegments(): Promise<ExpirySegments> {
  const supabase = createClient();
  const { data, error } = await supabase.from("domains").select("expiration_date, status");
  if (error) throw error;
  const active = ((data ?? []) as unknown as DomainRow[]).filter((d) => d.status === "active");
  const now = new Date();
  let e1 = 0, e3 = 0, e6 = 0, e9 = 0;
  for (const d of active) {
    const days = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
    if (days <= 30) e1++;
    else if (days <= 90) e3++;
    else if (days <= 180) e6++;
    else if (days <= 270) e9++;
  }
  return { exp_1m: e1, exp_3m: e3, exp_6m: e6, exp_9m: e9 };
}

export interface RegistrarBreakdown {
  registrar: string; domain_count: number;
}

export async function fetchRegistrarBreakdown(): Promise<RegistrarBreakdown[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("domains").select("registrar, status");
  if (error) throw error;
  const active = ((data ?? []) as unknown as DomainRow[]).filter((d) => d.status === "active");
  const map = new Map<string, number>();
  for (const d of active) {
    const k = d.registrar?.trim() || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([registrar, domain_count]) => ({ registrar, domain_count })).sort((a, b) => b.domain_count - a.domain_count).slice(0, 10);
}

export async function fetchExpiringDomains(limit = 10): Promise<DomainRow[]> {
  const supabase = createClient();
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 31).toISOString().split("T")[0];
  const { data, error } = await supabase.from("domains").select("*").eq("status", "active").lte("expiration_date", end).order("expiration_date", { ascending: true }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as DomainRow[];
}

export async function fetchQuickStats(): Promise<{
  avg_price: number; most_common_registrar: string; oldest_domain: string; newest_domain: string; total_expired: number; total_earnings: number;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.from("domains").select("*");
  if (error) throw error;
  const rows = (data ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");
  const prices = active.map((d) => d.purchase_price ?? 0).filter((p) => p > 0);
  const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const map = new Map<string, number>();
  for (const d of active) { const k = d.registrar?.trim() || "Unknown"; map.set(k, (map.get(k) ?? 0) + 1); }
  let topReg = "Unknown"; let max = 0;
  for (const [k, c] of map) { if (c > max) { max = c; topReg = k; } }
  const sorted = [...active].sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
  const { data: salesRaw } = await supabase.from("sales").select("sale_price");
  const sales = (salesRaw ?? []) as unknown as Array<{ sale_price: number }>;
  return {
    avg_price: Math.round(avg * 100) / 100,
    most_common_registrar: topReg,
    oldest_domain: sorted.length > 0 ? sorted[0].domain : "—",
    newest_domain: sorted.length > 0 ? sorted[sorted.length - 1].domain : "—",
    total_expired: rows.filter((d) => d.status === "expired").length,
    total_earnings: sales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0),
  };
}

export interface PromotionWithDomain {
  id: string;
  user_id: string;
  domain_id: string;
  week_start: string;
  promoted_at: string | null;
  domain: string;
  registrar: string | null;
  expiration_date: string;
  total_promotions: number;
  last_promoted_at: string | null;
}

export async function fetchCurrentPromotions(): Promise<PromotionWithDomain[]> {
  const supabase = createClient();

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select(`
      id,
      user_id,
      domain_id,
      week_start,
      promoted_at,
      domains!inner (
        domain,
        registrar,
        expiration_date
      )
    `)
    .eq("week_start", weekStart)
    .order("domain_id");

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    domain_id: string;
    week_start: string;
    promoted_at: string | null;
    domains: { domain: string; registrar: string | null; expiration_date: string } | null;
  }>;

  if (rows.length === 0) return [];

  const domainIds = rows.map((r) => r.domain_id);

  const { data: history, error: histError } = await supabase
    .from("promotions")
    .select("domain_id, promoted_at")
    .in("domain_id", domainIds)
    .not("promoted_at", "is", null)
    .order("promoted_at", { ascending: false });

  if (histError) throw histError;

  const historyByDomain = new Map<string, { count: number; last: string | null }>();
  for (const h of (history ?? []) as unknown as Array<{ domain_id: string; promoted_at: string | null }>) {
    const entry = historyByDomain.get(h.domain_id) || { count: 0, last: null };
    entry.count++;
    if (h.promoted_at && (!entry.last || h.promoted_at > entry.last)) {
      entry.last = h.promoted_at;
    }
    historyByDomain.set(h.domain_id, entry);
  }

  return rows.map((r) => {
    const hist = historyByDomain.get(r.domain_id);
    return {
      id: r.id,
      user_id: r.user_id,
      domain_id: r.domain_id,
      week_start: r.week_start,
      promoted_at: r.promoted_at,
      domain: r.domains?.domain ?? "",
      registrar: r.domains?.registrar ?? null,
      expiration_date: r.domains?.expiration_date ?? "",
      total_promotions: hist?.count ?? 0,
      last_promoted_at: hist?.last ?? null,
    };
  });
}
