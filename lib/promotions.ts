export type BucketKey = "1m" | "3m" | "6m" | "9m" | "9m+";

export const BUCKETS = [
  { key: "1m" as const, label: "≤ 1 month", color: "text-accent-danger" },
  { key: "3m" as const, label: "≤ 3 months", color: "text-accent-warning" },
  { key: "6m" as const, label: "≤ 6 months", color: "text-accent-warning" },
  { key: "9m" as const, label: "≤ 9 months", color: "text-accent-success" },
  { key: "9m+" as const, label: "9+ months", color: "text-accent-success" },
];

function getBucketRange(bucket: BucketKey): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const add = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  switch (bucket) {
    case "1m":
      return { from: fmt(today), to: fmt(add(30)) };
    case "3m":
      return { from: fmt(add(31)), to: fmt(add(90)) };
    case "6m":
      return { from: fmt(add(91)), to: fmt(add(180)) };
    case "9m":
      return { from: fmt(add(181)), to: fmt(add(270)) };
    case "9m+":
      return { from: fmt(add(271)), to: fmt(add(9999)) };
  }
}

export async function fetchCandidates(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  bucket: BucketKey
) {
  const { from, to } = getBucketRange(bucket);

  const { data, error } = await supabase
    .from("domains")
    .select("id, domain, expiration_date")
    .eq("status", "active")
    .gte("expiration_date", from)
    .lte("expiration_date", to)
    .limit(50);

  if (error) throw error;

  const shuffled = [...(data ?? [])].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10) as Array<{
    id: string;
    domain: string;
    expiration_date: string;
  }>;
}

export async function fetchPromotionStats(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  domainIds: string[]
) {
  if (domainIds.length === 0) return {};

  const { data, error } = await supabase
    .from("promotion_events")
    .select("domain_id, promoted_at")
    .in("domain_id", domainIds);

  if (error) throw error;

  const stats: Record<string, { count: number; lastAt: string }> = {};
  for (const row of (data ?? []) as unknown as Array<{
    domain_id: string;
    promoted_at: string;
  }>) {
    if (!stats[row.domain_id]) {
      stats[row.domain_id] = { count: 0, lastAt: "" };
    }
    stats[row.domain_id].count++;
    if (row.promoted_at > stats[row.domain_id].lastAt) {
      stats[row.domain_id].lastAt = row.promoted_at;
    }
  }
  return stats;
}

export async function recordPromotion(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  userId: string,
  domainId: string
) {
  const { error } = await supabase
    .from("promotion_events")
    .insert({ user_id: userId, domain_id: domainId } as never);

  if (error) throw error;
}
