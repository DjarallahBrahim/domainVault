# Developer Quickstart: TLD Data Enrichment Engine

**Date**: 2026-07-30 | **Branch**: `014-tld-data-enrichment`

## Overview

The TLD Data Enrichment Engine (`lib/tld-checker/`) is a reusable module that checks DNS reservation status for domain names across TLDs. It queries both NS and A records per TLD combination and can persist results to the Supabase database.

Unlike the standalone TLD Checker tool (Phases 14–15) which is browser-only, this engine works in both browser and server (Node.js) environments.

## Prerequisites

- Phase 14: Database tables exist (`tld_extensions`, `domain_extension_checks`, `domains.reserved_tlds_count`)
- Phase 15: Shared DNS engine refactored (`resolveDomain` supports `type: "NS"`, `runWithConcurrency` is a standalone utility)

## Quick Architecture

```
lib/
├── dns/                    # Phase 15 — shared DNS engine
│   ├── resolve.ts          #   resolveDomain(domain, resolver, type, signal?)
│   ├── batchQueue.ts       #   runWithConcurrency<T,R>(items, worker, concurrency)
│   └── parseNsAnswer.ts    #   NS response interpretation
│
├── tld-checker/            # Phase 16 — TLD enrichment engine (NEW)
│   ├── types.ts            #   ExtensionResult, CheckExtensionsOptions, PersistOutcome
│   ├── checkExtensions.ts  #   checkAllExtensionsForRoot()
│   ├── rootExtractor.ts    #   extractRootWord()
│   └── persistResults.ts   #   persistResults()
│
└── supabase/queries/
    ├── extension-checks.ts #   upsertExtensionCheck(), recomputeReservedCount()
    └── tld-extensions.ts   #   fetchActiveTlds()
```

## Usage Examples

### Basic: Check TLDs (no persistence)

```ts
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";

const results = await checkAllExtensionsForRoot(
  "acmecorp",
  ["io", "ai", "co"],
  "cloudflare",
  { concurrency: 15 }
);

for (const r of results) {
  console.log(`${r.fullDomain}: reserved=${r.isReserved}, live=${r.isLive}`);
}
```

### With Persistence (server-side, e.g., Route Handler)

```ts
import { createServerClient } from "@/lib/supabase/server";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { persistResults } from "@/lib/tld-checker/persistResults";

async function checkAndPersist(domainId: string, domainName: string) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const root = extractRootWord(domainName);
  const { data: tlds } = await fetchActiveTlds(supabase);
  if (!tlds) return;

  const results = await checkAllExtensionsForRoot(
    root,
    tlds.map((t) => t.extension),
    "cloudflare"
  );

  const outcome = await persistResults(supabase, domainId, user.id, results);
  console.log(`Persisted ${outcome.succeeded}/${results.length} TLDs`);
}
```

### With Abort (browser)

```ts
const controller = new AbortController();

const results = await checkAllExtensionsForRoot(
  "acmecorp",
  ["io", "ai", "co"],
  "cloudflare",
  { signal: controller.signal }
);

// Cancel mid-check
setTimeout(() => controller.abort(), 3000);
```

## Development Workflow

```bash
# Type checking
npx tsc --noEmit

# Run dev server to test integration
npm run dev

# After Phase 14 migration is applied:
# supabase db push   # or manual migration
# npx supabase gen types typescript > types/supabase.ts
```

## Testing Checklist

- [ ] Call `checkAllExtensionsForRoot` with 3 TLDs → verify 3 results with correct flags
- [ ] Run against known registered domain (google.com) → `isReserved: true`
- [ ] Run against likely available domain → `isReserved: false`
- [ ] Pass `AbortSignal` → verify function resolves with partial results
- [ ] Persist results → verify rows in `domain_extension_checks`
- [ ] Re-persist same domain → verify upsert (no duplicates, row count unchanged)
- [ ] Verify `domains.reserved_tlds_count` matches actual reserved TLD count
- [ ] `npx tsc --noEmit` → zero errors
