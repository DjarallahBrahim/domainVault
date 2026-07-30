# Tasks: TLD Data Enrichment Engine

**Input**: Design documents from `/specs/014-tld-data-enrichment/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and foundational types

- [ ] T001 Create `lib/tld-checker/` directory
- [ ] T002 [P] Define `ExtensionResult`, `CheckExtensionsOptions`, `PersistOutcome` types in `lib/tld-checker/types.ts`
- [ ] T003 [P] Create `lib/supabase/queries/extension-checks.ts` and `lib/supabase/queries/tld-extensions.ts` placeholder files

---

## Phase 2: Foundational — Root Extraction & Shared Engine Integration

**Purpose**: Utilities that both the engine and persistence layers depend on

**⚠️ CRITICAL**: No engine or persistence work can begin until this phase is complete

- [ ] T004 Implement `extractRootWord()` in `lib/tld-checker/rootExtractor.ts` — split on first `.`, return first label, preserve hyphens/digits, fallback to full string if no dot
- [ ] T005 Verify `extractRootWord` handles edge cases — "acmecorp.com" → "acmecorp", "blog.example.co.uk" → "blog", "my-site.io" → "my-site", "nodev" → "nodev"
- [ ] T006 Confirm shared DNS engine entry points exist — verify `resolveDomain(domain, resolver, type, signal?)` accepts `"NS"` type (Phase 15 output) and `runWithConcurrency` utility is importable

**Checkpoint**: Foundation ready — engine and persistence can now be built

---

## Phase 3: User Story 2 — Reusable Engine with Zero UI Dependencies (Priority: P1)

**Goal**: `checkAllExtensionsForRoot()` function that queries NS + A records per TLD and returns `ExtensionResult[]`

**Independent Test**: Call `checkAllExtensionsForRoot("acmecorp", ["io", "ai", "co"], "cloudflare")` and verify 3 results with correct `isReserved`/`isLive` flags populated

### Implementation for User Story 2

- [ ] T007 [US2] Implement `checkAllExtensionsForRoot()` in `lib/tld-checker/checkExtensions.ts` — accept (root, tlds[], resolver, options?), construct `${root}.${tld}` for each TLD, fire NS + A queries in parallel via `Promise.all([resolveDomain(...), resolveDomain(...)])`, combine into `ExtensionResult` per TLD
- [ ] T008 [US2] Integrate `runWithConcurrency` from shared engine — wrap the per-TLD worker (parallel NS+A) in `runWithConcurrency` with default concurrency 15, respect `options.concurrency` override
- [ ] T009 [US2] Handle individual TLD failures — if both NS and A queries fail for a TLD, return `ExtensionResult` with `isReserved: false`, `isLive: false`, and `error` populated; other TLDs continue unaffected
- [ ] T010 [US2] Handle abort — if `options.signal` is aborted, resolve with partial results for already-completed TLDs, return empty array for not-yet-started TLDs
- [ ] T011 [US2] Verify — call with 3 known TLDs against a real domain, confirm `isReserved` matches NS status, `isLive` matches A status, abort mid-check and confirm partial results

**Checkpoint**: US2 functional — engine works standalone with no UI/database dependencies

---

## Phase 4: User Story 3 — Persist Results to the Portfolio Database (Priority: P2)

**Goal**: `persistResults()` function and Supabase query helpers for upserting TLD check results and updating domain summary columns

**Independent Test**: Persist results for a domain, verify `domain_extension_checks` rows created, verify `domains.reserved_tlds_count` updated correctly

### Implementation for User Story 3

- [ ] T012 [P] [US3] Implement `upsertExtensionCheck()` in `lib/supabase/queries/extension-checks.ts` — INSERT with `ON CONFLICT (domain_id, tld) DO UPDATE` for is_reserved, is_live, resolver, checked_at; accept Supabase client + params
- [ ] T013 [P] [US3] Implement `recomputeReservedCount()` in `lib/supabase/queries/extension-checks.ts` — COUNT WHERE domain_id = $1 AND is_reserved = true, write to domains.reserved_tlds_count, set domains.tlds_last_checked_at = NOW()
- [ ] T014 [P] [US3] Implement `fetchExtensionChecks()` in `lib/supabase/queries/extension-checks.ts` — SELECT all rows for a domain_id ordered by tld
- [ ] T015 [P] [US3] Implement `fetchActiveTlds()` in `lib/supabase/queries/tld-extensions.ts` — SELECT extension FROM tld_extensions WHERE is_active = true ORDER BY sort_order
- [ ] T016 [US3] Implement `persistResults()` in `lib/tld-checker/persistResults.ts` — iterate results, call `upsertExtensionCheck()` per TLD independently, collect failures in PersistOutcome.errors[], call `recomputeReservedCount()` after all upserts; skip summary update if ALL upserts failed
- [ ] T017 [US3] Handle edge case: if domain has no prior checks (reserved_tlds_count is NULL), persistResults still successfully writes count after first check
- [ ] T018 [US3] Verify — persist 5 TLD results for a test domain, verify 5 rows in domain_extension_checks, verify reserved_tlds_count matches is_reserved count, re-run with same data and verify row count unchanged (upsert), verify tlds_last_checked_at updated

**Checkpoint**: US3 functional — results can be persisted and summary stays accurate

---

## Phase 5: User Story 1 — End-to-End TLD Status Check for Portfolio Domains (Priority: P1)

**Goal**: Wire the engine + persistence together — given a domain in the portfolio, fetch active TLDs, check all, persist results

**Independent Test**: Given domain "acmecorp.com" in portfolio with TLD list [.io, .ai, .co], run full check+persist flow; verify domain_extension_checks has 3 rows and domains.reserved_tlds_count reflects actual reserved count

### Implementation for User Story 1

- [ ] T019 [US1] Build integration function or demonstration script — wire `fetchActiveTlds()` → `extractRootWord()` → `checkAllExtensionsForRoot()` → `persistResults()` into a single callable flow in `lib/tld-checker/checkAndPersist.ts` (or inline in a quickstart script)
- [ ] T020 [US1] Add error handling for the full flow — if TLD list fetch fails, return early with error; if all engine results are errors, skip persistence; if some persistence fails, return partial outcome with failed TLD details
- [ ] T021 [US1] Verify end-to-end — use a real domain from the portfolio, run full flow, inspect database rows, confirm counts are correct, verify RLS rejects writes to another user's domain

**Checkpoint**: US1 functional — complete pipeline from domain to persisted TLD data

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, type generation, and final verification

- [ ] T022 Regenerate Supabase types via `npx supabase gen types typescript > types/supabase.ts` after Phase 14 migration is applied — verify `domain_extension_checks` and `tld_extensions` types are present
- [ ] T023 Verify all source files pass `npx tsc --noEmit` with zero errors
- [ ] T024 Verify engine works in both environments — test `checkAllExtensionsForRoot` in browser (Next.js dev server) and Node.js (API route or script)
- [ ] T025 Verify no dead code, unused imports, or hardcoded values in `lib/tld-checker/` and `lib/supabase/queries/` files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **US2 (Phase 3)**: Depends on Foundational (Phase 2) + Phase 15 refactor
- **US3 (Phase 4)**: Depends on Foundational (Phase 2) + Phase 14 data model
- **US1 (Phase 5)**: Depends on US2 (Phase 3) + US3 (Phase 4) — integrates both
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US2 (P1)**: Engine — depends on Foundational + shared DNS engine (Phase 15). No dependency on US3.
- **US3 (P2)**: Persistence — depends on Foundational + DB tables (Phase 14). No dependency on US2.
- **US1 (P1)**: Integration — depends on both US2 and US3. Combines engine output with persistence.

### Within Each Phase

- Types before functions
- Functions before integration
- Integration before verification
- Each phase has a verify task (last in phase)

### Parallel Opportunities

- **Phase 1**: T002 + T003 can run in parallel (types.ts, placeholder files — different files)
- **Phase 4 (US3)**: T012 + T013 + T014 + T015 can run in parallel (all different query files)
- **Phase 6**: T022 + T023 + T024 can run partially in parallel

---

## Parallel Example: User Story 3

```bash
# Launch all query functions in parallel:
Task: "Implement upsertExtensionCheck() in lib/supabase/queries/extension-checks.ts"
Task: "Implement recomputeReservedCount() in lib/supabase/queries/extension-checks.ts"
Task: "Implement fetchExtensionChecks() in lib/supabase/queries/extension-checks.ts"
Task: "Implement fetchActiveTlds() in lib/supabase/queries/tld-extensions.ts"

# Then sequentially:
Task: "Implement persistResults() in lib/tld-checker/persistResults.ts"
Task: "Handle edge case for NULL reserved_tlds_count"
Task: "Verify persistence"
```

---

## Implementation Strategy

### MVP First (User Story 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US2 (engine)
4. **STOP and VALIDATE**: Call `checkAllExtensionsForRoot` with real TLDs — verify correct flags
5. Engine is usable immediately — can be imported by any consumer

### Incremental Delivery

1. Setup + Foundational → Utilities ready
2. Add US2 → Reusable engine works → **MVP!**
3. Add US3 → Persistence works → data flows to database
4. Add US1 → Full pipeline → end-to-end domain checking
5. Polish → Type generation, verification, cleanup

### Single Developer Path

Follow phases sequentially (1 → 2 → 3 → 4 → 5 → 6). Phase 3 (US2) and Phase 4 (US3) have no cross-dependencies beyond Foundational — they can be worked in either order if both Phase 14 and Phase 15 prerequisites are met.

---

## Notes

- [P] tasks = different files, no dependencies between them
- [US*] label maps task to specific user story for traceability
- Phase 14 (database tables) and Phase 15 (shared DNS engine refactor) are assumed complete — this phase does NOT create migrations or refactor `lib/dns/`
- Run `npx tsc --noEmit` after each phase; fix errors before proceeding
- The engine must work in both browser and server — test in both environments
- No UI components in this phase — all work is in `lib/` modules
