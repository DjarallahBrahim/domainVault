"use client";

import { WidgetCard } from "@/components/ui/widget-card";

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
  const items = stats
    ? [
        { label: "Avg Price", value: `$${stats.avg_price.toLocaleString("en-US")}` },
        { label: "Top Registrar", value: stats.most_common_registrar },
        { label: "Oldest Domain", value: stats.oldest_domain, mono: true },
        { label: "Newest Domain", value: stats.newest_domain, mono: true },
        { label: "Total Expired", value: String(stats.total_expired) },
        {
          label: "Total Earnings",
          value: `$${stats.total_earnings.toLocaleString("en-US")}`,
        },
      ]
    : [];

  return (
    <WidgetCard title="Quick Stats" loading={stats === null}>
      <div className="divide-y divide-border/50">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
          >
            <span className="text-text-muted">{item.label}</span>
            <span
              className={`max-w-[55%] truncate text-right font-medium ${
                item.mono ? "font-mono text-[13px]" : "tabular-nums"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
