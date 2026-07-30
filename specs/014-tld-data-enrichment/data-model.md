# Data Model: TLD Data Enrichment Engine

**Date**: 2026-07-30 | **Feature**: Phase 16 — TLD Data Enrichment Engine

## Overview

This phase creates the application-level data model for TLD checking — the TypeScript types and Supabase query helpers that interact with the database tables created in Phase 14. The database schema itself is a Phase 14 prerequisite and is not created by this phase.

## Application Types (lib/tld-checker/types.ts)

### ExtensionResult

```ts
interface ExtensionResult {
  tld: string;          // TLD without dot (e.g., "io", "co")
  fullDomain: string;   // Constructed domain (e.g., "acmecorp.io")
  isReserved: boolean;  // NS records exist for this domain
  isLive: boolean;      // A record resolves for this domain
  resolver: string;     // Provider used (e.g., "cloudflare")
  tookMs: number;       // Round-trip time for both queries (max of NS + A)
  error?: string;       // Present only if both queries failed
}
```

**Invariants**:
- `fullDomain` === `${root}.${tld}`
- `isReserved` = true when NS query returns records
- `isLive` = true when A query returns records
- A domain can be `isReserved = true` and `isLive = false` (registered but not serving traffic)
- `tookMs` is the max of the two query durations
- `error` is defined only when both queries failed (timeout, network error)

### RootExtractor

```ts
function extractRootWord(domain: string): string;
```

Pure function — no side effects, no database. Takes a domain string and returns the first label.

### CheckExtensionsOptions

```ts
interface CheckExtensionsOptions {
  concurrency?: number;  // Default: 15 (results in 30 concurrent HTTP requests)
  signal?: AbortSignal;  // AbortController signal for cancellation
}
```

## Database Entities (already created in Phase 14)

### domain_extension_checks

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID FK → auth.users | Owning user (RLS-enforced) |
| `domain_id` | UUID FK → domains | Parent domain in portfolio |
| `tld` | TEXT | TLD extension without dot |
| `full_domain` | TEXT | Constructed domain (word.tld) |
| `is_reserved` | BOOLEAN | NS records exist |
| `is_live` | BOOLEAN | A record resolves |
| `resolver` | TEXT | Provider used |
| `checked_at` | TIMESTAMPTZ | When the check was performed |

**Uniqueness**: `UNIQUE (domain_id, tld)` — one row per (domain, TLD) combination. Upserts use `ON CONFLICT (domain_id, tld) DO UPDATE`.

**RLS**: Users can only read/write rows where `user_id = auth.uid()`.

### tld_extensions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `extension` | TEXT UNIQUE | TLD string (e.g., "io") |
| `category` | TEXT | 'generic', 'country', or 'new_gtld' |
| `is_active` | BOOLEAN | Can be toggled to exclude |
| `sort_order` | INTEGER | Display ordering |

**Note**: This table is populated separately (not by Phase 16). The engine reads from it via a query function but does not create or seed it.

### domains (existing columns added in Phase 14)

| Column | Type | Description |
|--------|------|-------------|
| `reserved_tlds_count` | INTEGER \| NULL | Cached count of reserved TLDs. NULL = never checked. |
| `tlds_last_checked_at` | TIMESTAMPTZ \| NULL | When the last check was performed |

## State Transitions

### Domain Summary Columns

```
NULL (never checked)
  │
  ▼ check completes
INTEGER (count of reserved TLDs)
  │
  ▼ re-check completes (upsert existing + new)
INTEGER (updated count)
  │
  ▼ if ALL upserts fail
(stays at previous value — not updated)
```

### Extension Check Row

```
[No row exists]
  │
  ▼ first check → INSERT
[Row exists with is_reserved, is_live, checked_at]
  │
  ▼ re-check → UPSERT (ON CONFLICT DO UPDATE)
[Row updated with new is_reserved, is_live, checked_at]
```

## Query Functions (lib/supabase/queries/)

### extension-checks.ts (server-safe)

```ts
// Upsert a single TLD check result
async function upsertExtensionCheck(
  supabase: SupabaseClient,
  params: {
    userId: string;
    domainId: string;
    tld: string;
    fullDomain: string;
    isReserved: boolean;
    isLive: boolean;
    resolver: string;
  }
): Promise<{ data: T | null; error: PostgrestError | null }>;

// Recompute and write the summary count for a domain
async function recomputeReservedCount(
  supabase: SupabaseClient,
  domainId: string
): Promise<{ data: T | null; error: PostgrestError | null }>;

// Fetch all extension checks for a domain
async function fetchExtensionChecks(
  supabase: SupabaseClient,
  domainId: string
): Promise<{ data: ExtensionCheckRow[] | null; error: PostgrestError | null }>;
```

### tld-extensions.ts (server-safe)

```ts
// Fetch all active TLD extensions ordered by sort_order
async function fetchActiveTlds(
  supabase: SupabaseClient
): Promise<{ data: TldExtensionRow[] | null; error: PostgrestError | null }>;
```

## Relationships

```
domains (1) ─────────< domain_extension_checks (N)
   │                         │
   │ reserved_tlds_count     │ is_reserved (counted for summary)
   │ tlds_last_checked_at    │ is_live
   │                         │ tld → matches tld_extensions.extension
   │                         │
tld_extensions (N) ──────────┘
   extension (used as TLD list input to engine)
```

## Validation Rules

- **Root word input**: Non-empty string. Hyphens and digits preserved. No length limit (DNS labels are max 63 chars, but engine doesn't enforce — it delegates to DNS query).
- **TLD input**: Non-empty string array. Each TLD stripped of leading dot. No `.` within TLD. Empty array returns `[]`.
- **Reserved count**: Always non-negative integer. Computed via `COUNT(*)` query, never estimated.
- **Independent upserts**: Each `upsertExtensionCheck` call is independent. Failed upserts return errors that the caller can handle. Successful upserts update one row.
