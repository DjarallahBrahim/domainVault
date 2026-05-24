"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (!domains) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">Critical Renewals</h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const expiring = domains.filter((d) => {
    const diff = (new Date(d.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Critical Renewals</h3>
        {expiring.length > 0 && (
          <Link href="/domains?expiry=1m" className="text-xs text-accent-primary hover:underline">
            View All
          </Link>
        )}
      </div>
      {expiring.length === 0 ? (
        <p className="text-sm text-text-muted">All clear — nothing expiring this month</p>
      ) : (
        <div className="space-y-2">
          {expiring.slice(0, 10).map((d) => {
            const days = Math.ceil(
              (new Date(d.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isRenewing = renewingId === d.id;

            return (
              <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs truncate">{d.domain}</p>
                  {isRenewing && (
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="h-7 text-xs w-32"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!newDate || renewMutation.isPending}
                        onClick={() => renewMutation.mutate({ id: d.id, date: newDate })}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setRenewingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    days <= 7 ? "bg-accent-danger/10 text-accent-danger" :
                    days <= 14 ? "bg-accent-warning/10 text-accent-warning" :
                    "bg-bg-elevated text-text-muted"
                  }`}>
                    {days}d
                  </span>
                  <button
                    onClick={() => { setRenewingId(isRenewing ? null : d.id); setNewDate(""); }}
                    className="text-xs text-accent-primary hover:underline"
                  >
                    Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
