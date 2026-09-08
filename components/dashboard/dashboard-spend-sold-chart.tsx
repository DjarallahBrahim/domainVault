"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useReducedMotion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { fetchSpendVsSold } from "@/lib/supabase/queries/dashboard-client";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";

type SpendSoldPoint = {
  month: string;
  spend: number;
  sold: number;
};

const money = (n: number) => `$${Math.round(Number(n)).toLocaleString("en-US")}`;

export function DashboardSpendSoldChart() {
  const reduced = useReducedMotion();
  const colors = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "spend-vs-sold"],
    queryFn: fetchSpendVsSold,
    staleTime: 10 * 1000,
  });

  const byMonth = new Map((data ?? []).map((d) => [d.month, d]));

  const now = new Date();
  const points: SpendSoldPoint[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, "yyyy-MM");
    const row = byMonth.get(key);
    points.push({
      month: format(d, "MMM yy"),
      spend: row?.spend ?? 0,
      sold: row?.sold ?? 0,
    });
  }

  return (
    <WidgetCard
      title="Spend vs Sold"
      description="Acquisition spend versus sales over the last 3 months"
      loading={isLoading}
    >
      <div className="mb-4 flex items-center justify-center gap-6 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          Spend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
          Sold
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.textMuted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: colors.grid }}
            content={<ChartTooltip formatter={(value) => money(Number(value))} />}
          />
          <Bar
            dataKey="spend"
            name="Spend"
            fill={colors.accent}
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
            animationDuration={reduced ? 0 : 600}
            minPointSize={1}
          />
          <Bar
            dataKey="sold"
            name="Sold"
            fill={colors.success}
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
            animationDuration={reduced ? 0 : 600}
            minPointSize={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </WidgetCard>
  );
}
