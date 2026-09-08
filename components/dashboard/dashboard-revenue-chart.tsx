"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useReducedMotion } from "motion/react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { Segmented } from "@/components/ui/segmented";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";

type RevenueMonth = {
  month: string;
  revenue: number;
  count: number;
  cumulative: number;
};

const COUNT_SCALE = 100;
const RANGE_OPTIONS = [
  { value: "12M", label: "12M" },
  { value: "24M", label: "24M" },
  { value: "all", label: "All" },
] as const;

const money = (n: number) => `$${Math.round(Number(n)).toLocaleString("en-US")}`;

export function DashboardRevenueChart() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["value"]>("12M");
  const reduced = useReducedMotion();
  const colors = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  for (const s of data ?? []) {
    const key = format(parseISO(s.sold_at), "yyyy-MM");
    const entry = monthlyMap.get(key) || { revenue: 0, count: 0 };
    entry.revenue += s.sale_price;
    entry.count++;
    monthlyMap.set(key, entry);
  }

  const allMonths: RevenueMonth[] = [];
  let cumulative = 0;
  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [key, val] of sortedMonths) {
    cumulative += val.revenue;
    allMonths.push({
      month: format(parseISO(key + "-01"), "MMM yy"),
      revenue: val.revenue,
      count: val.count,
      cumulative,
    });
  }

  const filtered = range === "all" ? allMonths : allMonths.slice(-(range === "12M" ? 12 : 24));

  const chartData = filtered.map((d) => ({
    ...d,
    countScaled: d.count * COUNT_SCALE,
  }));

  const empty = !isLoading && chartData.length === 0;

  return (
    <WidgetCard
      title="Revenue Over Time"
      description="Monthly revenue with sales volume and cumulative trend"
      loading={isLoading}
      empty={empty}
      emptyMessage="No sales data yet"
      action={
        <Segmented
          aria-label="Revenue range"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      }
    >
      <div className="mb-4 flex items-center justify-center gap-6 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.warning }} />
          Sales #
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 border-t-2"
            style={{ borderColor: colors.success }}
          />
          Cumulative
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: colors.grid }}
            content={
              <ChartTooltip
                formatter={(value, item) =>
                  item.dataKey === "countScaled"
                    ? `${Math.round(Number(value) / COUNT_SCALE)} sale${
                        Math.round(Number(value) / COUNT_SCALE) === 1 ? "" : "s"
                      }`
                    : money(Number(value))
                }
              />
            }
          />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            stackId="a"
            fill={colors.accent}
            radius={[0, 0, 0, 0]}
            maxBarSize={28}
            animationDuration={reduced ? 0 : 600}
            minPointSize={1}
          />
          <Bar
            yAxisId="left"
            dataKey="countScaled"
            name="Sales #"
            stackId="a"
            fill={colors.warning}
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
            animationDuration={reduced ? 0 : 600}
            minPointSize={1}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            name="Cumulative"
            stroke={colors.success}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={reduced ? 0 : 600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
}
