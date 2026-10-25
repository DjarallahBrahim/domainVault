"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  ArrowRight,
  Banknote,
  CalendarPlus,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/ui/stat-card";
import { fetchMonthSnapshot } from "@/lib/supabase/queries/dashboard-client";

type SnapshotView = "invested" | "sold";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function DashboardMonthSnapshot() {
  const [view, setView] = useState<SnapshotView | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "month-snapshot"],
    queryFn: fetchMonthSnapshot,
    staleTime: 10 * 1000,
  });

  const title = data?.month ?? "This month";
  const acquiredDomains = data?.acquiredDomains ?? [];
  const soldDomains = data?.soldDomains ?? [];
  const isInvested = view === "invested";

  const rangeStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const cells = [
    {
      key: "invested",
      label: "Invested",
      icon: Wallet,
      accent: "primary" as const,
      prefix: "$",
      value: data?.invested ?? 0,
      valueClassName: "text-text-primary",
      sub: data
        ? `${data.acquiredCount} domain${data.acquiredCount === 1 ? "" : "s"} acquired`
        : null,
      onClick: data ? () => setView("invested") : undefined,
    },
    {
      key: "renewedCount",
      label: "Renewed",
      icon: RefreshCw,
      accent: "primary" as const,
      value: data?.renewedCount ?? 0,
      sub: null,
      onClick: undefined,
    },
    {
      key: "renewalCost",
      label: "Renewal Cost",
      icon: CreditCard,
      accent: "danger" as const,
      prefix: "$",
      value: data?.renewalCost ?? 0,
      sub: null,
      onClick: undefined,
    },
    {
      key: "soldCount",
      label: "Sold",
      icon: ShoppingCart,
      accent: "warning" as const,
      value: data?.soldCount ?? 0,
      sub: null,
      onClick: data ? () => setView("sold") : undefined,
    },
    {
      key: "revenue",
      label: "Revenue",
      icon: Banknote,
      accent: "success" as const,
      prefix: "$",
      value: data?.revenue ?? 0,
      sub: null,
      onClick: undefined,
    },
  ];

  return (
    <>
      <section className="rounded-3xl bg-bg-surface p-6 shadow-card ring-1 ring-border/50">
        <header className="mb-5">
          <h2 className="text-section text-text-primary">{title} Snapshot</h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cells.map((cell) => (
            <StatCard
              key={cell.key}
              label={cell.label}
              icon={cell.icon}
              accent={cell.accent}
              prefix={cell.prefix}
              value={cell.value}
              sub={cell.sub}
              loading={isPending}
              size="md"
              valueClassName={cell.valueClassName}
              onClick={cell.onClick}
            />
          ))}
        </div>
      </section>

      <Dialog
        open={view !== null}
        onOpenChange={(open) => {
          if (!open) setView(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isInvested ? (
                <CalendarPlus className="h-5 w-5 text-accent-primary" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-accent-warning" />
              )}
              {isInvested ? `New domains in ${title}` : `Domains sold in ${title}`}
            </DialogTitle>
            <DialogDescription>
              {isInvested
                ? `${acquiredDomains.length} domain${
                    acquiredDomains.length === 1 ? "" : "s"
                  } acquired · ${formatMoney(data?.invested ?? 0)} invested`
                : `${soldDomains.length} sale${
                    soldDomains.length === 1 ? "" : "s"
                  } · ${formatMoney(data?.revenue ?? 0)} revenue`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {isInvested ? (
              acquiredDomains.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                  <Wallet className="h-4 w-4" />
                  No domains acquired this month.
                </div>
              ) : (
                acquiredDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-bg-elevated/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/domains/${domain.id}`}
                        className="block truncate font-mono text-sm font-medium text-accent-primary hover:underline"
                      >
                        {domain.domain}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Added {formatDate(domain.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMoney(domain.purchase_price ?? 0)}
                    </span>
                  </div>
                ))
              )
            ) : soldDomains.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                <ShoppingCart className="h-4 w-4" />
                No domains sold this month.
              </div>
            ) : (
              soldDomains.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-bg-elevated/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    {sale.domain_id ? (
                      <Link
                        href={`/domains/${sale.domain_id}`}
                        className="block truncate font-mono text-sm font-medium text-accent-primary hover:underline"
                      >
                        {sale.domain_name}
                      </Link>
                    ) : (
                      <p className="truncate font-mono text-sm font-medium">{sale.domain_name}</p>
                    )}
                    <p className="mt-0.5 text-xs text-text-muted">
                      Sold {formatDate(sale.sold_at)}
                      {sale.buyer ? ` · ${sale.buyer}` : ""}
                      {sale.platform ? ` · ${sale.platform}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-accent-success tabular-nums">
                    {formatMoney(sale.sale_price)}
                  </span>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button asChild variant="outline" size="sm">
              <Link
                href={
                  isInvested
                    ? "/domains?status=all&created=1m"
                    : `/sales?startDate=${rangeStart}&endDate=${rangeEnd}`
                }
              >
                View all {isInvested ? "new domains" : "sales"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
