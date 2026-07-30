# Engine Function Contracts: TLD Data Enrichment

**Date**: 2026-07-30 | **Feature**: Phase 16

## checkAllExtensionsForRoot

The core engine function — checks all TLDs for a root word using parallel NS + A queries.

```ts
/**
 * Check DNS reservation and liveness status for a root word across multiple TLDs.
 *
 * For each TLD, fires both an NS query and an A query in parallel via Cloudflare DoH.
 * Returns one ExtensionResult per TLD with combined flags.
 *
 * @param root - The base word to check (e.g., "acmecorp")
 * @param tlds - Array of TLD extensions without dots (e.g., ["io", "ai", "co"])
 * @param resolver - DNS provider name (e.g., "cloudflare")
 * @param options - Optional concurrency limit and abort signal
 * @returns Promise<ExtensionResult[]> — one result per TLD, ordered by input TLD array
 *
 * @example
 * const results = await checkAllExtensionsForRoot(
 *   "acmecorp",
 *   ["io", "ai", "co"],
 *   "cloudflare",
 *   { concurrency: 15 }
 * );
 * // results[0] => { tld: "io", fullDomain: "acmecorp.io", isReserved: true, isLive: false, ... }
 */
function checkAllExtensionsForRoot(
  root: string,
  tlds: string[],
  resolver: string,
  options?: CheckExtensionsOptions
): Promise<ExtensionResult[]>;
```

**Preconditions**:
- `root` is a non-empty string
- `tlds` is a non-empty array (empty array returns `[]`)
- `resolver` matches a known provider configured in the shared DNS engine

**Postconditions**:
- Returns exactly `tlds.length` results in the same order as input TLDs
- Each result has `isReserved` (NS check) and `isLive` (A check) populated
- If both NS and A queries fail for a TLD, the result has `error` set and `isReserved = false`
- If aborted via `options.signal`, resolves with partial results for completed TLDs

**Error handling**:
- Individual TLD failures do NOT throw — they produce results with `error` populated
- The function only throws if the shared DNS engine's `resolveDomain` throws an unexpected error
- Network timeouts per query are 5 seconds (set by the shared engine)

**Concurrency**:
- Default 15 TLDs = 30 concurrent HTTP requests (2 per TLD)
- Configurable via `options.concurrency`
- Uses `runWithConcurrency` from the shared engine (Phase 15)

---

## extractRootWord

Utility to extract the checkable root from a stored domain name.

```ts
/**
 * Extract the first label from a domain string as the checkable root word.
 *
 * @param domain - Full domain string (e.g., "sub.example.com")
 * @returns First label of the domain (e.g., "sub")
 *
 * @example
 * extractRootWord("acmecorp.com")       // "acmecorp"
 * extractRootWord("blog.example.co.uk") // "blog" (v1 limitation)
 * extractRootWord("my-site.io")         // "my-site"
 */
function extractRootWord(domain: string): string;
```

**Preconditions**:
- `domain` is a non-empty string
- Contains at least one dot (`.`)

**Postconditions**:
- Returns the substring before the first dot
- Preserves hyphens and digits
- Does NOT lower-case (caller must handle casing)
- Returns original string if no dot is found

**V1 Limitations**:
- Does not handle multi-label TLDs (`.co.uk`, `.com.au`)
- Does not strip subdomains beyond the first label (`sub.example.com` → `sub`, not `example`)

---

## persistResults

Persists check results to the database and updates the domain summary.

```ts
/**
 * Persist TLD check results for a domain and update summary columns.
 *
 * Upserts each TLD result independently into domain_extension_checks.
 * After all upserts complete, recomputes reserved_tlds_count and updates
 * tlds_last_checked_at on the parent domains row.
 *
 * @param supabase - Authenticated Supabase client (RLS enforces user ownership)
 * @param domainId - UUID of the parent domain in the portfolio
 * @param userId - UUID of the owning user (validated against domain ownership)
 * @param results - Array of ExtensionResult from checkAllExtensionsForRoot
 * @returns Object with succeeded (count of upserted rows) and failed (count + errors)
 *
 * @example
 * const outcome = await persistResults(supabase, domainId, userId, results);
 * // outcome => { succeeded: 10, failed: 0 }
 * // outcome => { succeeded: 8, failed: 2, errors: [{ tld: "io", error: "..." }] }
 */
function persistResults(
  supabase: SupabaseClient,
  domainId: string,
  userId: string,
  results: ExtensionResult[]
): Promise<PersistOutcome>;

interface PersistOutcome {
  succeeded: number;
  failed: number;
  errors?: Array<{ tld: string; error: string }>;
}
```

**Preconditions**:
- `supabase` is an authenticated client with a valid user JWT
- `domainId` references an existing domain owned by the authenticated user
- `results` is a non-empty array

**Postconditions**:
- Each result is upserted into `domain_extension_checks` using `(domain_id, tld)` conflict key
- After all upserts, `domains.reserved_tlds_count` is recomputed from `COUNT(*) WHERE domain_id = $id AND is_reserved = true`
- `domains.tlds_last_checked_at` is set to `NOW()`
- If ALL upserts fail, summary columns are NOT updated (preserving previous state)
- RLS rejects writes for domains owned by other users

**Error handling**:
- Individual upsert failures are collected in `PersistOutcome.errors[]`
- The caller decides whether to retry failed TLDs or proceed
- Database connection failures propagate as thrown errors (not in the outcome object)
