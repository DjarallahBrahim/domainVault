"use client";

import { Button } from "@/components/ui/button";
import type { Resolver } from "@/lib/dns/resolve";
import { cn } from "@/lib/utils";

interface ResolverSelectorProps {
  value: Resolver;
  onChange: (value: Resolver) => void;
  disabled: boolean;
}

const RESOLVERS: { value: Resolver; label: string; sub: string }[] = [
  { value: "cloudflare", label: "Cloudflare", sub: "1.1.1.1" },
  { value: "google", label: "Google", sub: "8.8.8.8" },
];

export function ResolverSelector({
  value,
  onChange,
  disabled,
}: ResolverSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground font-mono text-xs uppercase">
        record a (ipv4) / resolver
      </span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {RESOLVERS.map((r) => (
          <Button
            key={r.value}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(r.value)}
            className={cn(
              "rounded-none h-7 px-3 text-xs font-mono gap-2 border-r border-border last:border-r-0",
              value === r.value
                ? "bg-bg-elevated text-text-primary"
                : "text-muted-foreground hover:text-text-primary"
            )}
          >
            <span className="font-semibold">{r.label}</span>
            <span className="text-muted-foreground font-normal">
              {r.sub}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
