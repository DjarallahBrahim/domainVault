# Tasks: Phase 2 Refresh — Manual Domain Entry

**Input**: Design documents from `/specs/005-phase-2-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per quickstart.md — no automated test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Components**: `components/domains/`
- **Queries**: `lib/supabase/queries/domains-client.ts` (browser client)
- **Validations**: `lib/validations/domain.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new dependencies or directory creation needed. All required libraries
(shadcn/ui Dialog, React Hook Form, Zod, TanStack Query, Supabase client) are already
installed from Phase 2.

*This is a refresh/add-on to an already-operational Phase 2. No setup tasks required.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and query function that MUST exist before UI components can be built.

**⚠️ CRITICAL**: No UI work can begin until this phase is complete.

- [x] T001 [P] Add `manualEntrySchema` Zod schema to `lib/validations/domain.ts` — define schema with fields: domain (string, required, dot required, no spaces, ≤253 chars), expiration_date (string, required, valid ISO date via Date.parse), purchase_price (coerce number, optional, min 0), registrar (string, optional, nullable), notes (string, optional, nullable), tags (string, optional, nullable); export inferred type `ManualEntryInput`
- [x] T002 [P] Add `insertSingleDomain()` function to `lib/supabase/queries/domains-client.ts` — accept `ManualEntryInput` + `user_id`; first check for existing domain via `.ilike("domain", domainName)` case-insensitive duplicate detection; if duplicate found, throw error "Domain already exists in your portfolio"; otherwise `.insert()` a single row with status "active" and `created_at` default; return the inserted domain row; use browser Supabase client (`createClient`)

**Checkpoint**: Schema validates inputs; `insertSingleDomain` inserts and detects duplicates. Ready for UI components.

---

## Phase 3: User Story 1 — Manual Domain Entry (Priority: P1) 🎯 MVP

**Goal**: Users click "Add Domain", fill in a modal dialog form with domain name,
expiration date, and optional fields, submit, and the domain appears in the list.
Validation mirrors CSV import rules. Duplicate detection is case-insensitive.

**Independent Test**: Open dialog, fill valid domain → domain appears in list.
Fill invalid domain (no dot) → inline error. Fill duplicate domain → duplicate error.
Close dialog without saving → no domain created.

### Implementation for User Story 1

- [x] T003 [US1] Create `components/domains/domain-add-dialog.tsx` — client component using shadcn/ui `<Dialog>` for modal overlay; form built with React Hook Form + Zod `manualEntrySchema` resolver; fields: domain (Input), expiration_date (Input type="date", max today), purchase_price (Input type="number", step 0.01), registrar (Input), notes (Input), tags (Input placeholder="premium, brandable"); onSubmit: call `insertSingleDomain()` with `useMutation`, on success toast "Domain added" and close dialog + invalidate `queryKeys.domains.list()` for cache refresh; on duplicate error show inline "Domain already exists in your portfolio"; form Reset on dialog open; Zod errors shown inline per field; Escape key and outside click close dialog without saving (depends on T001, T002)

**Checkpoint**: Modal dialog works — users create domains via manual entry form with full validation.

---

## Phase 4: User Story 2 — Domain List Integration (Priority: P1)

**Goal**: "Add Domain" button visible on domains page. Empty state offers both import
and manual entry CTAs. Dialog wired to button. Existing functionality unchanged.

**Independent Test**: Domains page with domains → "Add Domain" button visible, opens
dialog. Domains page with zero domains → empty state shows both import and manual entry.
After adding domain via dialog → list updates immediately.

### Implementation for User Story 2

- [x] T004 [US2] Update `components/domains/domain-list-client.tsx` — import `DomainAddDialog`; add `showAddDialog` boolean state; render "Add Domain" button (variant="outline" with Plus icon from lucide-react) near the search/filter bar, visible when domains.length > 0 or when empty state is not shown; button onClick sets `showAddDialog = true`; render `<DomainAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} />` below the domain table/cards; dialog close triggers cache refresh (depends on T003)
- [x] T005 [US2] Update `components/domains/domain-empty-state.tsx` — add a second CTA card/button alongside the existing "Import CSV" option: "Add your first domain" with a Plus icon; clicking triggers the same dialog (accept `onAddDomain` prop from parent `domain-list-client.tsx`)

**Checkpoint**: "Add Domain" button functional. Empty state offers both options. Dialog integrated into list page.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, linting, and manual E2E testing.

- [x] T006 Run build verification: `npm run typecheck && npm run lint && npm run build` — fix any errors; ensure zero TypeScript errors, zero ESLint warnings, clean Vercel build
- [x] T007 Run quickstart.md verification checklist — confirm all 7 sections pass: button visibility, dialog open/close, form validation, successful entry, duplicate detection, no regressions (CSV import, list, edit, delete, import history, dashboard, sales), build & lint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — no new dependencies needed
- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on Foundational (needs schema + insert function)
- **US2 (Phase 4)**: Depends on US1 (needs `domain-add-dialog.tsx`)
- **Polish (Phase 5)**: Depends on US1 + US2 complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs `domain-add-dialog.tsx` to exist)

### Within Each Phase

- Phase 2: T001 and T002 are [P] — can run in parallel (different files)
- Phase 3: T003 is the only task
- Phase 4: T004 and T005 can run in parallel
- Phase 5: T006 must complete before T007 (build must pass before manual testing)

---

## Parallel Opportunities

```bash
# Phase 2: Launch both foundational tasks in parallel
Task: "Add manualEntrySchema Zod schema in lib/validations/domain.ts"
Task: "Add insertSingleDomain() function in lib/supabase/queries/domains-client.ts"

# Phase 4: Launch both integration tasks in parallel
Task: "Update domain-list-client.tsx — Add 'Add Domain' button + wire dialog"
Task: "Update domain-empty-state.tsx — Add manual entry CTA"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — Both P1)

1. Complete Phase 2: Foundational (T001 + T002 in parallel)
2. Complete Phase 3: US1 — Manual Domain Entry Dialog (T003)
3. Complete Phase 4: US2 — List Integration (T004 + T005 in parallel)
4. **STOP and VALIDATE**: Open dialog → add domain → appears in list → check empty state
5. Deploy/demo — manual entry is fully functional

### Incremental Delivery

1. Foundational → Schema + query ready
2. US1 (Dialog) → Test independently → **MVP: dialog works standalone**
3. US2 (Integration) → Test independently → **Full feature: button + empty state + dialog**
4. Polish → Build + manual E2E verification → **Release**

### Single Developer Strategy

Execute sequentially: Phase 2 (parallel T001+T002) → Phase 3 (T003) → Phase 4 (parallel T004+T005) → Phase 5 (T006 → T007). Total: 7 tasks, ~1-2 hours.

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All 25 existing Phase 2 features are [DONE] and MUST NOT be modified beyond the 2 files in Phase 4
- No new npm packages, no new database migrations, no new route pages
- All existing patterns followed: browser client for mutations, RHF + Zod for forms, shadcn/ui Dialog for modals, TanStack Query for cache invalidation
- Commit after each phase
- Run `npm run typecheck && npm run lint` after each phase that introduces new code
