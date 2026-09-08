"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WidgetCard } from "@/components/ui/widget-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDomain } from "@/lib/supabase/queries/domains-client";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DashboardCriticalRenewalsProps {
  domains: DomainRow[] | null;
}

export function DashboardCriticalRenewals({ domains }: DashboardCriticalRenewalsProps) {
  const queryClient = useQueryClient();
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  const renewMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      updateDomain(id, { expiration_date: date } as never),
    onSuccess: () => {
      toast.success("Domain renewed");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      setRenewingId(null);
      setNewDate("");
    },
    onError: (err: Error) => {
      toast.error("Failed to renew", { description: err.message });
    },
  });

  const expiring = (domains ?? []).filter((d) => {
    const diff = (new Date(d.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  return (
    <WidgetCard
      title="Critical Renewals"
      description="Expiring in the next 30 days"
      loading={domains === null}
      empty={domains !== null && expiring.length === 0}
      emptyMessage="All clear — nothing expiring this month"
      action={
        expiring.length > 0 ? (
          <Link
            href="/domains?expiry=1m"
            className="text-sm font-medium text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View All
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-1">
        {expiring.slice(0, 10).map((d) => {
          const days = Math.ceil(
            (new Date(d.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const isRenewing = renewingId === d.id;

          return (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-foreground/5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono">{d.domain}</p>
                {isRenewing && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="h-8 w-36 text-sm"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-sm"
                      disabled={!newDate || renewMutation.isPending}
                      onClick={() => renewMutation.mutate({ id: d.id, date: newDate })}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-sm"
                      onClick={() => setRenewingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={days <= 7 ? "danger" : days <= 14 ? "warning" : "neutral"}>
                  {days}d
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    setRenewingId(isRenewing ? null : d.id);
                    setNewDate("");
                  }}
                  className="text-sm font-medium text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {isRenewing ? "Close" : "Renew"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
