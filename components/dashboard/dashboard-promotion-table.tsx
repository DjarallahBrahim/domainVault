"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCurrentPromotions } from "@/lib/supabase/queries/dashboard-client";
import { updatePromotion, generatePromotionBatch } from "@/lib/supabase/queries/dashboard-client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const POOL_OPTIONS = [
  { value: "1m", label: "Expiring in 1 month" },
  { value: "3m", label: "Expiring in 3 months" },
  { value: "6m", label: "Expiring in 6 months" },
  { value: "9m", label: "Expiring in 9 months" },
  { value: "all", label: "All active domains" },
];

export function DashboardPromotionTable() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState("3m");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions", "current"],
    queryFn: fetchCurrentPromotions,
  });

  const hasData = promotions && promotions.length > 0;

  const poolMutation = useMutation({
    mutationFn: (newPool: string) => generatePromotionBatch(newPool),
    onSuccess: (result) => {
      if (result === null) {
        toast.info("Need at least 10 active domains in this pool");
      } else {
        toast.success(`${result.count} domains ready to promote`);
      }
      queryClient.invalidateQueries({ queryKey: ["promotions", "current"] });
      queryClient.refetchQueries({ queryKey: ["promotions", "current"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to generate batch", { description: err.message });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (promotionId: string) =>
      updatePromotion(promotionId, { promoted_at: new Date().toISOString() }),
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        toast.error("Promotion not saved — refresh and try again");
      } else {
        toast.success("Domain promoted ✓");
      }
      queryClient.invalidateQueries({ queryKey: ["promotions", "current"] });
      queryClient.refetchQueries({ queryKey: ["promotions", "current"] });
      setConfirmingId(null);
    },
    onError: (err: Error) => {
      toast.error("Failed to promote", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Domains to Promote This Week</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Domains to Promote This Week</h3>
        <Select
          value={pool}
          onValueChange={(v) => {
            setPool(v);
            poolMutation.mutate(v);
          }}
        >
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POOL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
          <Sparkles className="h-8 w-8 text-text-muted/50" />
          <p className="text-sm text-text-muted">
            Not enough active domains to fill a promotion list.
          </p>
          <p className="text-xs text-text-muted/70">
            Try switching to <span className="text-accent-primary">"All active domains"</span> above, or add more domains to your portfolio.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {promotions.map((p) => {
            const promotedThisWeek = !!p.promoted_at;
            const isConfirming = confirmingId === p.id;
            const days = Math.ceil(
              (new Date(p.expiration_date).getTime() - Date.now()) / 86400000
            );
            const lastDate = p.last_promoted_at
              ? new Date(p.last_promoted_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : null;
            const totalPromos = p.total_promotions;

            return (
              <div key={p.id} className="text-sm">
                <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono truncate text-sm">{p.domain}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {p.registrar ?? "—"} · {days > 0 ? `${days}d` : "expired"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {poolMutation.isPending ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-sm"
                        onClick={() => setConfirmingId(isConfirming ? null : p.id)}
                      >
                        Promote
                      </Button>
                    )}
                  </div>
                </div>
                {isConfirming && (
                  <div className="flex items-center gap-2 py-2 px-3 -mt-1 mb-1 rounded bg-accent-success/10 border border-accent-success/20">
                    <span className="text-sm text-accent-success">
                      {promotedThisWeek
                        ? "✓ Already promoted this week — promote again?"
                        : "✓ Mark as promoted?"}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-sm"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate(p.id)}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {totalPromos > 0 && (
                  <div className="flex items-center gap-1 py-0.5 -mt-1 text-xs text-text-muted">
                    <span className="text-accent-success/70">
                      Promoted {totalPromos}×{lastDate ? ` (last: ${lastDate})` : ""}
                      {promotedThisWeek ? " · this week ✓" : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
