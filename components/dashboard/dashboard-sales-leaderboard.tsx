"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSalesAnalytics } from "@/lib/supabase/queries/dashboard-client";

export function DashboardSalesLeaderboard() {
  const [showTop10, setShowTop10] = useState(false);
  const [sortByROI, setSortByROI] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", "analytics"],
    queryFn: fetchSalesAnalytics,
    staleTime: 10 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Top Sales</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Top Sales</h3>
        <p className="text-sm text-text-muted py-4 text-center">No sales yet</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => {
    if (sortByROI) {
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

  const limit = showTop10 ? 10 : 5;
  const displayed = sorted.slice(0, limit);

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Top Sales</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setShowTop10(!showTop10)}
            className="text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-primary"
          >
            {showTop10 ? "Top 5" : "Top 10"}
          </button>
          <button
            onClick={() => setSortByROI(!sortByROI)}
            className={`text-xs px-2 py-0.5 rounded border transition ${
              sortByROI
                ? "bg-accent-primary text-white border-accent-primary"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
          >
            Best ROI
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-text-muted w-8">#</th>
              <th className="pb-2 font-medium text-text-muted">Domain</th>
              <th className="pb-2 font-medium text-text-muted text-right">Price</th>
              <th className="pb-2 font-medium text-text-muted text-right">ROI</th>
              <th className="pb-2 font-medium text-text-muted text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((s, i) => {
              const roiPct = s.purchase_price
                ? ((s.sale_price - s.purchase_price) / s.purchase_price) * 100
                : null;
              const isExpanded = expandedId === s.id;
              const holdDays =
                s.created_at
                  ? differenceInDays(parseISO(s.sold_at), parseISO(s.created_at))
                  : null;

              return (
                <tr key={s.id} className="border-b border-border/50">
                  <td colSpan={isExpanded ? 5 : 1} className={isExpanded ? "p-0" : ""}>
                    <div
                      className={`flex items-center gap-3 py-2 cursor-pointer hover:bg-bg-elevated/30 ${isExpanded ? "px-0" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <span className="text-text-muted w-8 text-center">{i + 1}</span>
                      <span className="font-mono truncate flex-1">{s.domain}</span>
                      <span className="text-right w-20">
                        ${s.sale_price.toLocaleString("en-US")}
                      </span>
                      <span
                        className={`text-right w-16 ${
                          roiPct === null
                            ? "text-text-muted"
                            : roiPct >= 0
                            ? "text-accent-success"
                            : "text-accent-danger"
                        }`}
                      >
                        {roiPct !== null
                          ? `${roiPct >= 0 ? "+" : ""}${Math.round(roiPct)}%`
                          : "—"}
                      </span>
                      <span className="text-right w-24 text-text-muted">
                        {format(parseISO(s.sold_at), "MMM d, yy")}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="bg-bg-elevated/50 px-4 py-3 text-xs space-y-1 border-t border-border/30">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Purchase Price</span>
                          <span>
                            {s.purchase_price
                              ? `$${s.purchase_price.toLocaleString("en-US")}`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Sale Price</span>
                          <span>${s.sale_price.toLocaleString("en-US")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Profit</span>
                          <span
                            className={
                              s.purchase_price
                                ? s.sale_price - s.purchase_price >= 0
                                  ? "text-accent-success"
                                  : "text-accent-danger"
                                : "text-text-muted"
                            }
                          >
                            {s.purchase_price
                              ? `$${(s.sale_price - s.purchase_price).toLocaleString("en-US")}`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Hold Duration</span>
                          <span>
                            {holdDays !== null
                              ? `${holdDays} days (${Math.round(holdDays / 30)} months)`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Platform</span>
                          <span>{s.platform || "—"}</span>
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
    </div>
  );
}
