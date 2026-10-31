"use client";

import Link from "next/link";
import { WidgetCard } from "@/components/ui/widget-card";
import { useSedoListings } from "@/lib/hooks/useSedoListings";
import { useSpaceshipListings } from "@/lib/hooks/useSpaceshipListings";
import { useAfternicListings } from "@/lib/hooks/useAfternicListings";
import { useAtomListings } from "@/lib/hooks/useAtomListings";

interface MarketplaceCoverageProps {
  totalActive: number;
}

export function DashboardMarketplaceCoverage({ totalActive }: MarketplaceCoverageProps) {
  const { listings: sedo, isLoading: sedoLoading } = useSedoListings();
  const { listings: spaceship, isLoading: spaceshipLoading } = useSpaceshipListings();
  const { listings: afternic, isLoading: afternicLoading } = useAfternicListings();
  const { listings: atom, isLoading: atomLoading } = useAtomListings();

  const loading = sedoLoading || spaceshipLoading || afternicLoading || atomLoading;

  const union = new Set<string>();
  for (const id of sedo.keys()) union.add(id);
  for (const id of spaceship.keys()) union.add(id);
  for (const id of afternic.keys()) union.add(id);
  for (const id of atom.keys()) union.add(id);

  const unlisted = Math.max(0, totalActive - union.size);

  const rows = [
    {
      label: "Sedo",
      count: sedo.size,
      href: "/domains?status=all",
      tone: "text-accent-primary",
    },
    {
      label: "Spaceship",
      count: spaceship.size,
      href: "/domains?status=all",
      tone: "text-accent-primary",
    },
    {
      label: "Afternic",
      count: afternic.size,
      href: "/domains?status=all",
      tone: "text-accent-primary",
    },
    {
      label: "Atom",
      count: atom.size,
      href: "/domains?status=all",
      tone: "text-accent-primary",
    },
    {
      label: "Not listed anywhere",
      count: unlisted,
      href: "/domains?status=active&notListed=sedo,spaceship,afternic,atom",
      tone: "text-accent-warning",
    },
  ];

  return (
    <WidgetCard title="Marketplace Coverage" loading={loading}>
      <div className="divide-y divide-border/50">
        {rows.map((row) => (
          <Link
            key={row.label}
            href={row.href}
            className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors first:pt-0 last:pb-0 hover:text-text-primary"
          >
            <span className="text-text-muted">{row.label}</span>
            <span className={`font-mono font-medium tabular-nums ${row.tone}`}>
              {row.count.toLocaleString("en-US")}
            </span>
          </Link>
        ))}
      </div>
      <p className="pt-3 text-xs text-text-muted">
        {totalActive.toLocaleString("en-US")} active domain
        {totalActive === 1 ? "" : "s"} across your portfolio.
      </p>
    </WidgetCard>
  );
}
