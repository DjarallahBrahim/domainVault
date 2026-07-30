# Tasks: TLD Batch Sync & API Routes

**Input**: Design documents from `/specs/015-tld-batch-sync/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and database query foundation

- [ ] T001 Create `app/api/tld-checker/` directory tree matching plan.md structure — `jobs/`, `jobs/[id]/`, `domains/[domainId]/extensions/`, `domains/[domainId]/refresh/`
- [ ] T002 Create `lib/tld-checker/jobs/` and `components/domains/` directories
- [ ] T003 [P] Create `lib/supabase/queries/tld-jobs.ts` — placeholder for job CRUD functions

---

## Phase 2: Foundational — Job Database Operations

**Purpose**: Core job CRUD functions that all stories depend on

**⚠️ CRITICAL**: No story work can begin until this phase is complete

- [ ] T004 Implement `createJob()` in `lib/supabase/queries/tld-jobs.ts` — insert into `tld_check_jobs` with snapshot of domain IDs, compute `total_pairs = domain_count × active_tld_count`, set `status = 'queued'`, return job row. Check for existing active job (queued/running) before creating — throw or return error if one exists.
- [ ] T005 Implement `getJob()` in `lib/supabase/queries/tld-jobs.ts` — select job by ID, verify `user_id` matches authenticated user, return job row or null
- [ ] T006 Implement `updateJobStatus()` in `lib/supabase/queries/tld-jobs.ts` — update status, `processed_pairs`, `error` fields; set `started_at` when transitioning to running; set `finished_at` when transitioning to completed/failed/cancelled
- [ ] T007 Implement `incrementProcessedPairs()` in `lib/supabase/queries/tld-jobs.ts` — atomically increment `processed_pairs` by a given delta

**Checkpoint**: Job CRUD ready — engine and API routes can now use job operations

---

## Phase 3: User Story 1 — Sync All Portfolio Domains (Priority: P1) 🎯 MVP

**Goal**: User triggers "Sync All", a background job processes all domains in chunks with incremental persistence

**Independent Test**: Create a job with 5 domains × 3 TLDs (15 pairs), verify the processor calls Phase 16 engine per domain, persists results, and marks job complete with `processed_pairs = total_pairs`

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `createSyncJob()` in `lib/tld-checker/jobs/createJob.ts` — resolve scope (all user domains vs provided IDs), snapshot domain IDs, call `createJob()` from queries, return job ID + total pairs
- [ ] T009 [US1] Implement `processJob()` in `lib/tld-checker/jobs/processJob.ts` — accept job row, mark as running, iterate domains in chunks of 5, alternate resolver (Cloudflare/Google) per chunk, for each domain: extract root word → `checkAllExtensionsForRoot()` → `persistResults()`, call `incrementProcessedPairs()` after each chunk, mark completed when done, catch errors and mark failed
- [ ] T010 [US1] Implement `resumeJob()` in `lib/tld-checker/jobs/resumeJob.ts` — for each domain in job's snapshot, skip if `tlds_last_checked_at >= job.created_at` (already processed), only process remaining domains, update `processed_pairs` to reflect already-completed pairs
- [ ] T011 [US1] Add 429 retry logic in `processJob()` — if `checkAllExtensionsForRoot` returns results dominated by errors suggesting rate limiting, retry the chunk once with a 1s delay before recording results
- [ ] T012 [US1] Verify — create a job with 5 test domains, inspect `tld_check_jobs` row state transitions, verify `domain_extension_checks` rows created, verify `domains.reserved_tlds_count` updated

**Checkpoint**: US1 functional — full-sync job can be created, processed, and completed

---

## Phase 4: User Story 2 — Live Progress Tracking (Priority: P2)

**Goal**: Client sees real-time progress bar updating as the job processes domain groups

**Independent Test**: Start a job, verify progress bar appears, updates within 3s of each chunk, reaches 100% at completion, shows error state if job fails

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create `useJobProgress()` hook in `lib/hooks/useJobProgress.ts` — accept jobId, subscribe to `tld_check_jobs` row UPDATE via Supabase Realtime channel, update local state with `processedPairs / totalPairs`, return `{ progress, status, error }`
- [ ] T014 [P] [US2] Add polling fallback to `useJobProgress()` — if Realtime channel fails to connect within 5s, fall back to polling `GET /api/tld-checker/jobs/:id` every 3s, clean up interval on unmount or job completion
- [ ] T015 [US2] Ensure progress reflects resumed jobs — if a previously-cancelled job is retried, `processed_pairs` starts from the value saved before cancellation, not from zero
- [ ] T016 [US2] Verify — start a sync, confirm progress updates in console/Hook state, observe final state reaching 100%, test polling fallback by blocking Realtime on client

**Checkpoint**: US2 functional — progress tracking works with both Realtime and polling

---

## Phase 5: User Story 3 — API Routes & Single-Domain Refresh (Priority: P2)

**Goal**: API endpoints for job management, extension data retrieval, and single-domain refresh

**Independent Test**: Call each API route via HTTP client, verify auth rejects unauthenticated requests, verify cross-user domain access returns 404, verify single-domain refresh updates the expected database rows

### Implementation for User Story 3

- [ ] T017 [P] [US3] Implement `POST /api/tld-checker/jobs` in `app/api/tld-checker/jobs/route.ts` — authenticate user, validate scope param, call `createSyncJob()`, return 201 with job ID and total pairs, reject with 409 if active job exists
- [ ] T018 [P] [US3] Implement `GET /api/tld-checker/jobs/[id]` in `app/api/tld-checker/jobs/[id]/route.ts` — authenticate, fetch job via `getJob()`, verify ownership, return job status/progress, 404 if not found or not owned
- [ ] T019 [P] [US3] Implement `GET /api/tld-checker/domains/[domainId]/extensions` in `app/api/tld-checker/domains/[domainId]/extensions/route.ts` — authenticate, verify domain ownership (query domains table with user_id check), fetch extension checks from `domain_extension_checks`, sort reserved first, return list
- [ ] T020 [P] [US3] Implement `POST /api/tld-checker/domains/[domainId]/refresh` in `app/api/tld-checker/domains/[domainId]/refresh/route.ts` — authenticate, verify domain ownership, extract root word, fetch active TLDs, call `checkAllExtensionsForRoot()` + `persistResults()` synchronously, return results + new reserved count
- [ ] T021 [US3] Add server-side domain ownership validation helper — shared utility function used by all domain-specific routes to avoid duplicated auth + ownership checks
- [ ] T022 [US3] Verify — test all 4 routes with valid auth; test with invalid/missing auth (expect 401); test with another user's domain ID (expect 404); test single-domain refresh end-to-end

**Checkpoint**: US3 functional — all API routes operational and secured

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI component, error handling, and final verification

- [ ] T023 Create `TldSyncButton.tsx` in `components/domains/TldSyncButton.tsx` — "Sync All" button that calls `POST /api/tld-checker/jobs`, disables and shows progress text ("Syncing... 45/150") while job runs, uses `useJobProgress` hook, re-enables on completion/failure
- [ ] T024 Handle edge case: empty active TLD list — `createSyncJob` sets `total_pairs = 0`, job completes immediately with status "completed"
- [ ] T025 Handle edge case: all domains already checked — `resumeJob` skips all domains, `processed_pairs == total_pairs`, job completes immediately
- [ ] T026 Verify all source files pass `npx tsc --noEmit` with zero errors
- [ ] T027 Final cleanup — remove dead code, debug logs, unused imports; verify no hardcoded values in new files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational + Phase 16 engine
- **US2 (Phase 4)**: Depends on US1 (needs running jobs to track progress)
- **US3 (Phase 5)**: Depends on Foundational + Phase 16 engine
- **Polish (Phase 6)**: Depends on US1 + US2 + US3

### User Story Dependencies

- **US1 (P1)**: Batch sync engine — depends on Foundational. No dependency on US2/US3.
- **US2 (P2)**: Progress tracking — depends on US1 (needs job processing to show progress)
- **US3 (P2)**: API routes — depends on Foundational. Can run in parallel with US1 once T004-T007 are done.

### Parallel Opportunities

- **Phase 3 (US1)**: T008 can run in parallel with T010 (different files: createJob.ts vs resumeJob.ts). T009 depends on T008.
- **Phase 4 (US2)**: T013 + T014 can run in parallel if Realtime and polling are separate modules.
- **Phase 5 (US3)**: T017 + T018 + T019 + T020 can ALL run in parallel (different route files).
- **Phase 6**: T023 can run in parallel with T024-T025 (UI component vs edge cases).

### Suggested Execution (Single Developer)

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 5 (US3) → Phase 4 (US2) → Phase 6

US1 and US3 can be swapped if API routes feel more impactful early. US2 must come after US1.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (job CRUD)
3. Complete Phase 3: US1 (batch sync engine)
4. **STOP and VALIDATE**: Trigger a sync programmatically, verify domains get checked and persisted
5. Job processor works — can be invoked from an API route or script

### Incremental Delivery

1. Setup + Foundational → Job CRUD ready
2. Add US1 → Full-sync engine works → **MVP!**
3. Add US3 → API routes operational → client can trigger jobs
4. Add US2 → Progress tracking → user sees live updates
5. Add Polish → TldSyncButton + edge cases → production-ready

---

## Notes

- [P] tasks = different files, no dependencies between them
- [US*] label maps task to specific user story for traceability
- Phase 16 engine functions (`checkAllExtensionsForRoot`, `persistResults`, `checkAndPersist`) are assumed complete and importable
- Phase 14 data model tables (`tld_check_jobs`, `tld_extensions`, `domain_extension_checks`) are assumed to exist
- Supabase query functions use `any` client type until migration tables are in generated types (same pattern as Phase 16)
- Run `npx tsc --noEmit` after each phase; fix errors before proceeding
- All API routes must follow the existing auth pattern: `createServerClient()` → `auth.getUser()` → validate ownership
