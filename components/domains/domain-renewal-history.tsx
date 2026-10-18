"use client";

import { CalendarClock, History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainRenewalBadge } from "@/components/domains/domain-renewal-badge";
import { useDomainRenewals } from "@/lib/hooks/useDomainRenewals";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

interface DomainRenewalHistoryProps {
  domainId: string;
}

export function DomainRenewalHistory({ domainId }: DomainRenewalHistoryProps) {
  const { data: renewals, isLoading } = useDomainRenewals(domainId);

  const count = renewals?.length ?? 0;
  const totalCost = (renewals ?? []).reduce((sum, renewal) => sum + (renewal.cost ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-accent-primary" />
          Renewal History
          <DomainRenewalBadge count={count} totalCost={totalCost} className="-translate-y-0.5" />
          {count > 0 && (
            <span className="ml-auto text-xs font-normal text-text-muted">
              {formatMoney(totalCost)} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : count === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-text-muted">
            <CalendarClock className="h-4 w-4" />
            No renewals recorded yet. Use “Renew Domain” to log one.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {renewals?.map((renewal) => (
              <div
                key={renewal.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{formatDate(renewal.renewed_at)}</p>
                  <p className="text-xs text-text-muted">
                    {renewal.old_expiration_date ?? "—"} → {renewal.new_expiration_date}
                  </p>
                </div>
                <span className="font-medium tabular-nums">{formatMoney(renewal.cost)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
