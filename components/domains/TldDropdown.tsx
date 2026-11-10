"use client";

import { ExternalLink } from "lucide-react";
import type { TldStatus } from "@/lib/tld-checker/tldDiff";
import { cn } from "@/lib/utils";

interface TldDropdownProps {
  domainId: string;
  domainName: string;
  open: boolean;
  reservedExtensions: TldStatus[];
  addedTlds?: Set<string> | null;
  removedTlds?: string[];
}

/**
 * Row order inside the dropdown:
 * 0. the domain's own extension (e.g. .si for test.si)
 * 1. newly reserved TLDs
 * 2. dropped TLDs (crossed out, excluded from the count)
 * 3. existing live websites (green dot)
 * 4. offline TLDs (red dot)
 */
type Row =
  | { kind: "reserved"; tld: string; isLive: boolean; isNew: boolean; tier: number }
  | { kind: "removed"; tld: string; tier: number };

export function TldDropdown({
  domainName,
  open,
  reservedExtensions,
  addedTlds,
  removedTlds = [],
}: TldDropdownProps) {
  if (!open) return null;

  if (!reservedExtensions.length && !removedTlds.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground font-mono">
        No reserved TLDs
      </div>
    );
  }

  const root = domainName.includes(".") ? domainName.split(".")[0] : domainName;
  const currentExtension = domainName.includes(".") ? domainName.split(".").slice(1).join(".") : "";

  const rows: Row[] = reservedExtensions.map(({ tld, isLive }) => ({
    kind: "reserved",
    tld,
    isLive,
    isNew: addedTlds?.has(tld) ?? false,
    tier: tld === currentExtension ? 0 : addedTlds?.has(tld) ? 1 : isLive ? 3 : 4,
  }));

  for (const tld of removedTlds) {
    rows.push({ kind: "removed", tld, tier: 2 });
  }

  rows.sort((a, b) => a.tier - b.tier || a.tld.localeCompare(b.tld));

  return (
    <div className="max-h-64 overflow-y-auto">
      {rows.map((row) =>
        row.kind === "reserved" ? (
          <a
            key={row.tld}
            href={`https://${root}.${row.tld}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-elevated transition-colors border-b border-border last:border-0"
          >
            <span className="flex items-center gap-1.5 font-mono">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  row.isLive ? "bg-accent-success" : "bg-accent-danger"
                )}
                title={row.isLive ? "Live website" : "Reserved · offline"}
              />
              <span
                className={cn(row.isNew ? "text-accent-primary" : "text-foreground")}
                title={row.isNew ? "Newly reserved" : undefined}
              >
                .{row.tld}
              </span>
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs font-mono truncate max-w-[120px]">
                {root}.{row.tld}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
            </div>
          </a>
        ) : (
          <div
            key={`removed-${row.tld}`}
            title="No longer reserved"
            className="flex items-center justify-between px-3 py-2 text-sm border-b border-border last:border-0 bg-muted/40"
          >
            <span className="font-mono text-muted-foreground line-through">.{row.tld}</span>
            <span className="text-xs font-mono text-muted-foreground opacity-60">
              {root}.{row.tld}
            </span>
          </div>
        )
      )}
    </div>
  );
}
