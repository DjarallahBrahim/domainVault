"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSpendVsSold } from "@/lib/supabase/queries/dashboard-client";

type SpendSoldPoint = {
  month: string;
  spend: number;
  sold: number;
};

export function DashboardSpendSoldChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "spend-vs-sold"],
    queryFn: fetchSpendVsSold,
    staleTime: 10 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Spend vs Sold</h3>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">Spend vs Sold</h3>

      <div className="flex items-center justify-center gap-6 mb-3 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]" />
          Spend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--accent-success)]" />
          Sold
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload as SpendSoldPoint;
                return (
                  <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm shadow-lg">
                    <p className="font-medium">{d.month}</p>
                    <p className="text-accent-primary font-medium">
                      Spend: ${d.spend.toLocaleString("en-US")}
                    </p>
                    <p className="text-accent-success font-medium">
                      Sold: ${d.sold.toLocaleString("en-US")}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="spend"
            fill="var(--accent-primary)"
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            minPointSize={1}
          />
          <Bar
            dataKey="sold"
            fill="var(--accent-success)"
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            minPointSize={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
