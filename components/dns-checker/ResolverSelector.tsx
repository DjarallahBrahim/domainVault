"use client";

import { Button } from "@/components/ui/button";
import type { Resolver } from "@/lib/dns/resolve";

interface ResolverSelectorProps {
  value: Resolver;
  onChange: (value: Resolver) => void;
  disabled: boolean;
}

export function ResolverSelector({
  value,
  onChange,
  disabled,
}: ResolverSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Resolver:</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        <Button
          type="button"
          variant={value === "cloudflare" ? "default" : "ghost"}
          size="sm"
          className="rounded-none"
          disabled={disabled}
          onClick={() => onChange("cloudflare")}
        >
          Cloudflare
        </Button>
        <Button
          type="button"
          variant={value === "google" ? "default" : "ghost"}
          size="sm"
          className="rounded-none border-l border-border"
          disabled={disabled}
          onClick={() => onChange("google")}
        >
          Google
        </Button>
      </div>
    </div>
  );
}
