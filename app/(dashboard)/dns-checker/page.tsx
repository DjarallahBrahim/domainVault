"use client";

import { useDnsChecker } from "@/lib/hooks/useDnsChecker";
import { DomainInput } from "@/components/dns-checker/DomainInput";
import { ResolverSelector } from "@/components/dns-checker/ResolverSelector";
import { SummaryBar } from "@/components/dns-checker/SummaryBar";
import { ResultsTable } from "@/components/dns-checker/ResultsTable";
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
  } = useDnsChecker();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">DNS Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk DNS lookup tool — resolve A records via Cloudflare or Google
          DNS-over-HTTPS
        </p>
      </div>

      <DomainInput
        value={rawInput}
        onChange={setRawInput}
        domainCount={parsedDomains.length}
        error={parseError}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <ResolverSelector
          value={resolver}
          onChange={setResolver}
          disabled={isLoading}
        />
        <Button
          onClick={resolveAll}
          disabled={!canResolve}
          size="lg"
        >
          {isLoading
            ? `Resolving... (${progress.done}/${progress.total})`
            : "Resolve"}
        </Button>
      </div>

      {filteredResults.length > 0 && (
        <SummaryBar
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      )}

      <ResultsTable results={filteredResults} filter={filter} />
    </div>
  );
}
