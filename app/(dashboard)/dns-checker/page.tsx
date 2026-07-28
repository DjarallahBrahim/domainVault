"use client";

import { useDnsChecker } from "@/lib/hooks/useDnsChecker";
import { DomainInput } from "@/components/dns-checker/DomainInput";
import { ResolverSelector } from "@/components/dns-checker/ResolverSelector";
import { SummaryBar } from "@/components/dns-checker/SummaryBar";
import { ResultsTable } from "@/components/dns-checker/ResultsTable";
import { ExportButton } from "@/components/dns-checker/ExportButton";
import { CompareToggle } from "@/components/dns-checker/CompareToggle";
import { HelpSection } from "@/components/dns-checker/HelpSection";
import { StatCards } from "@/components/dns-checker/StatCards";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

function TitleBar() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-accent-danger" />
        <span className="inline-block w-2 h-2 rounded-full bg-accent-warning" />
        <span className="inline-block w-2 h-2 rounded-full bg-accent-success" />
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        query.txt
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-mono text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  );
}

export default function DnsCheckerPage() {
  const {
    rawInput,
    setRawInput,
    parsedDomains,
    parseError,
    resolver,
    setResolver,
    isLoading,
    filter,
    setFilter,
    filteredResults,
    counts,
    progress,
    canResolve,
    resolveAll,
    compareMode,
    setCompareMode,
    compareResults,
    buildCsv,
  } = useDnsChecker();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">DNS Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk DNS lookup tool — resolve A records via Cloudflare or Google
        </p>
      </div>

      <HelpSection />

      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
        <TitleBar />

        <div className="p-5 space-y-6">
          {/* DOMAINS section */}
          <div className="space-y-2">
            <SectionLabel>// DOMAINS</SectionLabel>
            <DomainInput
              value={rawInput}
              onChange={setRawInput}
              domainCount={parsedDomains.length}
              error={parseError}
              isLoading={isLoading}
            />
          </div>

          {/* CONTROLS section */}
          <div className="space-y-3">
            <SectionLabel>// CONTROLS</SectionLabel>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <ResolverSelector
                  value={resolver}
                  onChange={setResolver}
                  disabled={isLoading || compareMode}
                />
                <CompareToggle
                  enabled={compareMode}
                  onChange={setCompareMode}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-2">
                <ExportButton
                  buildCsv={buildCsv}
                  disabled={
                    isLoading ||
                    counts.all === 0
                  }
                />
                <Button
                  onClick={resolveAll}
                  disabled={!canResolve}
                  size="default"
                >
                  <Play className="h-4 w-4" />
                  {isLoading
                    ? `${progress.done}/${progress.total}`
                    : "Resolve"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS section */}
      {counts.all > 0 && (
        <div className="space-y-3">
          <SectionLabel>// STATS</SectionLabel>
          <StatCards
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      )}

      {/* RESULTS section */}
      {(counts.all > 0 || isLoading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>// RESULTS</SectionLabel>
            <SummaryBar
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          </div>
          <ResultsTable
            results={filteredResults}
            filter={filter}
            compareMode={compareMode}
            compareResults={compareResults}
          />
        </div>
      )}
    </div>
  );
}
