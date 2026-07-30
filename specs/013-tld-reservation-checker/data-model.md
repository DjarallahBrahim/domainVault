# Data Model: TLD Reservation Checker

**Date**: 2026-07-30 | **Feature**: TLD Reservation Checker

## Overview

All data is transient — generated client-side during a user session and never persisted to a database. The data model is defined entirely in TypeScript interfaces.

## Entities

### TldCheckStatus

```ts
type TldCheckStatus = "available" | "registered" | "reserved" | "error";
```

**State transitions**: N/A — immutable result assigned once per lookup.

**Values**:
- `available`: NXDOMAIN response from DoH — domain likely available for registration
- `registered`: NS records returned from DoH — domain is registered
- `reserved`: Cannot be distinguished via NS lookup alone (best-effort). Treated as a display label for domains the user manually marks or the system infers from additional metadata. Falls back to `registered` when indistinguishable.
- `error`: HTTP error, timeout, or parse failure during the DoH query

### TldCheckResult

```ts
interface TldCheckResult {
  word: string;          // The base word (e.g., "mybrand")
  tld: string;           // The TLD without dot (e.g., "com")
  domain: string;        // Full domain (e.g., "mybrand.com")
  status: TldCheckStatus;
  error?: string;        // Error reason if status === "error"
  tookMs?: number;       // Round-trip time for the lookup
}
```

**Invariants**:
- `domain` === `${word}.${tld}`
- `error` is defined iff `status === "error"`
- `tookMs` is always defined for completed lookups; undefined for pending

### TldProvider

```ts
interface TldProvider {
  name: string;          // "cloudflare" | "google"
  endpoint: string;      // DoH URL with {domain} placeholder
  headers: Record<string, string>;
}
```

**Values**: Same as the DNS Checker's providers — Cloudflare DoH and Google DoH. The endpoint uses `type=NS` instead of `type=A`.

### BatchState

Internal hook state, not exported as a type but central to the data flow:

```ts
// Managed inside useTldChecker hook
interface BatchState {
  words: string[];                    // Parsed, sanitized, deduplicated base words
  tlds: string[];                     // Selected TLD extensions (without dots)
  results: TldCheckResult[];          // All resolved results (word × tld)
  isLoading: boolean;                 // True while batch is in progress
  progress: { done: number; total: number };  // Live progress counter
  abortRef: React.RefObject<AbortController | null>;
}
```

### StatusFilter

```ts
type StatusFilter = "all" | "available" | "registered" | "reserved" | "error";
```

Applied locally to the results array — no server interaction.

### Counts

```ts
interface TldCounts {
  all: number;           // Total results
  available: number;     // Count of status === "available"
  registered: number;    // Count of status === "registered"
  reserved: number;      // Count of status === "reserved"
  error: number;         // Count of status === "error"
}
```

Derived from `results` array with `Array.reduce()` on every filter/mutation.

### ExportRow

```ts
interface ExportRow {
  word: string;
  tld: string;
  domain: string;
  status: TldCheckStatus;
}
```

Used to build the CSV string. Columns: `word, tld, domain, status`.

## Validation Rules

- **Base words**: Must contain only `[a-zA-Z0-9-]`. Strips leading/trailing whitespace. Converts to lowercase. Max 200 words per batch. Empty input is valid (no results).
- **TLDs**: Must contain only `[a-zA-Z0-9-]`. Dot prefix stripped if present. No `.` character within the TLD string. Duplicates ignored.
- **Domain construction**: `${word}.${tld}` — no additional validation needed since individual components are already sanitized.
- **Max combinations**: 200 words × no upper bound on TLDs. The 20-concurrency pool naturally limits rate of outgoing requests regardless of batch size.

## Relationships

```
BaseWords (1..200) ──×── TLDs (1..N) ──→ TldCheckResult (wordCount × tldCount)
                                               │
                                               ├── filtered by StatusFilter
                                               ├── counted into TldCounts
                                               └── serialized to CSV (ExportRow[])
```
