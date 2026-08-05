"use client";

import { ExternalLink } from "lucide-react";

interface TldDropdownProps {
  domainId: string;
  domainName: string;
  open: boolean;
  reservedExtensions: string[];
}

export function TldDropdown({
  domainName,
  open,
  reservedExtensions,
}: TldDropdownProps) {
  if (!open) return null;

  if (!reservedExtensions.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground font-mono">
        No reserved TLDs
      </div>
    );
  }

  const root = domainName.includes(".")
    ? domainName.split(".")[0]
    : domainName;

  return (
    <div className="max-h-64 overflow-y-auto">
      {reservedExtensions.map((tld) => (
        <a
          key={tld}
          href={`https://${root}.${tld}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-elevated transition-colors border-b border-border last:border-0"
        >
          <span className="font-mono text-foreground">
            .{tld}
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-mono truncate max-w-[120px]">
              {root}.{tld}
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
          </div>
        </a>
      ))}
    </div>
  );
}
