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
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste domain names here...&#10;e.g. google.com, cloudflare.com&#10;https://example.com/page&#10;Supports URLs, commas, spaces, and newlines"
        className="min-h-[144px] resize-y font-mono text-sm"
        rows={6}
      />
      <div className="flex items-center gap-2 text-sm">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : domainCount > 0 ? (
          <span className="text-muted-foreground">
            {domainCount} {domainCount === 1 ? "domain" : "domains"} detected
          </span>
        ) : value.trim().length > 0 ? (
          <span className="text-muted-foreground">No valid domains found</span>
        ) : (
          <span className="text-muted-foreground">
            Enter domain names or paste a list
          </span>
        )}
        {isLoading && (
          <span className="ml-auto text-xs text-muted-foreground animate-pulse">
            Resolving...
          </span>
        )}
      </div>
    </div>
  );
}
