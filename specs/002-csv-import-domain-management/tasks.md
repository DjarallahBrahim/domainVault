# Tasks: Phase 2 — CSV Import & Domain Management

**Input**: Design documents from `/specs/002-csv-import-domain-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per spec — no automated test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: Next.js App Router at repository root
- `lib/` — shared utilities, queries, validations
- `components/` — React components (by feature)
- `app/(dashboard)/` — route pages

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new Phase 2 dependencies and add shadcn/ui primitives

- [ ] T001 Install new npm dependencies: `@tanstack/react-query@5 @tanstack/react-query-devtools@5 papaparse@5 sonner@1` and dev types: `@types/papaparse@5`
- [ ] T002 [P] Add shadcn/ui Table component via `npx shadcn@latest add table` → `components/ui/table.tsx`
- [ ] T003 [P] Add shadcn/ui Dialog component via `npx shadcn@latest add dialog` → `components/ui/dialog.tsx`
- [ ] T004 [P] Add shadcn/ui Select component via `npx shadcn@latest add select` → `components/ui/select.tsx`
- [ ] T005 [P] Add shadcn/ui Badge component via `npx shadcn@latest add badge` → `components/ui/badge.tsx`
- [ ] T006 [P] Add shadcn/ui Sonner component via `npx shadcn@latest add sonner` → `components/ui/sonner.tsx`
- [ ] T007 [P] Add shadcn/ui Skeleton component via `npx shadcn@latest add skeleton` → `components/ui/skeleton.tsx`
- [ ] T008 [P] Create feature component directories: `components/domains/`, `components/import/`, `components/history/`
- [ ] T009 [P] Create typed queries directory: `lib/supabase/queries/`

**Checkpoint**: Dependencies installed, all shadcn/ui primitives available, project directories created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 [P] Create centralized TanStack Query keys in `lib/query-keys.ts` — define query keys for domains (all, list, detail) and importLogs (all, list, detail) per research.md §2
- [ ] T011 [P] Create Zod validation schemas in `lib/validations/domain.ts` — export `csvRowSchema`, `domainEditSchema`, `domainFiltersSchema` per data-model.md
- [ ] T012 Create typed domain CRUD helpers in `lib/supabase/queries/domains.ts` — export: `fetchDomains(filters)`, `fetchDomain(id)`, `upsertDomains(rows, mode)`, `deleteDomain(id)`, `deleteDomains(ids)`, `checkExistingDomains(normalizedNames)` (depends on T010)
- [ ] T013 [P] Create typed import log read helpers in `lib/supabase/queries/import-logs.ts` — export: `fetchImportLogs()`, `fetchImportLogDetail(id)`, `createImportLog(data)` (depends on T010)
- [ ] T014 Wrap root layout with TanStack Query provider: add `<QueryClientProvider>` in `app/layout.tsx` using a client component `components/providers/query-provider.tsx`
- [ ] T015 Add Sonner `<Toaster />` to root layout in `app/layout.tsx` for toast notifications

**Checkpoint**: Foundation ready — query keys, validation schemas, typed helpers, and providers all functional; user story implementation can now begin

---

## Phase 3: User Story 1 — Bulk CSV Import (Priority: P1) 🎯 MVP

**Goal**: Users can upload CSV files, parse them with PapaParse, validate rows with Zod, batch-upsert to Supabase with case-insensitive duplicate detection, and see an import summary. Duplicate handling mode (skip vs update) is user-selectable per import.

**Independent Test**: Upload a CSV file with 50 domain entries (mix of valid, invalid, and duplicate rows) using both modes, verify import summary matches expectations, confirm domains appear on domain list page.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create import mode toggle in `components/import/csv-option-toggle.tsx` — radio/switch for "Skip existing domains" (default) vs "Update existing with new data"
- [ ] T017 [P] [US1] Create file upload zone in `components/import/csv-uploader.tsx` — drag-and-drop area + file input; validate file type (.csv) and size (≤10 MB) before proceeding; strip UTF-8 BOM if present
- [ ] T018 [P] [US1] Create progress indicator in `components/import/csv-progress.tsx` — show parsing progress ("Parsing..."), DB import progress bar + row counter ("Importing row X of Y"), and completion state
- [ ] T019 [P] [US1] Create import summary card in `components/import/csv-summary.tsx` — display counts (imported, skipped, errors) after import; list per-row errors with row number, column, and message
- [ ] T020 [US1] Implement CSV import page in `app/(dashboard)/import/page.tsx` — wire together option toggle, uploader, progress, and summary; integrate PapaParse for client-side CSV parsing with `header: true`, `skipEmptyLines: true`, `transformHeader` trimming; run Zod `csvRowSchema` validation per row; normalize domain names for case-insensitive dedup (`trim().toLowerCase()`); query existing domains via `checkExistingDomains()`; switch between skip (filter out matches from batch) and update (keep matches with `onConflict`) modes; call `upsertDomains()` batch; create import log via `createImportLog()`; show toast on success/error

**Checkpoint**: CSV import fully functional — users can upload, parse, validate, import domains, and see results

---

## Phase 4: User Story 2 — Domain List & Filtering (Priority: P1) 🎯 MVP

**Goal**: Users see a paginated, sortable, filterable domain list. Search is case-insensitive substring match. Table adapts to mobile with card layout. The list updates after import, edit, or delete via TanStack Query cache invalidation.

**Independent Test**: Import 60+ domains with varied statuses/TLDs, apply each filter/sort combination, verify pagination works, confirm list reflects changes after domain operations.

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create status badge in `components/domains/domain-status-badge.tsx` — renders Badge with color mapping: active = accent-success, expired = accent-danger, sold = accent-primary, pending = accent-warning
- [ ] T022 [P] [US2] Create expiry badge in `components/domains/domain-expiry-badge.tsx` — calculates days until expiration; renders Badge with constitution color mapping: ≤30 days = danger, 31-90 = warning, 91-180 = caution, >180 = success
- [ ] T023 [P] [US2] Create search + filter bar in `components/domains/domain-search.tsx` — search input (case-insensitive, debounced), status filter dropdown, TLD filter dropdown; read/write filters to URL search params
- [ ] T024 [P] [US2] Create empty state in `components/domains/domain-empty-state.tsx` — message directing users to Import page with a CTA link when no domains exist
- [ ] T025 [US2] Create desktop domain table in `components/domains/domain-table.tsx` — uses shadcn/ui Table; columns: domain name, TLD, expiration date + expiry badge, purchase price, status badge, actions (view, delete); supports sort (domain/expiration/status asc/desc), pagination (50/page with page controls), and row selection (checkboxes for bulk delete) (depends on T021, T022)
- [ ] T026 [P] [US2] Create mobile domain cards in `components/domains/domain-card.tsx` — stacked card layout for viewports <480px; each card shows same info as table row in compact vertical format (depends on T021, T022)
- [ ] T027 [US2] Implement domain list page in `app/(dashboard)/domains/page.tsx` — server component fetches initial page via `createServerClient` and `fetchDomains()`; wraps content in `HydrationBoundary` for TanStack Query hydration; client component inside renders `domain-table` (≥480px), `domain-card` (<480px), `domain-search`, and `domain-empty-state`; uses `useQuery` with filters from URL search params; responsive per constitution: card layout <480px, horizontal-scroll table 480-767px, full table ≥768px

**Checkpoint**: Domain list fully functional — users can browse, search, filter, sort, and paginate their portfolio

---

## Phase 5: User Story 3 — Domain Detail & Edit (Priority: P2)

**Goal**: Users click a domain to see its full details on a dedicated page. They can edit mutable fields (status, registrar, purchase price, notes, tags) with inline Zod validation. Domain name and TLD are read-only. Changes save optimistically and reflect in list.

**Independent Test**: Navigate to a domain detail page, edit each mutable field, save, return to list, verify changes persist.

### Implementation for User Story 3

- [ ] T028 [US3] Create domain edit form in `components/domains/domain-detail-form.tsx` — uses React Hook Form with `domainEditSchema` Zod resolver; field layout: domain name (read-only Input), TLD (read-only Input), status (Select), registrar (Input), purchase_price (Input/number), notes (Textarea), tags (Input with comma-to-array transformation); save button triggers optimistic `useMutation` via `updateDomain()` in queries helper; displays inline validation errors from Zod; success toast on save
- [ ] T029 [US3] Implement domain detail page in `app/(dashboard)/domains/[id]/page.tsx` — server component fetches domain by ID via `createServerClient` and `fetchDomain(id)`; wraps in `HydrationBoundary`; renders `domain-detail-form.tsx` as client component with domain data prefilled; includes back navigation to domain list; delete action available (wired in US4)

**Checkpoint**: Domain detail and edit fully functional — users can view and update domain records

---

## Phase 6: User Story 4 — Domain Deletion (Priority: P2)

**Goal**: Users can delete individual domains or bulk-delete multiple domains with a confirmation dialog. Deletions are optimistically removed from the list. Sales records are preserved (ON DELETE SET NULL).

**Independent Test**: Select one or multiple domains, confirm deletion, verify they no longer appear in list.

### Implementation for User Story 4

- [ ] T030 [P] [US4] Create delete confirmation dialog in `components/domains/domain-delete-dialog.tsx` — uses shadcn/ui Dialog (AlertDialog variant); shows domain count (e.g., "Delete 3 domains?"); Cancel and Confirm buttons; triggers delete on confirm
- [ ] T031 [US4] Add single delete action to `components/domains/domain-table.tsx` — delete button per row opens `domain-delete-dialog`; on confirm, calls `deleteDomain(id)` with optimistic cache removal via TanStack Query `useMutation`; success toast (depends on T030, T025)
- [ ] T032 [US4] Add bulk delete to `components/domains/domain-table.tsx` — "Delete selected" button visible when checkboxes selected; opens `domain-delete-dialog` with count of selected; on confirm, calls `deleteDomains([...ids])` with optimistic batch removal; max 50 selection; success toast (depends on T030, T025)
- [ ] T033 [US4] Add delete action to domain detail page in `app/(dashboard)/domains/[id]/page.tsx` — delete button opens `domain-delete-dialog`; on confirm, calls `deleteDomain(id)`, navigates back to domain list, success toast (depends on T030, T029)

**Checkpoint**: Domain deletion fully functional — users can safely delete individual or multiple domains with confirmation

---

## Phase 7: User Story 5 — Import Log History (Priority: P3)

**Goal**: Users can review past import attempts with filenames, dates, and outcome summaries. They can expand a log to see detailed per-row error information, helping them correct CSV files for re-import.

**Independent Test**: Perform 3 imports (some with errors), view import history list, expand error details for a failed import, verify accuracy.

### Implementation for User Story 5

- [ ] T034 [P] [US5] Create expandable error detail panel in `components/history/import-log-detail.tsx` — renders list from `errors` JSONB: row number, column name, error message for each error entry; collapsible/expandable per import log
- [ ] T035 [US5] Create import log list in `components/history/import-log-list.tsx` — uses shadcn/ui Table; columns: filename, date (created_at formatted), total_rows, imported, skipped, expand button; fetches via `useQuery` with `fetchImportLogs()`; click expand toggles `import-log-detail` panel (depends on T034)
- [ ] T036 [US5] Implement import log history page in `app/(dashboard)/import/history/page.tsx` — renders `import-log-list.tsx`; shows empty state if no import logs exist ("No imports yet — upload a CSV to get started"); includes link back to Import page

**Checkpoint**: Import log history fully functional — users can audit past imports and debug errors

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality verification

- [ ] T037 [P] Add skeleton loaders to `components/domains/domain-table.tsx` — show Skeleton rows while data fetches (use shadcn/ui Skeleton with matching column widths)
- [ ] T038 [P] Add skeleton loader to `components/domains/domain-detail-form.tsx` — show Skeleton form fields while domain data loads
- [ ] T039 [P] Add skeleton loader to `components/history/import-log-list.tsx` — show Skeleton rows while import logs fetch
- [ ] T040 Verify all domain table responsive breakpoints per constitution: card layout <480px, horizontal-scroll 480-767px, full table ≥768px — test at 375px, 480px, 768px, 1024px, 1920px
- [ ] T041 Run TypeScript strict check: `npx tsc --noEmit` — ensure zero errors
- [ ] T042 Run ESLint + Prettier: `npx eslint . && npx prettier --check .` — ensure zero warnings
- [ ] T043 Run production build: `npm run build` — ensure clean Vercel build
- [ ] T044 Run quickstart.md verification checklist — confirm all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — can start immediately after
- **User Story 2 (Phase 4)**: Depends on Foundational — can start in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational — can start in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US2 (modifies domain-table.tsx, needs domain detail page)
- **User Story 5 (Phase 7)**: Depends on Foundational — can start in parallel with US1-US3
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US3 (P2)**: Can start after Phase 2 — no dependencies on other stories (needs US1 for populated data for testing)
- **US4 (P2)**: Depends on US2 (domain-table.tsx) and US3 (detail page) for integrating delete actions
- **US5 (P3)**: Can start after Phase 2 — no dependencies on other stories (needs US1 imports for log data)

### Within Each User Story

- [P] tasks (different files) can run in parallel
- Components before page assembly
- Page assembly last (wires all components together)

---

## Parallel Opportunities

- **Phase 1**: All T002-T009 tasks are [P] — can run in parallel after T001
- **Phase 2**: T010-T013 can run in parallel; T014-T015 after providers created
- **US1**: T016-T019 are [P] — can run in parallel; T020 last
- **US2**: T021-T024 are [P] — can run in parallel; T025-T026 after T021-T022; T027 last
- **US3**: T028 can start immediately after Phase 2; T029 after T028
- **US4**: T030 can start immediately after Phase 2; T031-T033 after US2/US3
- **US5**: T034 can start immediately after Phase 2; T035 after T034; T036 last
- **US1, US2, US3, US5**: All can begin in parallel once Phase 2 complete
- **Polish**: T037-T039 are [P] — can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 components in parallel:
Task: "Create import mode toggle in components/import/csv-option-toggle.tsx"
Task: "Create file upload zone in components/import/csv-uploader.tsx"
Task: "Create progress indicator in components/import/csv-progress.tsx"
Task: "Create import summary card in components/import/csv-summary.tsx"

# Then assemble page:
Task: "Implement CSV import page in app/(dashboard)/import/page.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch all US2 independent components in parallel:
Task: "Create status badge in components/domains/domain-status-badge.tsx"
Task: "Create expiry badge in components/domains/domain-expiry-badge.tsx"
Task: "Create search + filter bar in components/domains/domain-search.tsx"
Task: "Create empty state in components/domains/domain-empty-state.tsx"

# Then build table and cards:
Task: "Create desktop domain table in components/domains/domain-table.tsx"
Task: "Create mobile domain cards in components/domains/domain-card.tsx"

# Then assemble page:
Task: "Implement domain list page in app/(dashboard)/domains/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (CSV Import)
4. Complete Phase 4: User Story 2 (Domain List)
5. **STOP and VALIDATE**: Import a CSV → verify domains appear in list → search/filter/sort work
6. Deploy/demo MVP — portfolio data is now in the system and browsable

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Import) + US2 (List) → Test independently → **MVP Deploy**
3. US3 (Edit) + US4 (Delete) → Test independently → **Full CRUD Deploy**
4. US5 (Import History) → Test independently → **Complete Phase 2 Deploy**
5. Polish → Final verification → **Release**

### Parallel Team Strategy (2 developers)

With 2 developers after Phase 2:

- **Dev A**: US1 (CSV Import) → US3 (Detail/Edit)
- **Dev B**: US2 (Domain List) → US5 (Import History)
- Both merge, then together on US4 (Delete — touches both list and detail) → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are manual E2E only — no automated test tasks in this phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 44 tasks across 8 phases
- MVP scope (US1 + US2): 23 tasks through Phase 4
