"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { WidgetCard } from "@/components/ui/widget-card";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useChartTheme } from "@/lib/hooks/use-chart-theme";
import { blend } from "@/lib/theme/chart-colors";
import type { ExpirySegments } from "@/lib/supabase/queries/dashboard";

const LABELS = ["≤1 month", "≤3 months", "≤6 months", "≤9 months", ">9 months"];

interface DashboardExpiryDonutProps {
  segments: ExpirySegments | null;
}

export function DashboardExpiryDonut({ segments }: DashboardExpiryDonutProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const colors = useChartTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Theme-dependent chart colours are only resolved client-side (CSS vars).
  // Defer the coloured render until after hydration to avoid SSR mismatch.
  if (segments === null || !mounted) {
    return <WidgetCard title="Expiry Overview" loading />;
  }

  const total = segments.total_active;
  const allZero = total === 0;

  // Semantic urgency ramp: danger → warning → lighter gold → success → neutral
  const palette = [
    colors.danger,
    colors.warning,
    blend(colors.warning, colors.tooltipBg, 0.45),
    colors.success,
    colors.textMuted,
  ];

  const rawData = [
    { name: "≤1 month", value: segments.exp_1m },
    { name: "≤3 months", value: segments.exp_3m },
    { name: "≤6 months", value: segments.exp_6m },
    { name: "≤9 months", value: segments.exp_9m },
    { name: ">9 months", value: segments.exp_over_9m },
  ];

  const chartData = allZero ? [{ name: "Empty", value: 1 }] : rawData.filter((d) => d.value > 0);

  function handleClick(entry: { name: string }) {
    const map: Record<string, string> = {
      "≤1 month": "1m",
      "≤3 months": "3m",
      "≤6 months": "6m",
      "≤9 months": "9m",
    };
    const param = map[entry.name];
    if (param) router.push(`/domains?expiry=${param}`);
  }

  return (
    <WidgetCard
      title="Expiry Overview"
      description="Active domains by time until expiry"
      empty={allZero}
      emptyMessage="No active domains in your portfolio"
    >
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={82}
                dataKey="value"
                stroke="none"
                animationDuration={reduced ? 0 : 600}
                onClick={(_, i) => handleClick(chartData[i])}
                style={{ cursor: "pointer" }}
              >
                {chartData.map((d, _) => {
                  const origIndex = rawData.findIndex((r) => r.name === d.name);
                  return <Cell key={d.name} fill={palette[origIndex >= 0 ? origIndex : 0]} />;
                })}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                content={
                  <ChartTooltip
                    formatter={(value) =>
                      `${Number(value)} domain${Number(value) === 1 ? "" : "s"}`
                    }
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
                {total}
              </p>
              <p className="text-xs text-text-muted">active</p>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 space-y-1">
          {rawData.map((d, i) => {
            const zero = d.value === 0;
            return (
              <button
                key={d.name}
                type="button"
                disabled={zero}
                onClick={() => handleClick(d)}
                className={
                  zero
                    ? "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-muted/40 line-through"
                    : "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                }
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: palette[i],
                    opacity: zero ? 0.4 : 1,
                  }}
                />
                <span className="w-20 text-left text-text-muted">{LABELS[i]}</span>
                <span className="font-medium tabular-nums text-text-primary">{d.value}</span>
                <span className="ml-auto text-xs tabular-nums text-text-muted">
                  {zero ? "(0%)" : `${Math.round((d.value / total) * 100)}%`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}
