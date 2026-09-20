"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useSensitiveVisibility } from "@/components/dashboard/sensitive-visibility";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";
import { cn } from "@/lib/utils";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";

const money = (n: number) => `$${Math.round(Number(n)).toLocaleString("en-US")}`;

interface TypeBucket {
  name: string;
  count: number;
  revenue: number;
}

export function DashboardSalesTypeDonut() {
  const reduced = useReducedMotion();
  const colors = useChartTheme();
  const { hidden } = useSensitiveVisibility();
  const [mounted, setMounted] = React.useState(false);
  const mask = hidden ? "select-none blur-[8px]" : "";

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

  const totalCount = buckets[0].count + buckets[1].count;
  const palette = [colors.accent, colors.warning];
  const chartData = buckets.filter((b) => b.count > 0);

  if (!mounted || isLoading) {
    return <WidgetCard title="Sales by Type" loading />;
  }

  if (totalCount === 0) {
    return (
      <WidgetCard
        title="Sales by Type"
        empty
        emptyMessage="No sales logged yet"
      />
    );
  }

  return (
    <WidgetCard
      title="Sales by Type"
      description="Inbound vs outbound sale counts"
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
                dataKey="count"
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
                    formatter={(value) =>
                      `${Number(value)} sale${Number(value) === 1 ? "" : "s"}`
                    }
                    footer={(item) => {
                      const bucket = item.payload as unknown as TypeBucket;
                      if (!bucket) return null;
                      return (
                        <div className="text-xs text-text-muted">
                          Revenue {hidden ? "••••" : money(bucket.revenue)}
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
                {totalCount}
              </p>
              <p className="text-xs text-text-muted">
                sale{totalCount === 1 ? "" : "s"}
              </p>
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
              <span className={cn("w-24 text-right font-medium tabular-nums text-text-primary", mask)}>
                {money(bucket.revenue)}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-text-muted">
                {Math.round((bucket.count / totalCount) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
