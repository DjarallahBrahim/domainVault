"use client";

import { Globe, Loader2, ShieldAlert, XCircle } from "lucide-react";
import type { TldReservedState } from "@/lib/hooks/useTldReservedAnalysis";

export function TldReservedHint({ state }: { state: TldReservedState }) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-bg-elevated border border-border">
        <Loader2 className="h-4 w-4 text-text-muted shrink-0 animate-spin" />
        <p className="text-sm text-text-muted">
          Checking reserved TLD variants… (DNS, this can take a few seconds)
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-accent-danger/10 border border-accent-danger/20">
        <XCircle className="h-4 w-4 text-accent-danger shrink-0 mt-0.5" />
        <p className="text-sm text-accent-danger">
          TLD check failed — {state.message}. You can still add the domain and
          refresh its TLDs later.
        </p>
      </div>
    );
  }

  if (state.reserved.length === 0) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-bg-elevated border border-border">
        <Globe className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
        <p className="text-sm text-text-primary">
          No reserved TLD variants found for{" "}
          <span className="font-medium">&quot;{state.root}&quot;</span> across{" "}
          {state.checked} TLDs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-accent-warning/10 border border-accent-warning/20">
      <ShieldAlert className="h-4 w-4 text-accent-warning shrink-0 mt-0.5" />
      <p className="text-sm text-text-primary">
        <span className="font-medium text-accent-warning">
          {state.reserved.length}
        </span>{" "}
        of {state.checked} TLDs are already registered for{" "}
        <span className="font-medium">&quot;{state.root}&quot;</span>. Saved to
        the domain automatically when you add it.
      </p>
    </div>
  );
}
