"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RegistrarBreakdown } from "@/lib/supabase/queries/dashboard";

const CHART_COLORS = [
  "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe",
  "#8b5cf6", "#a78bfa", "#c4b5fd", "#22d3ee",
  "#67e8f9", "#a5f3fc",
];

interface DashboardRegistrarChartProps {
  data: RegistrarBreakdown[] | null;
}

export function DashboardRegistrarChart({ data }: DashboardRegistrarChartProps) {
  const router = useRouter();

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Registrar Breakdown</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse space-y-3 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 bg-bg-elevated rounded" style={{ width: `${80 - i * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Registrar Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">
          No registrar data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.domain_count, 0);
  const chartData = [...data].reverse();

  function handleClick(entry: RegistrarBreakdown) {
    if (entry.registrar !== "Unknown") {
      router.push(`/domains?registrar=${encodeURIComponent(entry.registrar)}`);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">Registrar Breakdown</h3>
      <ResponsiveContainer width="100%" height={Math.max(100, 48 + data.length * 36)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 110, right: 20, top: 4, bottom: 4 }}
          onClick={(e) => {
            if (e?.activePayload?.length) {
              handleClick(e.activePayload[0].payload);
            }
          }}
        >
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="registrar"
            tick={{ fontSize: 12 }}
            width={105}
            tickFormatter={(v) => v.length > 14 ? `${v.slice(0, 13)}…` : v}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const d = payload[0].payload as RegistrarBreakdown;
                const pct = total > 0 ? Math.round((d.domain_count / total) * 100) : 0;
                return (
                  <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm shadow-lg">
                    <p className="font-medium">{d.registrar}</p>
                    <p className="text-text-muted">
                      {d.domain_count} domain{d.domain_count !== 1 ? "s" : ""} ({pct}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="domain_count" radius={[0, 4, 4, 0]} animationDuration={600}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
