"use client";

import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";

type PlatformDatum = {
  platform: string;
  sales_count: number;
  total_revenue: number;
  avg_sale_price: number;
};

const money = (n: number) => `$${Number(n).toLocaleString("en-US")}`;

export function DashboardPlatformBreakdown() {
  const reduced = useReducedMotion();
  const colors = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  const empty = !isLoading && (!data || data.length === 0);

  const platformMap = new Map<string, { sales_count: number; total_revenue: number }>();
  for (const s of data ?? []) {
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
    <WidgetCard
      title="Platform Performance"
      description="Revenue by sales platform"
      loading={isLoading}
      empty={empty}
      emptyMessage="No sales data yet"
    >
      <ResponsiveContainer width="100%" height={Math.max(80, 36 + chartData.length * 36)}>
        <BarChart
          data={[...chartData].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke={colors.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="platform"
            tick={{ fontSize: 12, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            width={90}
            tickFormatter={(v) => (v.length > 13 ? `${v.slice(0, 12)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: colors.grid }}
            content={
              <ChartTooltip
                formatter={(value) => money(Number(value))}
                footer={(item) => {
                  const d = item.payload as unknown as PlatformDatum;
                  if (!d) return null;
                  return (
                    <div className="flex justify-between gap-4 text-xs text-text-muted">
                      <span>
                        {d.sales_count} sale{d.sales_count === 1 ? "" : "s"}
                      </span>
                      <span>Avg: ${d.avg_sale_price.toLocaleString("en-US")}</span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar
            dataKey="total_revenue"
            name="Revenue"
            fill={colors.accent}
            radius={[0, 6, 6, 0]}
            maxBarSize={18}
            animationDuration={reduced ? 0 : 600}
          />
        </BarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
}
