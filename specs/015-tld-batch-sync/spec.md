# Feature Specification: TLD Batch Sync & API Routes

**Feature Branch**: `015-tld-batch-sync`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "# DNS Checker → TLD Reservation Checker Phase 17 & 18 (in the same spec)"

## Clarifications

### Session 2026-07-30

- Q: When a user triggers a sync while another sync job is already running, what should happen? → A: Disable the "Sync All" button while a job is running to prevent duplicate triggers at the UI level. If a duplicate request reaches the server (e.g., via direct API call), reject it with a 409 Conflict response.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sync All Portfolio Domains for TLD Status (Priority: P1)

A domain investor has 200 domains in their portfolio and wants to check TLD reservation status for all of them at once — not one at a time. They click "Sync All" and see a live progress bar showing how many domain+TLD pairs have been checked. The process runs in the background without blocking their browser, and they can navigate away and come back to see the results.

**Why this priority**: Without batch sync, the TLD checker is limited to ad-hoc single-domain checks. A portfolio-scale investor cannot manually trigger checks for hundreds of domains. Batch sync is the bridge from a tool to a platform feature.

**Independent Test**: With 5 domains in the portfolio and an active TLD list of 3 extensions (15 total pairs), click "Sync All". Verify a job is created, the progress bar advances as pairs are processed, and after completion all 5 domains show updated `reserved_tlds_count` values.

**Acceptance Scenarios**:

1. **Given** a user has domains in their portfolio, **When** they trigger a "Sync All" from the domains page, **Then** a background job is created for all their domains against the active TLD list. The job processes domains in small groups (5 at a time), persisting results incrementally as each group completes.
2. **Given** a sync job is running, **When** the user views the progress indicator, **Then** a live counter shows completed pairs out of total pairs (e.g., "45/150"). The indicator updates in real time without requiring page refresh.
3. **Given** a sync job is interrupted mid-run (server restart, browser close, network loss), **When** the system resumes or a new sync is triggered, **Then** domains that already completed their checks are skipped — only domains with stale or missing data are re-processed. No duplicate DNS queries are wasted.
4. **Given** a sync job processes 100 domains, **When** individual DNS queries encounter rate-limiting (429 responses) or timeouts, **Then** those specific queries are retried once with a brief delay before being recorded as unavailable. Other queries in the batch continue unaffected.
5. **Given** a sync job completes, **When** the user views their domains table, **Then** each domain shows its updated `reserved_tlds_count` reflecting the number of TLDs where the domain is already registered by someone else.
6. **Given** a sync job is running, **When** the user views the "Sync All" button, **Then** the button is disabled and shows the current progress (e.g., "Syncing... 45/150"), preventing duplicate triggers.

---

### User Story 2 - Live Progress Tracking During Sync (Priority: P2)

A user wants to know exactly how far along a sync job is — not just a spinner. They see a percentage bar, completed/total counts, and an estimated time remaining. If the job fails, they see what went wrong so they can retry.

**Why this priority**: Progress visibility builds trust in long-running operations. Without it, users may assume the tool is broken and abandon it. However, the sync works even without rich progress — a simple spinner is functional but frustrating.

**Independent Test**: Trigger a sync on 20 domains with 8 TLDs (160 pairs). Verify a progress bar appears and updates at least every 3 seconds. After completion, verify the bar reaches 100% and shows "Completed" status.

**Acceptance Scenarios**:

1. **Given** a sync job is created, **When** the user views the job status, **Then** they see the current state: queued, running, completed, or failed — along with `processed_pairs / total_pairs` counts.
2. **Given** a sync job is running, **When** individual domain groups complete, **Then** the `processed_pairs` count increments and the client receives an update (via real-time subscription or polling) within 3 seconds of each increment.
3. **Given** a sync job fails mid-run, **When** the user checks the status, **Then** the `status` is "failed" with an error message explaining what went wrong (e.g., "DNS provider rate limited after 500 requests"). The user can trigger a retry.
4. **Given** the user navigates away from the page during a sync, **When** they return, **Then** the progress indicator reflects the current state of the job — not reset to zero.

---

### User Story 3 - Single-Domain Refresh and Extension Lookup (Priority: P2)

A user sees that a single domain in their portfolio shows zero or no reserved TLDs. They want to refresh just that one domain's TLD data without triggering a full portfolio sync. They click a "Refresh TLDs" button on that domain's row and see the results update within seconds.

**Why this priority**: Single-domain refresh is the most common day-to-day action — a user checks a newly added domain or re-checks after a registration event. It's more frequent than full sync but shares the same backend infrastructure.

**Independent Test**: From the domains list, trigger a refresh on a single domain. Verify that domain's `reserved_tlds_count` updates and the extension check rows are created/updated in the database.

**Acceptance Scenarios**:

1. **Given** a domain row in the portfolio table, **When** the user clicks "Refresh TLDs" (or equivalent action), **Then** a single-domain check is triggered against the active TLD list. Results are persisted and the domain's reserved count column updates inline without a page reload.
2. **Given** a domain has existing TLD check data, **When** the user refreshes that domain, **Then** existing rows are upserted (updated, not duplicated) and the summary count is recomputed.
3. **Given** the user wants to see which specific TLDs are reserved for a domain, **When** they expand or click into the domain's TLD details, **Then** a list of TLDs with their reservation and liveness status is displayed — reserved TLDs shown first, then available, then errors.

---

### Edge Cases

- What happens when the active TLD list is empty (no rows in `tld_extensions` with `is_active = true`)? → The job is created but `total_pairs = 0`. The job completes immediately with status "completed" and no processing.
- What happens when a user triggers a sync while another sync is already running for the same user? → The "Sync All" button is disabled while a job is running, preventing duplicate triggers at the UI level. If a duplicate request reaches the server (e.g., direct API call), it is rejected with a 409 Conflict response.
- What happens when a domain is deleted from the portfolio while a sync job referencing it is running? → The job's `domain_ids` is a snapshot at creation time. If a domain was deleted, the persistence step simply skips it (upsert on a non-existent domain_id is a no-op or returns an ignorable error).
- How does the system handle DNS provider rate limiting across many concurrent queries? → Queries are split across Cloudflare and Google resolvers (alternating per domain group). Individual 429 responses trigger a single retry with backoff. The concurrency is capped at 5 domains × 15 TLDs = ~75 simultaneous requests.
- What happens when the server hosting the job process crashes mid-sync? → The job row shows `status = 'running'`. On next sync trigger or admin action, the system detects the stale job and either resumes it (re-processing only incomplete domains) or marks it as "failed" so a new job can be created.

## Requirements *(mandatory)*

### Functional Requirements

**Batch Sync Engine (Phase 17)**

- **FR-001**: The system MUST support creating a background job that checks TLD reservation status for multiple domains at once — a "Sync All" operation covering the user's entire portfolio or a selected page of domains.
- **FR-002**: A sync job MUST capture a snapshot of the target domain IDs at creation time. Changes to the portfolio after job creation (additions, deletions) MUST NOT affect the job's domain list.
- **FR-003**: The system MUST compute `total_pairs = domain_count × active_tld_count` at job creation and track `processed_pairs` as the job progresses, enabling a progress percentage.
- **FR-004**: The sync processor MUST process domains in small groups (e.g., 5 roots at a time). Each group's results MUST be persisted immediately (incremental persistence) — not held until the entire sync completes.
- **FR-005**: The system MUST split DNS queries across both Cloudflare and Google resolvers (alternating per domain group) to distribute load and avoid hitting per-provider rate limits from a single server IP.
- **FR-006**: Individual DNS queries that receive a rate-limit response (HTTP 429) or timeout MUST be retried once with a brief delay before being recorded as unavailable. This avoids false negatives from transient throttling.
- **FR-007**: If a sync job is interrupted (server crash, restart), the system MUST be able to resume by re-processing only domains whose `tlds_last_checked_at` is older than the job's `created_at` — skipping already-completed work.
- **FR-008**: Only one active (running) sync job MUST be allowed per user at a time. The "Sync All" button MUST be disabled while a job is running to prevent duplicate triggers at the UI level. If a duplicate request reaches the server, the API MUST reject it with a 409 Conflict response.

**Progress & Status (Phase 17)**

- **FR-009**: The system MUST expose job status (queued, running, completed, failed) and progress (`processed_pairs / total_pairs`) via a queryable endpoint so the client can display a progress indicator.
- **FR-010**: The client MUST be able to receive progress updates in real time (via subscription to job row changes) or by polling at regular intervals (every 2–3 seconds) as a simpler fallback.
- **FR-011**: When a job fails, the `status` MUST be set to "failed" and an `error` field MUST contain a human-readable description of the failure reason.

**API Routes (Phase 18)**

- **FR-012**: The system MUST provide an API endpoint to create a new sync job (`POST /api/tld-checker/jobs`). The endpoint MUST accept a `scope` parameter ("all" for portfolio-wide, or domain IDs for a selected page) and return the created job's ID and initial status.
- **FR-013**: The system MUST provide an API endpoint to query a job's status (`GET /api/tld-checker/jobs/:id`). The response MUST include `status`, `total_pairs`, `processed_pairs`, and `error` (if any).
- **FR-014**: The system MUST provide an API endpoint to fetch TLD extension check results for a single domain (`GET /api/tld-checker/domains/:domainId/extensions`). The response MUST return a list of `{ tld, fullDomain, isReserved, isLive }` sorted with reserved TLDs first.
- **FR-015**: The system MUST provide an API endpoint to trigger a single-domain refresh (`POST /api/tld-checker/domains/:domainId/refresh`). This MUST run the check synchronously against the active TLD list and persist results before responding.
- **FR-016**: All API routes MUST authenticate the user and verify that the requested domain IDs belong to the authenticated user. Attempts to access or modify another user's data MUST return a 403 or 404 response.
- **FR-017**: Route handler authentication MUST be server-side only — the user's session token is validated via secure cookies. No API keys or credentials are sent in request bodies or URL parameters.
- **FR-018**: The single-domain refresh endpoint MUST complete within a reasonable time window for a synchronous API response (under 20 seconds for up to 10 active TLDs) so the client can await the result without timeout.

### Key Entities

- **Sync Job**: A database record in `tld_check_jobs` tracking a batch TLD check operation. Contains: `id`, `user_id`, `scope` ("all" or "page"), `domain_ids` (snapshot array), `status` (queued/running/completed/failed/cancelled), `total_pairs`, `processed_pairs`, `error`, timestamps. One active job per user at a time.
- **Job Processor**: The server-side execution loop that picks up a queued/running job and processes domains in small groups. It calls the Phase 16 engine (`checkAllExtensionsForRoot` + `persistResults`) per domain group, updates `processed_pairs` after each group, and handles retries for transient failures.
- **Progress Subscription**: A real-time channel (or polling interval) through which the client receives job progress updates. Delivers `processed_pairs / total_pairs` deltas as they occur.
- **Resumable Checkpoint**: The mechanism by which an interrupted job can resume without redundant work — comparing each domain's `tlds_last_checked_at` against the job's `created_at`. Domains checked after job creation are considered complete for that job.
- **API Route**: Server-side endpoint handling HTTP requests for job management and domain TLD data access. All routes are authenticated and scoped to the requesting user's data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A sync job processing 50 domains against 10 TLDs (500 pairs, 1000 DNS queries) completes within 5 minutes under normal network conditions.
- **SC-002**: Progress updates are delivered to the client within 3 seconds of each domain group completing — the progress bar never stalls for more than 3 seconds without an update.
- **SC-003**: A single-domain refresh against 10 active TLDs completes and returns results within 20 seconds.
- **SC-004**: An interrupted sync job that is resumed re-checks only domains that haven't been processed yet — no more than 5% of already-completed pairs are re-queried on resume.
- **SC-005**: Rate-limited DNS queries (HTTP 429) are retried successfully on the first retry at least 80% of the time — meaning the retry mechanism effectively handles transient throttling.
- **SC-006**: Unauthorized access attempts to another user's domain data via any API route return a 403 or 404 response with zero data leakage.
- **SC-007**: The "Sync All" button is visible and functional from the domains page. A user can initiate a full portfolio sync in under 3 clicks.
- **SC-008**: After a sync job completes, all domains in the portfolio show an accurate `reserved_tlds_count` that matches the count of actual reserved TLDs in `domain_extension_checks` within a 2% margin of error.

## Assumptions

- Phase 16 (TLD Data Enrichment Engine) is complete and provides: `checkAllExtensionsForRoot()`, `extractRootWord()`, `persistResults()`, and `checkAndPersist()`.
- Phase 14 (Data Model) is complete and provides: `tld_check_jobs`, `tld_extensions`, `domain_extension_checks` tables with RLS enabled.
- The Supabase project supports Realtime subscriptions for the `tld_check_jobs` table, enabling live progress updates. Polling every 2–3 seconds is the fallback if Realtime is unavailable.
- Server-side execution for batch jobs can run within Vercel serverless function limits (10s–60s depending on plan). For larger jobs, the processing loop runs across multiple function invocations with state tracked in the database.
- DNS queries are split across Cloudflare and Google DoH to distribute load. Both providers support the same query patterns used in Phase 16.
- The user's session is managed by Supabase Auth with secure HTTP-only cookies. API routes verify the session via the Supabase server client.
- The active TLD list is managed via the `tld_extensions` table (populated separately). An empty or unpopulated table results in zero-pair jobs that complete immediately.
- The single-domain refresh endpoint is synchronous — it awaits the full check+persist cycle before responding. For large TLD lists, this may be replaced with a fast job in a future iteration.
- Rate limiting (HTTP 429) is handled with a single retry with exponential backoff (1s delay). Persistent rate limiting beyond one retry results in the domain being skipped with an error logged.
- Cross-user domain ID validation is performed both in the API route (server-side check) and via RLS policies on the database (defense in depth).
