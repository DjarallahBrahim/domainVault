"use client";

import { useTldChecker } from "@/lib/hooks/useTldChecker";
import { DomainInput } from "@/components/tld-checker/DomainInput";
import { TldPicker } from "@/components/tld-checker/TldPicker";
import { ResultsTable } from "@/components/tld-checker/ResultsTable";
import { StatCards } from "@/components/tld-checker/StatCards";
import { FilterPills } from "@/components/tld-checker/FilterPills";
import { ExportButton } from "@/components/tld-checker/ExportButton";
import { HelpSection } from "@/components/tld-checker/HelpSection";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

function TitleBar() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-accent-danger" />
        <span className="inline-block w-2 h-2 rounded-full bg-accent-warning" />
        <span className="inline-block w-2 h-2 rounded-full bg-accent-success" />
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        query.tld
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

export function TldCheckerContent() {
  const {
    rawInput,
    setRawInput,
    parsedWords,
    parseError,
    selectedTlds,
    toggleTld,
    addCustomTld,
    isLoading,
    results,
    filter,
    setFilter,
    filteredResults,
    counts,
    progress,
    canCheck,
    checkAll,
    cancelAll,
    buildCsv,
  } = useTldChecker();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">TLD Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Check domain availability across TLDs — find the perfect extension for your brand
        </p>
      </div>

      <HelpSection />

      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
        <TitleBar />

        <div className="p-5 space-y-6">
          <div className="space-y-2">
            <SectionLabel>// WORDS</SectionLabel>
            <DomainInput
              value={rawInput}
              onChange={setRawInput}
              wordCount={parsedWords.length}
              error={parseError}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <SectionLabel>// TLDS</SectionLabel>
            <TldPicker
              selectedTlds={selectedTlds}
              onToggleTld={toggleTld}
              onAddCustomTld={addCustomTld}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <SectionLabel>// CONTROLS</SectionLabel>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={checkAll}
                  disabled={!canCheck}
                  size="default"
                >
                  <Play className="h-4 w-4" />
                  {isLoading
                    ? `${progress.done}/${progress.total}`
                    : "Check Availability"}
                </Button>
                {isLoading && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={cancelAll}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
              <ExportButton
                buildCsv={buildCsv}
                disabled={isLoading || counts.all === 0}
              />
            </div>
          </div>
        </div>
      </div>

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

      {(counts.all > 0 || isLoading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>// RESULTS</SectionLabel>
            <FilterPills
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          </div>
          <ResultsTable
            results={
              filter === "all"
                ? results
                : filteredResults
            }
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
