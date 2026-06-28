"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface QuickStatsData {
  avg_price: number;
  most_common_registrar: string;
  oldest_domain: string;
  newest_domain: string;
  total_expired: number;
  total_earnings: number;
}

interface DashboardQuickStatsProps {
  stats: QuickStatsData | null;
}

export function DashboardQuickStats({ stats }: DashboardQuickStatsProps) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Quick Stats</h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { label: "Avg Price", value: `$${stats.avg_price.toLocaleString("en-US")}` },
    { label: "Top Registrar", value: stats.most_common_registrar },
    { label: "Oldest Domain", value: stats.oldest_domain },
    { label: "Newest Domain", value: stats.newest_domain },
    { label: "Total Expired", value: String(stats.total_expired) },
    { label: "Total Earnings", value: `$${stats.total_earnings.toLocaleString("en-US")}` },
  ];

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">Quick Stats</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{item.label}</span>
            <span className="font-medium font-mono text-right max-w-[160px] truncate">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
