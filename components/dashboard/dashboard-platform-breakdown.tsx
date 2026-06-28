"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";

const CHART_COLORS = [
  "#6366f1", "#818cf8", "#a5b4fc", "#8b5cf6",
  "#a78bfa", "#22d3ee", "#67e8f9", "#10b981",
  "#34d399", "#f59e0b",
];

export function DashboardPlatformBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Platform Performance</h3>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Platform Performance</h3>
        <p className="text-sm text-text-muted py-8 text-center">
          No sales data yet
        </p>
      </div>
    );
  }

  const platformMap = new Map<
    string,
    { sales_count: number; total_revenue: number }
  >();
  for (const s of data) {
    const key = s.platform?.trim() || "Other";
    const entry = platformMap.get(key) || { sales_count: 0, total_revenue: 0 };
    entry.sales_count++;
    entry.total_revenue += s.sale_price;
    platformMap.set(key, entry);
  }

  const chartData = Array.from(platformMap.entries())
    .map(([platform, val]) => ({
      platform,
      sales_count: val.sales_count,
      total_revenue: val.total_revenue,
      avg_sale_price: Math.round((val.total_revenue / val.sales_count) * 100) / 100,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">Platform Performance</h3>
      <ResponsiveContainer width="100%" height={Math.max(80, 36 + chartData.length * 36)}>
        <BarChart
          data={[...chartData].reverse()}
          layout="vertical"
          margin={{ left: 80, right: 20, top: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="platform"
            tick={{ fontSize: 11 }}
            width={75}
            tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm shadow-lg">
                    <p className="font-medium">{d.platform}</p>
                    <p className="text-text-muted">
                      {d.sales_count} sale{d.sales_count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-accent-primary font-medium">
                      ${d.total_revenue.toLocaleString("en-US")}
                    </p>
                    <p className="text-xs text-text-muted">
                      Avg: ${d.avg_sale_price.toLocaleString("en-US")}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]} animationDuration={600}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
