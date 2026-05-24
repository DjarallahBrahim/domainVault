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
import {
  fetchCurrentPromotions,
} from "@/lib/supabase/queries/dashboard-client";
import { updatePromotion, generatePromotionBatch } from "@/lib/supabase/queries/dashboard-client";
import { toast } from "sonner";

export function DashboardPromotionTable() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState("3m");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions", "current"],
    queryFn: fetchCurrentPromotions,
    staleTime: 60 * 1000,
  });

  const poolMutation = useMutation({
    mutationFn: (newPool: string) => generatePromotionBatch(newPool),
    onSuccess: (result) => {
      if (result === null) {
        toast.info("Not enough active domains in the selected pool");
      } else {
        toast.success("Promotion batch generated");
      }
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to generate batch", { description: err.message });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (promotionId: string) =>
      updatePromotion(promotionId, { promoted_at: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("Domain promoted ✓");
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = promotions && promotions.length > 0;

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
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Expiring in 1 month</SelectItem>
            <SelectItem value="3m">Expiring in 3 months</SelectItem>
            <SelectItem value="6m">Expiring in 6 months</SelectItem>
            <SelectItem value="9m">Expiring in 9 months</SelectItem>
            <SelectItem value="all">All active domains</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <p className="text-sm text-text-muted">Not enough active domains to fill a promotion list.</p>
      ) : (
        <div className="space-y-1">
          {promotions.map((p) => {
            const promoted = !!p.promoted_at;
            const isConfirming = confirmingId === p.id;

            return (
              <div key={p.id} className="text-sm">
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="font-mono text-xs truncate">{p.domain}</p>
                    <p className="text-[10px] text-text-muted">
                      {p.registrar ?? "—"} · Expires {new Date(p.expiration_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {promoted ? (
                      <span className="text-xs text-accent-success font-medium">Promoted ✓</span>
                    ) : poolMutation.isPending ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setConfirmingId(isConfirming ? null : p.id)}
                      >
                        Promote
                      </Button>
                    )}
                  </div>
                </div>
                {isConfirming && !promoted && (
                  <div className="flex items-center gap-1 py-1 px-2 -mt-1 mb-1 rounded bg-accent-success/10 border border-accent-success/20">
                    <span className="text-xs text-accent-success">✓ Mark as promoted?</span>
                    <Button
                      size="sm"
                      className="h-6 text-xs ml-1"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate(p.id)}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </Button>
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
