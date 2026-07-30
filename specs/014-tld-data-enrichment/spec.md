# Feature Specification: TLD Data Enrichment Engine

**Feature Branch**: `014-tld-data-enrichment`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "# DNS Checker → TLD Reservation Checker Phase 16"

## Clarifications

### Session 2026-07-30

- Q: When persisting a batch of TLD check results, does the entire batch succeed or fail together, or can individual TLD upserts fail independently? → A: Individual TLD upserts can fail independently. The summary count on the domains row is recomputed only from successfully persisted TLDs — ensuring it always reflects actual DB state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check TLD Status for Portfolio Domains (Priority: P1)

A domain investor has 500 domains in their portfolio. They want to know which TLD extensions are already registered by others (competing with their brand) and which are still available. The system checks each domain's base word against a configurable list of TLDs, runs both NS and A record lookups per TLD, and persists results so they're visible alongside the domain's other data.

**Why this priority**: This is the core value — transforming domain portfolio management from single-domain tracking to cross-TLD brand monitoring. Without this, the portfolio owner has no visibility into TLD reservation status without manually checking each extension.

**Independent Test**: Given a domain "acmecorp.com" in the portfolio and a configured TLD list of [.io, .ai, .co], trigger a TLD check. Verify `domain_extension_checks` receives rows for acmecorp.io, acmecorp.ai, acmecorp.co with correct `is_reserved` and `is_live` flags. The parent `domains` row updates `reserved_tlds_count` to reflect the count of reserved TLDs.

**Acceptance Scenarios**:

1. **Given** a domain exists in the portfolio, **When** a TLD check is run for that domain against [.io, .ai, .co], **Then** three rows appear in the checks table with correct flags: `is_reserved` = true for TLDs where NS records exist, `is_live` = true for TLDs where an A record resolves, and `resolver` = "cloudflare".
2. **Given** a TLD check completes, **When** results are persisted, **Then** the parent domain's `reserved_tlds_count` equals the number of reserved TLDs and `tlds_last_checked_at` is set to the current timestamp.
3. **Given** a domain's TLDs were previously checked, **When** a re-check is triggered, **Then** existing rows are upserted (updated, not duplicated) based on the (domain_id, tld) uniqueness constraint.
4. **Given** a TLD has no NS records and no A record, **When** checked, **Then** `is_reserved` = false and `is_live` = false — indicating the TLD is likely available.
5. **Given** a TLD lookup fails due to network error or timeout, **When** the check encounters the error, **Then** that individual TLD check is marked with an error without blocking the remaining TLDs in the batch.

---

### User Story 2 - Reusable Engine with Zero UI Dependencies (Priority: P1)

Developers building new features (batch jobs, API routes, cron triggers, the standalone TLD Checker tool) need a clean, reusable module to check TLD availability. The engine must accept a root word and TLD list, return structured results, and have no knowledge of the UI, database, or HTTP layer — it's pure logic callable from any context.

**Why this priority**: The standalone TLD Checker tool (Phases 14–15) was built as a client-side-only utility. This engine provides a shared, server-side capable implementation that can serve the portfolio integration, future batch sync jobs, and API routes — preventing duplication.

**Independent Test**: Call `checkAllExtensionsForRoot("acmecorp", ["io", "ai", "co"])` directly in a Node.js or browser environment. Verify the returned `ExtensionResult[]` contains 3 entries, each with `tld`, `fullDomain`, `isReserved`, `isLive`, and `tookMs` populated. No database, no React — purely the engine function.

**Acceptance Scenarios**:

1. **Given** a root word and list of TLDs, **When** `checkAllExtensionsForRoot` is called, **Then** for each TLD, both an NS query and an A query are fired in parallel (2 HTTP requests per TLD). Results are combined into a single `ExtensionResult` per TLD.
2. **Given** a concurrency value of 15 is provided, **When** the engine processes TLDs, **Then** no more than 30 concurrent HTTP requests (15 TLDs × 2 queries each) are in-flight at any time.
3. **Given** an abort signal is passed, **When** the signal is triggered, **Then** all in-flight queries are cancelled and the function resolves with partial results for completed TLDs.
4. **Given** the engine is called from a browser (client-side), **When** lookup queries execute, **Then** they use direct `fetch()` to Cloudflare DoH — no API keys, no server round-trips, no secrets.
5. **Given** one TLD's queries fail due to timeout, **When** the engine continues processing, **Then** the failed TLD returns `isReserved` = false with an error field populated, while remaining TLDs complete normally.

---

### User Story 3 - Persist Results to the Portfolio Database (Priority: P2)

After checking TLD status for a domain, the results must be written to the database so they appear in the portfolio table and can be queried, filtered, and aggregated. The persistence layer handles upserts (update existing rows, insert new ones) and updates the parent domain's summary columns for fast table rendering without JOINs.

**Why this priority**: Persistence is what connects the engine to the portfolio. Without it, results are ephemeral and provide no lasting value. However, it's P2 because the engine (US1) must work first — persistence is a consumer of the engine's output.

**Independent Test**: Run a TLD check for domain "acmecorp.com" against [.io, .ai]. Verify `domain_extension_checks` contains 2 rows with correct flags. Verify `domains.reserved_tlds_count` = 1 (if .io is reserved and .ai is not). Re-run the check — verify no duplicate rows (upsert behavior). Verify `tlds_last_checked_at` is updated.

**Acceptance Scenarios**:

1. **Given** check results are available for a domain, **When** `persistResults` is called, **Then** rows are upserted into `domain_extension_checks` using the `(domain_id, tld)` uniqueness constraint — existing rows update, new rows insert.
2. **Given** results are persisted, **When** the operation completes, **Then** the parent domain's `reserved_tlds_count` is recomputed from the checks table and written to `domains.reserved_tlds_count`, and `domains.tlds_last_checked_at` is set to the current timestamp.
3. **Given** a database write fails for one TLD in a batch, **When** the error occurs, **Then** the failed TLD is skipped (caller receives the error) while remaining TLDs persist successfully. The summary `reserved_tlds_count` is recomputed from successfully persisted rows only.
4. **Given** RLS policies are active, **When** a user attempts to persist results for a domain they don't own, **Then** the operation is rejected by the database.

---

### Edge Cases

- What happens when a domain's root word cannot be cleanly extracted (e.g., multi-label TLDs like `.co.uk`)? → The engine applies a simple first-label extraction (`split('.')[0]`) as v1 behavior. Multi-label TLD handling is flagged as a known edge case for future refinement.
- How does the system handle the case where `tld_extensions` table is empty? → No TLDs to check; the engine returns an empty result set.
- What happens when a domain's root word contains hyphens or digits? → The root extractor preserves them; the word is used as-is for constructing `word.tld` combinations.
- How does a TLD with both NS and A records differ from one with only NS records? → Both return `is_reserved` = true. Only the one with an A record also returns `is_live` = true, indicating the domain is actively serving traffic.
- What happens when the database is temporarily unavailable during persistence? → The write fails; results are lost. A future batch sync job (Phase 17) can retry.

## Requirements *(mandatory)*

### Functional Requirements

**Core Engine**

- **FR-001**: The system MUST provide a module (`lib/tld-checker/`) containing reusable TLD checking logic with zero dependencies on UI, HTTP routes, or database clients.
- **FR-002**: The system MUST define an `ExtensionResult` type containing: `tld` (extension checked), `fullDomain` (constructed domain), `isReserved` (NS records exist), `isLive` (A record resolves), `resolver` (provider used), and `tookMs` (round-trip time).
- **FR-003**: The system MUST provide a `checkAllExtensionsForRoot` function that accepts a root word, a list of TLD strings, a resolver name, and optional concurrency/abort signal — and returns an array of `ExtensionResult`.
- **FR-004**: For each TLD, the engine MUST execute both an NS record query and an A record query in parallel (2 HTTP requests per TLD).
- **FR-005**: The engine MUST enforce a configurable concurrency limit (default: 15 TLDs, i.e., 30 concurrent HTTP requests) to prevent overwhelming the DNS provider.
- **FR-006**: The engine MUST support abort via an `AbortSignal` — cancelling all in-flight queries and returning partial results for already-completed TLDs.
- **FR-007**: The engine MUST handle individual TLD query failures gracefully — a timeout or error for one TLD MUST NOT prevent remaining TLDs from completing.
- **FR-008**: The engine MUST work in both browser (client-side `fetch()` to DoH) and server (Node.js `fetch()`) environments without modification.

**Root Extraction**

- **FR-009**: The system MUST provide a `RootExtractor` utility that derives the checkable root word from a stored domain string. For v1, this MUST extract the first label before the first dot (e.g., "sub.example.com" → "sub").
- **FR-010**: The `RootExtractor` MUST preserve hyphens and digits in the extracted root word.

**Persistence**

- **FR-011**: The system MUST provide a `persistResults` function that accepts check results and a domain ID, and upserts rows into `domain_extension_checks` using `(domain_id, tld)` as the conflict key.
- **FR-012**: After persisting, the system MUST recompute and write `reserved_tlds_count` (count of rows where `is_reserved = true`) and `tlds_last_checked_at` (current timestamp) back to the parent `domains` row.
- **FR-013**: Persistence MUST use independent upserts per TLD row — if an individual upsert fails, other TLDs in the same batch continue to persist. The summary `reserved_tlds_count` MUST be recomputed only from successfully persisted rows, ensuring it always reflects actual database state. If ALL upserts fail, the summary columns MUST NOT be updated.
- **FR-014**: All database operations MUST respect Row Level Security policies — only the owning user's domain data can be read or written.

**Dependencies**

- **FR-015**: The engine MUST be built on the generalized `runWithConcurrency` utility and the `resolveDomain(domain, resolver, type, signal?)` function from the shared DNS engine (Phase 15 prerequisite).
- **FR-016**: The `tld_extensions` table MUST exist and be populated with TLD records before persistence can write results. The engine itself has no dependency on this table — it accepts any TLD list.

### Key Entities

- **ExtensionResult**: The output of checking one TLD for a root word. Contains: `tld` (e.g., "io"), `fullDomain` (e.g., "acmecorp.io"), `isReserved` (boolean — NS records exist), `isLive` (boolean — A record resolves), `resolver` (e.g., "cloudflare"), `tookMs` (round-trip duration). Transient — not persisted directly; consumed by `persistResults`.
- **RootExtractor**: A pure function that takes a domain string and returns the root word (first label). Example: "blog.example.com" → "blog". V1 handles simple labels; multi-label TLDs (`.co.uk`) deferred.
- **Domain Extension Check** (database row): A persisted record linking a domain to a TLD check result. Columns: `domain_id`, `tld`, `full_domain`, `is_reserved`, `is_live`, `resolver`, `checked_at`. Uniqueness constraint on `(domain_id, tld)`.
- **TLD Extension** (database row): A TLD available for checking. Columns: `extension` (e.g., "io"), `category` (generic/country/new_gtld), `is_active` (can be toggled), `sort_order`. Exists in `tld_extensions` table — populated separately, not by this phase.
- **Domain Summary Columns**: Two nullable columns on the `domains` table — `reserved_tlds_count` (INTEGER, cached count of reserved TLDs) and `tlds_last_checked_at` (TIMESTAMPTZ, when the check was last run). Updated by persistence, read by the portfolio table view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The engine can check 1 root word against 10 TLDs (20 DNS queries total) in under 10 seconds under normal network conditions.
- **SC-002**: Individual TLD query failures do not extend total batch duration beyond the timeout window (5 seconds per query) — the remaining TLDs continue unaffected.
- **SC-003**: Persisting a batch of 10 check results completes in under 2 seconds including the summary column update.
- **SC-004**: Re-running a check for an already-checked domain produces zero duplicate rows (upsert behavior verified by row count).
- **SC-005**: The engine module exports functions that can be imported and called from a browser script, a Node.js script, a Next.js Route Handler, or a React hook with zero modifications.
- **SC-006**: After checking a domain with 3 reserved TLDs out of 5 total, `domains.reserved_tlds_count` equals 3 when read back from the database.

## Assumptions

- Phase 15 (Shared DNS Engine Refactor) is complete and provides: generalized `resolveDomain(domain, resolver, type, signal?)` supporting A and NS record types, and a standalone `runWithConcurrency<T, R>(items, worker, concurrency)` utility.
- Phase 14 (Data Model) is complete and provides: the `tld_extensions`, `domain_extension_checks`, and `tld_check_jobs` tables, plus the `reserved_tlds_count` and `tlds_last_checked_at` columns on `domains`.
- The TLD list used for checking comes from the `tld_extensions` table (populated separately). The engine itself is agnostic to the list source — it accepts any string array of TLDs.
- DNS queries are executed via Cloudflare DNS-over-HTTPS (DoH) — the same provider and pattern as the existing DNS Checker tool and standalone TLD Checker tool.
- Database persistence uses the same Supabase client pattern as the rest of the application (RLS-enabled, typed helpers in `lib/supabase/queries/`).
- The standalone TLD Checker tool (Phases 14–15) continues to function independently. This engine does not replace it — it provides a shared, server-capable alternative that both the tool and portfolio integration can use.
- Multi-label TLD extraction (e.g., `.co.uk`, `.com.au`) is explicitly deferred beyond v1. The simple first-label extractor is sufficient for gTLDs and most ccTLDs.
- The `reserved_tlds_count` is a cached summary for fast portfolio table rendering. It is recomputed on every persistence, not maintained via triggers.
