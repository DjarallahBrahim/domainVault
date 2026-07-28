"use client";

import { useDnsChecker } from "@/lib/hooks/useDnsChecker";
import { DomainInput } from "@/components/dns-checker/DomainInput";
import { ResolverSelector } from "@/components/dns-checker/ResolverSelector";
import { SummaryBar } from "@/components/dns-checker/SummaryBar";
import { ResultsTable } from "@/components/dns-checker/ResultsTable";
import { ExportButton } from "@/components/dns-checker/ExportButton";
import { CompareToggle } from "@/components/dns-checker/CompareToggle";
import { HelpSection } from "@/components/dns-checker/HelpSection";
import { Button } from "@/components/ui/button";

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

  const hasAnyResults =
    (!compareMode && counts.all > 0) ||
    (compareMode && compareResults.some((r) => r !== null));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">DNS Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk DNS lookup tool — resolve A records via Cloudflare or Google
          DNS-over-HTTPS
        </p>
      </div>

      <HelpSection />

      <DomainInput
        value={rawInput}
        onChange={setRawInput}
        domainCount={parsedDomains.length}
        error={parseError}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
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
        <Button onClick={resolveAll} disabled={!canResolve} size="lg">
          {isLoading
            ? `Resolving... (${progress.done}/${progress.total})`
            : "Resolve"}
        </Button>
      </div>

      {!compareMode && counts.all > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SummaryBar
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
          <ExportButton
            buildCsv={buildCsv}
            disabled={
              (!compareMode && counts.all === 0) ||
              (compareMode &&
                !compareResults.some((r) => r !== null)) ||
              isLoading
            }
          />
        </div>
      )}

      {compareMode && hasAnyResults && (
        <div className="flex items-center justify-end">
          <ExportButton
            buildCsv={buildCsv}
            disabled={
              compareResults.length === 0 ||
              !compareResults.some((r) => r !== null) ||
              isLoading
            }
          />
        </div>
      )}

      <ResultsTable
        results={filteredResults}
        filter={filter}
        compareMode={compareMode}
        compareResults={compareResults}
      />
    </div>
  );
}
