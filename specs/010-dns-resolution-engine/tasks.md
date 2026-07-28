# Tasks: Core DNS Resolution Engine

**Input**: Design documents from `specs/010-dns-resolution-engine/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification. Manual verification via browser console and TypeScript compiler.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All source files live under `lib/dns/` within the existing Next.js project repository.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the module directory — no dependencies, no tooling changes needed.

- [x] T001 Create directory `lib/dns/` if it does not exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and provider configuration that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Define shared types (`Resolver`, `DnsStatus`, `DnsResult`, `DohResponse`) in `lib/dns/types.ts` per data-model.md
- [x] T003 [P] Define resolver provider configs (Cloudflare + Google endpoint URLs and headers) in `lib/dns/providers.ts` per research.md §1–2 and data-model.md §ResolverConfig

**Checkpoint**: Foundation ready — types and providers defined. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Resolve a Single Domain's IPv4 Address (Priority: P1) 🎯 MVP

**Goal**: Implement `resolveDomain()` — query a single domain's A records via DoH against a chosen resolver (Cloudflare or Google), returning a typed `DnsResult` with status, IPs, error details, and latency. Never throws; all failures map to `status: "no_dns"`.

**Independent Test**: Call `resolveDomain("google.com", "cloudflare")` in browser console and verify the returned `DnsResult` has `status: "ok"` and `ips` contains at least one valid IPv4 address.

### Implementation for User Story 1

- [x] T004 [US1] Implement `resolveDomain(domain, resolver, signal?)` in `lib/dns/resolve.ts`:
  - Build fetch URL from provider config in `providers.ts`
  - Set required headers (Cloudflare: `Accept: application/dns-json`)
  - Internal 5-second timeout via `AbortController` composition per research.md §4
  - Parse JSON response into `DohResponse` type
  - Extract IPv4 addresses from `Answer[]` (filter `type === 1` → `data` field)
  - Map empty `Answer`, `Status ≠ 0`, HTTP errors, network errors, timeouts → `status: "no_dns"` with appropriate `error` string per contracts/resolveDomain.md §No-DNS Paths
  - Measure and include `tookMs` latency
  - Return `DnsResult` — never throw

**Checkpoint**: Single-domain resolution functional. Can be tested independently in browser console.

---

## Phase 4: User Story 2 - Resolve Multiple Domains in Bulk (Priority: P2)

**Goal**: Implement `resolveBatch()` — resolve an array of domains in parallel with a configurable concurrency cap, returning all results at once as a single `DnsResult[]` array. Supports cancellation via `AbortSignal`. Builds on `resolveDomain()` from US1.

**Independent Test**: Call `resolveBatch(["google.com", "cloudflare.com", "this-domain-does-not-exist-12345.com"], "cloudflare", { concurrency: 10 })` and verify all three results are returned: two with `status: "ok"`, one with `status: "no_dns"`.

### Implementation for User Story 2

- [x] T005 [US2] Implement `resolveBatch(domains, resolver, options?)` in `lib/dns/resolve.ts`:
  - Handle empty input (return `[]` immediately)
  - Concurrency pool pattern per research.md §3: maintain at most `options.concurrency` (default 20) in-flight calls to `resolveDomain`
  - Queue domains, launch initial pool, start next as each resolves
  - Use `Promise.allSettled` semantics — individual failures do not reject batch
  - Return results in same order as input `domains` array
  - Support `options.signal` for external cancellation: abort all in-flight requests, return empty array per contracts/resolveBatch.md §Cancellation

**Checkpoint**: Bulk resolution functional. Can be tested independently by resolving mixed-validity domain lists.

---

## Phase 5: User Story 3 - Parse Raw Domain Input into Clean Domain List (Priority: P3)

**Goal**: Implement `parseDomainList()` — accept raw pasted text (URLs, commas, spaces, newlines, duplicates) and return a clean, deduplicated, lowercased, validated list of domain strings. Reject inputs exceeding 200 domains.

**Independent Test**: Call `parseDomainList("https://example.com/path, google.com\\nGOOGLE.COM !!!invalid\\ncloudflare.com")` and verify output is `{ domains: ["example.com", "google.com", "cloudflare.com"] }` with duplicates removed and invalid entries discarded.

### Implementation for User Story 3

- [x] T006 [US3] Implement `parseDomainList(rawText)` in `lib/dns/parseInput.ts`:
  - Split input on newlines, commas, and whitespace into tokens per contracts/parseInput.md §Parsing Rules step 1
  - Strip protocol (`https://`, `http://`), paths, ports, query strings, and trailing slashes from URL-form tokens (step 2)
  - Lowercase all tokens (step 3)
  - Validate each token against RFC 952/1123 hostname regex per research.md §5 and contracts/parseInput.md §Validation Regex (step 4)
  - Deduplicate: keep first occurrence of each domain (step 5)
  - Cap enforcement: reject inputs exceeding 200 unique domains with `{ error: "..." }` (applied after deduplication)
  - Return `{ domains: string[] }` on success, `{ error: string }` on cap exceeded
  - Discard invalid tokens silently; empty input returns `{ domains: [] }`

**Checkpoint**: Input parser functional. Can be tested independently with messy pasted text.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup across all user stories.

- [x] T007 Run TypeScript typecheck (`npx tsc --noEmit` or `npm run typecheck`) — must pass with zero errors
- [x] T008 Verify exit criteria: manually test `resolveBatch(["google.com"], "cloudflare")` returns `status: "ok"` with at least one IPv4 address in browser console
- [x] T009 Remove any dead code, console.log debugging statements, or unused imports from all `lib/dns/` files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001) — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1 (T004): Depends on T002 + T003
  - US2 (T005): Depends on T004 (calls `resolveDomain`)
  - US3 (T006): Depends on T002 (uses `Resolver` type indirectly) — can run in parallel with US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1 (`resolveDomain`). Must be sequential after US1.
- **User Story 3 (P3)**: Can start after Foundational. Independent of US1 and US2. Can run in parallel with US1.

### Within Each User Story

- Single implementation task per story (this phase is small and focused)
- Each story completes before moving to its dependent story

### Parallel Opportunities

- T002 + T003 can run in parallel (different files, both in Foundational)
- T004 (US1) and T006 (US3) can run in parallel after Foundational completes
- T007, T008, T009 can run in sequence after all stories complete

---

## Parallel Example: Foundational Phase

```bash
# Launch both foundational tasks together:
Task: "Define shared types in lib/dns/types.ts per data-model.md"
Task: "Define resolver provider configs in lib/dns/providers.ts per research.md"
```

## Parallel Example: Post-Foundational

```bash
# After Foundational completes, US1 and US3 can run in parallel:
Task: "Implement resolveDomain() in lib/dns/resolve.ts"
Task: "Implement parseDomainList() in lib/dns/parseInput.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: User Story 1 (T004)
4. **STOP and VALIDATE**: Test `resolveDomain("google.com", "cloudflare")` in browser console
5. MVP delivers single-domain DNS resolution — base capability for the tool

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Single-domain resolution works (MVP)
3. Add User Story 2 → Test independently → Bulk resolution works
4. Add User Story 3 → Test independently → Domain parser works
5. Polish → TypeScript clean, exit criteria verified
6. Each story adds value without breaking previous stories

### Single Developer Strategy

1. T001 → T002 + T003 (parallel) → T004 → T005 → T006 → T007 + T008 + T009
2. Total: 9 tasks, ~4 sequential steps (setup, foundational, US1→US2, US3, polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test files — testing via manual browser console and TypeScript compiler
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Exit criteria: `resolveBatch(["google.com"], "cloudflare")` returns valid IPv4; `npm run typecheck` passes
