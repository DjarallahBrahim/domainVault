# Research: TLD Data Enrichment Engine

**Date**: 2026-07-30 | **Feature**: Phase 16 — TLD Data Enrichment Engine

## Decision: Engine Lives in `lib/tld-checker/` (Separate from Standalone Tool)

### What we chose

Create `lib/tld-checker/` as a new module distinct from both `lib/dns/` (shared DNS engine) and `lib/tld/` (standalone TLD Checker tool built in Phases 14–15).

### Rationale

- `lib/dns/` is the low-level DNS resolution layer — generalized in Phase 15 to support both A and NS record types
- `lib/tld/` is the standalone TLD Checker tool engine — browser-only, produces `TldCheckResult` objects directly consumed by React hooks
- `lib/tld-checker/` is the shared, environment-agnostic engine — produces `ExtensionResult` objects with richer data (both `isReserved` and `isLive` flags), callable from any context

Having them separate prevents:
- The standalone tool's React-specific concerns (state management, abort refs) from leaking into the shared engine
- The shared engine's Supabase dependencies from leaking into the browser-only tool
- Type confusion between `TldCheckResult` (tool-specific) and `ExtensionResult` (shared engine)

### Alternatives considered

| Approach | Why rejected |
|---|---|
| **Extend `lib/tld/` to add persistence** | `lib/tld/` is designed for browser-only use with no database awareness. Adding Supabase queries would violate the pure-client principle. |
| **Put everything in `lib/dns/`** | `lib/dns/` is the lowest-level DNS resolution layer. TLD-specific orchestration (root extraction, NS+A parallel queries, persistence) is a higher-level concern. |
| **Single module with conditional imports** | Conditional `typeof window` checks create fragile code paths. Separate modules make the split explicit and testable. |

## Decision: Engine Uses Generalized `resolveDomain(domain, resolver, type)`

### What we chose

The engine calls a single `resolveDomain` function that accepts a `type` parameter: `"A"` for A records (IP addresses) and `"NS"` for NS records (name server hostnames). This is the generalized version produced by the Phase 15 refactor.

For each TLD, the engine fires both queries in parallel:
```ts
const [nsResult, aResult] = await Promise.all([
  resolveDomain(`${root}.${tld}`, "cloudflare", "NS", signal),
  resolveDomain(`${root}.${tld}`, "cloudflare", "A", signal),
]);
```

### Rationale

- Avoids duplicating the DNS resolution logic (fetch, parse, error handling, timeout)
- The Phase 15 refactor already generalizes `resolveDomain` for this exact use case
- Parallel execution minimizes latency per TLD — both queries share the same network round-trip window

### NS Answer Parsing

Unlike A records (which return IP addresses in `Answer[].data`), NS records return hostnames. The Phase 15 `parseNsAnswer.ts` determines `isReserved` by checking if the `Answer[]` array is present and non-empty.

## Decision: Concurrency Default = 15 TLDs

### What we chose

The `checkAllExtensionsForRoot` function defaults to 15 TLD concurrency, which translates to 30 concurrent HTTP requests (2 per TLD). This is lower than the standalone tool's 20 because each TLD involves 2 queries.

### Rationale

- Browsers limit concurrent connections to ~6 per host, but each DoH query is a short-lived request — 30 concurrent should be safe
- Cloudflare DoH has no published rate limits; 30 concurrent has been tested without issues
- Lower concurrency reduces the risk of hitting browser connection limits while still delivering sub-10-second results for 10 TLDs

## Decision: Independent Upserts with Computed Summary

### What we chose

Each TLD row is upserted independently. If one TLD's upsert fails, others continue. After all upserts complete, `reserved_tlds_count` is recomputed by querying `COUNT(*) WHERE domain_id = $1 AND is_reserved = true` and writing the result back to `domains.reserved_tlds_count`.

### Rationale

- Matches the engine's failure model (FR-007: individual TLD failures don't block the batch)
- Independent upserts are simpler than wrapping everything in a database transaction
- Recomputing the count from actual rows ensures it's always accurate — no risk of stale cached values
- The `(domain_id, tld)` unique constraint prevents duplicates even without transactional atomicity

### SQL approach

```sql
-- Upsert each TLD individually
INSERT INTO domain_extension_checks (user_id, domain_id, tld, full_domain, is_reserved, is_live, resolver, checked_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (domain_id, tld) DO UPDATE SET
  is_reserved = EXCLUDED.is_reserved,
  is_live = EXCLUDED.is_live,
  resolver = EXCLUDED.resolver,
  checked_at = NOW();

-- After all upserts, recompute summary
UPDATE domains SET
  reserved_tlds_count = (SELECT COUNT(*) FROM domain_extension_checks WHERE domain_id = $1 AND is_reserved = true),
  tlds_last_checked_at = NOW()
WHERE id = $1;
```

## Decision: Root Extraction — Simple First-Label Split

### What we chose

The `extractRootWord(domain: string)` function splits on `.` and takes the first segment. Examples:
- `"acmecorp.com"` → `"acmecorp"`
- `"blog.example.co.uk"` → `"blog"` (known limitation for multi-label TLDs)
- `"my-site.io"` → `"my-site"` (preserves hyphens)

### Rationale

- Covers 95%+ of gTLDs and common ccTLDs (.io, .ai, .co, .com, .net, .org)
- Multi-label TLDs (.co.uk, .com.au) are explicitly deferred per the spec
- Simple, predictable, zero-configuration

### Known limitation for future refinement

`.co.uk` domains would resolve to the wrong root (`example` instead of `example.co`). A future enhancement could use a suffix list or config array of multi-label TLDs to handle this correctly.

## Decision: Persistence Uses Typed Supabase Queries

### What we chose

Create `lib/supabase/queries/extension-checks.ts` following the existing query helper pattern used throughout the app. The file exports:
- `upsertExtensionCheck()` — single row upsert with `ON CONFLICT`
- `recomputeReservedCount()` — updates `domains.reserved_tlds_count`
- `fetchExtensionChecks(domainId)` — fetches all checks for a domain

### Rationale

- Follows the constitution's requirement: "All database calls MUST use typed helpers in `/lib/supabase/queries/`"
- Server-safe functions (no `next/headers` imports) for use in Route Handlers and SSR
- Client-safe variants (with browser Supabase client) for use in client components
- RLS enforcement is automatic — the Supabase client includes the user's JWT
