"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";

const money = (n: number) => `$${Math.round(Number(n)).toLocaleString("en-US")}`;

const compactMoney = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

interface TypeBucket {
  name: string;
  count: number;
  revenue: number;
}

export function DashboardSalesTypeDonut() {
  const reduced = useReducedMotion();
  const colors = useChartTheme();
  const [mounted, setMounted] = React.useState(false);

  // Theme-dependent colours resolve client-side only; defer the coloured
  // render until after hydration to avoid an SSR mismatch.
  React.useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  const buckets: TypeBucket[] = [
    { name: "Inbound", count: 0, revenue: 0 },
    { name: "Outbound", count: 0, revenue: 0 },
  ];
  for (const sale of data ?? []) {
    const bucket = sale.sale_type === "outbound" ? buckets[1] : buckets[0];
    bucket.count += 1;
    bucket.revenue += sale.sale_price;
  }

  const total = buckets[0].revenue + buckets[1].revenue;
  const palette = [colors.accent, colors.warning];
  const chartData = buckets.filter((b) => b.revenue > 0);

  if (!mounted || isLoading) {
    return <WidgetCard title="Revenue by Sales Type" loading />;
  }

  if (total === 0) {
    return (
      <WidgetCard
        title="Revenue by Sales Type"
        empty
        emptyMessage="No sales logged yet"
      />
    );
  }

  return (
    <WidgetCard
      title="Revenue by Sales Type"
      description="Total revenue for inbound vs outbound"
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={82}
                dataKey="revenue"
                nameKey="name"
                stroke="none"
                animationDuration={reduced ? 0 : 600}
              >
                {chartData.map((bucket) => (
                  <Cell
                    key={bucket.name}
                    fill={palette[buckets.indexOf(bucket)]}
                  />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                content={
                  <ChartTooltip
                    formatter={(value) => money(Number(value))}
                    footer={(item) => {
                      const bucket = item.payload as unknown as TypeBucket;
                      if (!bucket) return null;
                      return (
                        <div className="text-xs text-text-muted">
                          {bucket.count} sale{bucket.count === 1 ? "" : "s"}
                        </div>
                      );
                    }}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
                {compactMoney(total)}
              </p>
              <p className="text-xs text-text-muted">revenue</p>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 space-y-1">
          {buckets.map((bucket, i) => (
            <div
              key={bucket.name}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: palette[i] }}
              />
              <span className="text-text-muted">{bucket.name}</span>
              <span className="ml-auto text-xs tabular-nums text-text-muted">
                {bucket.count} sale{bucket.count === 1 ? "" : "s"}
              </span>
              <span className="w-24 text-right font-medium tabular-nums text-text-primary">
                {money(bucket.revenue)}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-text-muted">
                {Math.round((bucket.revenue / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
