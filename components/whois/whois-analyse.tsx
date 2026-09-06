"use client";

import { Button } from "@/components/ui/button";
import { ALLOWED_REGISTRARS } from "@/lib/registrars";
import type { AnalysisState } from "@/lib/hooks/useWhoisAnalysis";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";

interface WhoisAnalyseProps {
  loading: boolean;
  onAnalyse: () => void;
  analysis: AnalysisState;
  onPickAllowed: (name: string) => void;
}

export function WhoisAnalyse({ loading, onAnalyse, analysis, onPickAllowed }: WhoisAnalyseProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onAnalyse} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {loading ? "Analysing..." : "Analyse the details"}
        </Button>
        <p className="text-xs text-text-muted">Fetches expiry date &amp; registrar from WHOIS.</p>
      </div>

      {analysis.status === "ok" && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-accent-success/10 border border-accent-success/20">
          <CheckCircle2 className="h-4 w-4 text-accent-success shrink-0 mt-0.5" />
          <div className="text-sm text-accent-success">
            {analysis.registrarRaw && analysis.registrarValue ? (
              <p>
                Registrar detected: {analysis.registrarRaw} →{" "}
                <span className="font-medium">{analysis.registrarValue}</span>
              </p>
            ) : analysis.registrarRaw ? (
              <p>Registrar detected: {analysis.registrarRaw}</p>
            ) : (
              <p>No registrar published for this domain.</p>
            )}
            {analysis.hasExpiration ? (
              <p className="mt-0.5">Expiration date filled in from WHOIS.</p>
            ) : (
              <p className="mt-0.5">
                No expiration date returned by WHOIS — please enter it manually.
              </p>
            )}
          </div>
        </div>
      )}

      {analysis.status === "blocked" && (
        <div className="p-3 rounded-md bg-bg-elevated border border-border">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-accent-danger shrink-0 mt-0.5" />
            <div className="text-sm text-text-primary">
              <p>
                Detected registrar{" "}
                <span className="font-medium">&quot;{analysis.registrarRaw}&quot;</span> is not in
                the allowed list. Pick one below or clear the field to leave it unset.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ALLOWED_REGISTRARS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onPickAllowed(name)}
                    className="text-xs px-2 py-1 rounded bg-bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent-primary/50 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis.status === "unregistered" && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-bg-elevated border border-border">
          <XCircle className="h-4 w-4 text-accent-danger shrink-0 mt-0.5" />
          <p className="text-sm text-text-primary">
            No active WHOIS registration found for this domain. Double-check the name or fill in the
            details manually.
          </p>
        </div>
      )}

      {analysis.status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-accent-danger/10 border border-accent-danger/20">
          <XCircle className="h-4 w-4 text-accent-danger shrink-0 mt-0.5" />
          <p className="text-sm text-accent-danger">{analysis.message}</p>
        </div>
      )}
    </>
  );
}
