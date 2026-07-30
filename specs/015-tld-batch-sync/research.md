# Research: TLD Batch Sync & API Routes

**Date**: 2026-07-30 | **Feature**: Phases 17+18

## Decision: Chunked Processing with 5-Domain Groups

### What we chose

The job processor iterates domains in groups of 5, calling Phase 16's `checkAllExtensionsForRoot` + `persistResults` per group. After each group completes, results are persisted immediately and `processed_pairs` is updated.

### Rationale

- 5 domains × 15 TLDs × 2 queries = 150 DNS queries per chunk, comfortably within Cloudflare/Google rate limits
- Vercel serverless functions have 10–60s timeouts. A 5-domain chunk with 10 TLDs takes ~15–20s, fitting within a single invocation
- For large jobs (500 domains), the loop runs across multiple function invocations with state tracked in the DB
- Incremental persistence means partial progress is never lost — a crash mid-sync only loses the current chunk

### Alternatives considered

| Approach | Why rejected |
|---|---|
| Process all domains in one go | Would exceed serverless timeout for >50 domains and saturate DNS providers with 1000s of concurrent requests |
| One domain per invocation | Too slow — 500 invocations would take hours due to cold start overhead |
| Background worker (cron) | Adds infrastructure complexity. The chunked approach works within existing serverless architecture |

## Decision: Split DNS Queries Across Cloudflare and Google

### What we chose

Alternate the resolver per domain group: Group 1 uses Cloudflare, Group 2 uses Google, Group 3 uses Cloudflare, etc. This distributes load evenly across both providers.

### Rationale

- Both providers have informal rate limits; splitting halves the load per provider from a single server IP
- The Phase 16 engine already supports resolver parameterization
- No additional infrastructure needed — just alternate the resolver string passed to `checkAllExtensionsForRoot`

## Decision: Resumable Jobs via Timestamp Comparison

### What we chose

When a job is interrupted and must be resumed (or a new job is created for the same domains), the processor compares each domain's `tlds_last_checked_at` against the job's `created_at`. Domains checked after the job was created are considered complete and skipped.

### Rationale

- Simple, database-native — no additional state tracking tables needed
- No wasted DNS queries re-checking domains that are already up to date
- Works for both explicit resume (user clicks "retry") and implicit resume (stale running job detected)

### Edge case

If `tlds_last_checked_at` is NULL (domain never checked), the domain is always included in the job. This is correct — NULL means "never checked."

## Decision: Progress Delivery — Supabase Realtime with Polling Fallback

### What we chose

Primary: Supabase Realtime subscription on the `tld_check_jobs` row for the active job. The client subscribes to row changes and updates the progress bar instantly when `processed_pairs` changes.

Fallback: If Realtime is unavailable or the client prefers polling, GET the job status every 2–3 seconds.

### Rationale

- Supabase Realtime is already configured (used elsewhere in the app) — no new infrastructure
- Push-based updates are more responsive than polling (sub-second vs 2–3s intervals)
- Polling fallback ensures the feature works even when Realtime is degraded
- The job row is small (single row per user) — even polling every 2s is negligible load

## Decision: API Route Pattern — Follow Existing Sedo/Spaceship Convention

### What we chose

API routes follow the exact pattern established by the Sedo and Spaceship integrations:

1. Authenticate user via `createServerClient()` + `supabase.auth.getUser()`
2. Validate domain ownership via server-side query (not just trusting client-supplied domain IDs)
3. Call engine functions from `lib/tld-checker/`
4. Return `{ data }` on success, `{ error }` on failure, `401` if unauthenticated, `403` if cross-user access, `500` on unexpected errors

### Rationale

- Consistent with existing route handler patterns (constitution compliance)
- The Sedo/Spaceship patterns are well-tested and understood by the team
- Same auth flow, same error shape, same response conventions

## Decision: Single-Domain Refresh — Synchronous

### What we chose

The `POST /api/tld-checker/domains/:id/refresh` endpoint runs the full check+persist cycle synchronously and returns the result in the HTTP response. It does NOT create a job.

### Rationale

- Single domain with 10 TLDs completes in <20 seconds — well within serverless timeout
- Synchronous is simpler for the client — no polling or subscription needed
- The user is actively waiting for this result (clicking "Refresh" on a specific domain) — async would feel broken
- If TLD lists grow beyond 20, this can be replaced with a fast job in a future iteration
