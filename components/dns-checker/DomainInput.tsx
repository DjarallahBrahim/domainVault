"use client";

import { Textarea } from "@/components/ui/textarea";

interface DomainInputProps {
  value: string;
  onChange: (value: string) => void;
  domainCount: number;
  error: string | null;
  isLoading: boolean;
}

export function DomainInput({
  value,
  onChange,
  domainCount,
  error,
  isLoading,
}: DomainInputProps) {
  return (
    <div className="space-y-1.5">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="google.com&#10;cloudflare.com&#10;github.com"
        className="min-h-[120px] resize-y font-mono text-sm leading-relaxed border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
        rows={5}
      />
      <div className="flex items-center gap-2 text-xs font-mono">
        {error ? (
          <span className="text-accent-danger">↳ {error}</span>
        ) : domainCount > 0 ? (
          <span className="text-muted-foreground">
            ↳ {domainCount} {domainCount === 1 ? "line" : "lines"} parsed
          </span>
        ) : value.trim().length > 0 ? (
          <span className="text-muted-foreground">
            ↳ No valid domains found
          </span>
        ) : (
          <span className="text-muted-foreground">
            ↳ One per line — commas, spaces, or full URLs accepted
          </span>
        )}
        {isLoading && (
          <span className="ml-auto text-xs text-muted-foreground animate-pulse">
            resolving...
          </span>
        )}
      </div>
    </div>
  );
}
