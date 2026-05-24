"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ExpirySegments } from "@/lib/supabase/queries/dashboard";

const COLORS = ["#ef4444", "#f59e0b", "#eab308", "#10b981"];
const LABELS = ["≤1 month", "≤3 months", "≤6 months", "≤9 months"];

interface DashboardExpiryDonutProps {
  segments: ExpirySegments | null;
}

export function DashboardExpiryDonut({ segments }: DashboardExpiryDonutProps) {
  const router = useRouter();

  if (!segments) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Expiry Overview</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse h-48 w-48 rounded-full bg-bg-elevated" />
        </div>
      </div>
    );
  }

  const data = [
    { name: "≤1 month", value: segments.exp_1m },
    { name: "≤3 months", value: segments.exp_3m },
    { name: "≤6 months", value: segments.exp_6m },
    { name: "≤9 months", value: segments.exp_9m },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const allZero = total === 0;

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
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">Expiry Overview</h3>
      {allZero ? (
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">
          No expiring domains — your portfolio is in great shape 🎉
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative w-48 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  animationDuration={600}
                  onClick={(_, i) => handleClick(data[i])}
                  style={{ cursor: "pointer" }}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-text-muted">{d.value} domain{d.value !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-[10px] text-text-muted">total</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-text-muted w-16">{LABELS[i]}</span>
                <span className="font-medium">{d.value}</span>
                <span className="text-text-muted">
                  ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
