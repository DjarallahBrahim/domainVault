"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { WidgetCard } from "@/components/ui/widget-card";
import { Segmented } from "@/components/ui/segmented";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";
import { cn } from "@/lib/utils";

export function DashboardSalesLeaderboard() {
  const [mode, setMode] = useState<"price" | "roi">("price");
  const [showTop10, setShowTop10] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  const empty = !isLoading && (!data || data.length === 0);

  const sorted = [...(data ?? [])].sort((a, b) => {
    if (mode === "roi") {
      const roiA = a.purchase_price
        ? ((a.sale_price - a.purchase_price) / a.purchase_price) * 100
        : -Infinity;
      const roiB = b.purchase_price
        ? ((b.sale_price - b.purchase_price) / b.purchase_price) * 100
        : -Infinity;
      return roiB - roiA;
    }
    return b.sale_price - a.sale_price;
  });

  const displayed = sorted.slice(0, showTop10 ? 10 : 5);

  return (
    <WidgetCard
      title="Top Sales"
      description={showTop10 ? "Top 10 sales" : "Top 5 sales"}
      loading={isLoading}
      empty={empty}
      emptyMessage="No sales yet"
      action={
        <Segmented
          aria-label="Leaderboard sort"
          options={[
            { value: "price", label: "Price" },
            { value: "roi", label: "Best ROI" },
          ]}
          value={mode}
          onChange={(v) => setMode(v === "roi" ? "roi" : "price")}
        />
      }
    >
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="w-8 pb-2 font-medium text-text-muted">#</th>
              <th className="pb-2 font-medium text-text-muted">Domain</th>
              <th className="pb-2 text-right font-medium text-text-muted">Price</th>
              <th className="pb-2 text-right font-medium text-text-muted">ROI</th>
              <th className="pb-2 text-right font-medium text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((s, i) => {
              const roiPct = s.purchase_price
                ? ((s.sale_price - s.purchase_price) / s.purchase_price) * 100
                : null;
              const isExpanded = expandedId === s.id;
              const holdDays = s.created_at
                ? differenceInDays(parseISO(s.sold_at), parseISO(s.created_at))
                : null;

              return (
                <tr
                  key={s.id}
                  className={cn("border-b border-border/40", !isExpanded && "last:border-0")}
                >
                  <td colSpan={isExpanded ? 5 : 1} className={isExpanded ? "p-0" : "py-0"}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="flex w-full items-center gap-3 rounded-md py-2.5 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="w-8 shrink-0 text-center text-xs font-semibold tabular-nums text-text-muted">
                        {i + 1}
                      </span>
                      <span className="truncate font-mono text-sm">{s.domain}</span>
                      <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                        ${s.sale_price.toLocaleString("en-US")}
                      </span>
                      <span
                        className={cn(
                          "w-16 shrink-0 text-right font-medium tabular-nums",
                          roiPct === null
                            ? "text-text-muted"
                            : roiPct >= 0
                              ? "text-accent-success"
                              : "text-accent-danger"
                        )}
                      >
                        {roiPct !== null ? `${roiPct >= 0 ? "+" : ""}${Math.round(roiPct)}%` : "—"}
                      </span>
                      <span className="w-20 shrink-0 text-right text-text-muted tabular-nums">
                        {format(parseISO(s.sold_at), "MMM d, yy")}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="mb-2 rounded-xl bg-bg-elevated/50 px-12 py-3 text-xs">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-text-muted">Purchase Price</span>
                            <span className="tabular-nums">
                              {s.purchase_price
                                ? `$${s.purchase_price.toLocaleString("en-US")}`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Sale Price</span>
                            <span className="tabular-nums">
                              ${s.sale_price.toLocaleString("en-US")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Profit</span>
                            <span
                              className={cn(
                                "tabular-nums",
                                s.purchase_price
                                  ? s.sale_price - s.purchase_price >= 0
                                    ? "text-accent-success"
                                    : "text-accent-danger"
                                  : "text-text-muted"
                              )}
                            >
                              {s.purchase_price
                                ? `$${(s.sale_price - s.purchase_price).toLocaleString("en-US")}`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Hold Duration</span>
                            <span className="tabular-nums">
                              {holdDays !== null
                                ? `${holdDays} days (${Math.round(holdDays / 30)} months)`
                                : "—"}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-between">
                            <span className="text-text-muted">Platform</span>
                            <span>{s.platform || "—"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!empty && sorted.length > 5 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowTop10(!showTop10)}
            className="text-xs font-medium text-accent-primary transition-colors hover:text-accent-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {showTop10 ? "Show top 5" : "Show top 10"}
          </button>
        </div>
      )}
    </WidgetCard>
  );
}
