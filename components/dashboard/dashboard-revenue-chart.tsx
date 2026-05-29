"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
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
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";

type RevenueMonth = {
  month: string;
  revenue: number;
  count: number;
  cumulative: number;
};

export function DashboardRevenueChart() {
  const [range, setRange] = useState<"12M" | "24M" | "all">("12M");

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Revenue Over Time</h3>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Revenue Over Time</h3>
        <p className="text-sm text-text-muted py-8 text-center">
          No sales data yet
        </p>
      </div>
    );
  }

  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  for (const s of data) {
    const key = format(parseISO(s.sold_at), "yyyy-MM");
    const entry = monthlyMap.get(key) || { revenue: 0, count: 0 };
    entry.revenue += s.sale_price;
    entry.count++;
    monthlyMap.set(key, entry);
  }

  const allMonths: RevenueMonth[] = [];
  let cumulative = 0;
  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [key, val] of sortedMonths) {
    cumulative += val.revenue;
    allMonths.push({
      month: format(parseISO(key + "-01"), "MMM yy"),
      revenue: val.revenue,
      count: val.count,
      cumulative,
    });
  }

  const filtered =
    range === "all"
      ? allMonths
      : allMonths.slice(-(range === "12M" ? 12 : 24));

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Revenue Over Time</h3>
        <div className="flex gap-1">
          {(["12M", "24M", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs rounded-md border transition ${
                range === r
                  ? "bg-accent-primary text-white border-accent-primary"
                  : "border-border text-text-muted hover:text-text-primary"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={filtered} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload as RevenueMonth;
                return (
                  <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm shadow-lg">
                    <p className="font-medium">{d.month}</p>
                    <p className="text-text-muted">
                      {d.count} sale{d.count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-accent-primary font-medium">
                      ${d.revenue.toLocaleString()}
                    </p>
                    <p className="text-accent-success text-xs">
                      Cumulative: ${d.cumulative.toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            fill="var(--accent-primary)"
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            minPointSize={1}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="var(--accent-success)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
