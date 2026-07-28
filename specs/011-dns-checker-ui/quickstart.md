# Quickstart: DNS Checker UI

**Feature**: 011-dns-checker-ui | **Date**: 2026-07-28

## Overview

The DNS Checker is a client-side tool page at `/dns-checker` (under the dashboard layout) where users can paste domain names, choose a DNS resolver, and view resolution results in a filterable table with incremental updates.

## Files

```
app/(dashboard)/dns-checker/
└── page.tsx                       # Page component — orchestrates hook + components

components/dns-checker/
├── DomainInput.tsx                # Textarea + live domain count
├── ResolverSelector.tsx           # Cloudflare / Google toggle
├── ResultsTable.tsx               # Status, domain link, IP chips, latency
└── SummaryBar.tsx                 # All / DNS OK / No DNS filter pills

lib/hooks/
└── useDnsChecker.ts               # Central state hook
```

## Quick Usage (page.tsx)

```tsx
"use client";

import { useDnsChecker } from "@/lib/hooks/useDnsChecker";
import { DomainInput } from "@/components/dns-checker/DomainInput";
import { ResolverSelector } from "@/components/dns-checker/ResolverSelector";
import { SummaryBar } from "@/components/dns-checker/SummaryBar";
import { ResultsTable } from "@/components/dns-checker/ResultsTable";
import { Button } from "@/components/ui/button";

export default function DnsCheckerPage() {
  const {
    rawInput, setRawInput,
    parsedDomains, parseError,
    resolver, setResolver,
    isLoading, filter, setFilter,
    filteredResults, counts, progress,
    canResolve, resolveAll
  } = useDnsChecker();

  return (
    <div className="space-y-6">
      <DomainInput
        value={rawInput}
        onChange={setRawInput}
        domainCount={parsedDomains.length}
        error={parseError}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <ResolverSelector
          value={resolver}
          onChange={setResolver}
          disabled={isLoading}
        />
        <Button onClick={resolveAll} disabled={!canResolve}>
          {isLoading ? `Resolving... (${progress.done}/${progress.total})` : "Resolve"}
        </Button>
      </div>

      <SummaryBar
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      <ResultsTable
        results={filteredResults}
        filter={filter}
      />
    </div>
  );
}
```

## Key Behaviors

- **Live parsing**: Domain count updates 300ms after user stops typing
- **Incremental results**: Rows appear as each domain resolves (not all at once)
- **Blocked re-resolution**: Button disabled + keyboard shortcut ignored while loading
- **Keyboard shortcut**: `Ctrl+Enter` (Win/Linux) or `Cmd+Enter` (Mac) triggers resolve
- **IP copy**: Click any IP chip to copy it — tooltip confirms "Copied!"
- **Cleanup**: Navigating away cancels all in-flight requests

## Development

```bash
# TypeScript check
npm run typecheck

# Visit in browser
open http://localhost:3000/dns-checker
```

## Verification (Exit Criteria)

1. Paste `"google.com\ncloudflare.com\nthis-does-not-exist-12345.com"` into the textarea
2. Verify live count shows "3 domains detected"
3. Click "Resolve" (or press Ctrl/Cmd+Enter)
4. Verify rows appear incrementally: first one shows green checkmark or grey X
5. Click the "DNS OK" filter pill → only resolved rows visible
6. Click a domain name → opens in new tab
7. Click an IP chip → "Copied!" tooltip appears
8. Click "No DNS" filter → only non-resolved rows visible
9. Verify button shows loading state with progress counter during resolution
