# Tasks: TLD Domain Columns & Sync UI

**Input**: Design documents from `/specs/016-tld-domain-columns/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup

**Purpose**: Confirm prerequisites and existing component availability

- [ ] T001 Verify `TldSyncButton` exists in `components/domains/TldSyncButton.tsx` and `useJobProgress` hook exists in `lib/hooks/useJobProgress.ts`
- [ ] T002 Verify API routes exist and are functional — `POST /api/tld-checker/jobs`, `GET /api/tld-checker/jobs/:id`, `POST /api/tld-checker/domains/:id/refresh`, `GET /api/tld-checker/domains/:id/extensions`

---

## Phase 2: Foundational — TldCell Component (Supports US1 + US2)

**Purpose**: Build the per-row cell component that both the table and card use

**⚠️ CRITICAL**: No table/card integration until this is complete

- [ ] T003 Create `TldCell.tsx` in `components/domains/TldCell.tsx` — component with three states: idle (RefreshCw icon button), loading (animate-spin spinner), data (count badge with ChevronDown). Accept `domainId` and `reservedTldsCount` props.
- [ ] T004 [US1] Add idle state rendering — if `reservedTldsCount` is NULL or 0 and no refresh in progress, render a small icon button with `RefreshCw`
- [ ] T005 [US2] Add refresh handler — on click of idle icon, call `POST /api/tld-checker/domains/{domainId}/refresh`, transition to loading state, show spinner. On success with count > 0, transition to data state. On success with count = 0, transition back to idle. On error, transition back to idle.
- [ ] T006 [US1] Add data state rendering — if `reservedTldsCount > 0`, render a clickable badge showing the count with a `ChevronDown` icon. Badge uses `bg-accent-warning/10 border-accent-warning text-accent-warning` styling matching existing domain badges.

**Checkpoint**: TldCell works standalone — icon/spinner/badge transitions per domain row

---

## Phase 3: User Story 1+2 — Table Column & Dropdown (Priority: P1) 🎯 MVP

**Goal**: "TLDs Reserved" column appears in domains table. Count badge expands to dropdown listing reserved TLDs. Refresh button triggers single-domain check.

**Independent Test**: Load domains table — verify column visible. Click refresh icon on NULL-count domain — verify spinner → badge. Click count badge → verify dropdown opens with reserved TLDs, each linking to the domain.

### Implementation

- [ ] T007 [P] [US1] Create `TldDropdown.tsx` in `components/domains/TldDropdown.tsx` — Popover component that fetches `GET /api/tld-checker/domains/{id}/extensions` on open, shows skeleton rows while loading, renders TLD list with live/dead indicators, each row links to `https://{word}.{tld}` in new tab. Handle empty state ("No reserved TLDs") and error state.
- [ ] T008 [US1] Wire TldDropdown into TldCell — on data state badge click, open TldDropdown via Popover. Pass `domainId` and `reservedTldsCount`. Dropdown fetches data lazily on open.
- [ ] T009 [US1] Integrate TldCell into DomainTable in `components/domains/domain-table.tsx` — add "TLDs Reserved" column header (before Actions), render `<TldCell>` per row using `domain.reserved_tlds_count`. Use existing column width pattern (`w-[100px]`).
- [ ] T010 [US1] Integrate TldCell into DomainCard in `components/domains/domain-card.tsx` — add inline TldCell next to domain name in card header, using same component
- [ ] T011 [US1] Add dropdown row rendering — each TLD row shows: extension (`.io`), live/not-live indicator (green dot for `isLive`, grey for not), clickable → opens `https://{word}.{tld}` in new tab
- [ ] T012 [US1] Verify — table renders with column, NULL-count domains show refresh icon, >0-count domains show badge, clicking badge opens dropdown with correct TLDs, mobile card shows inline TLD status

**Checkpoint**: US1+US2 functional — column visible, refresh works, dropdown works on both desktop and mobile

---

## Phase 4: User Story 3 — Sync Scope Modal (Priority: P2)

**Goal**: "Sync TLDs" button with scope selection modal. User picks "All domains" or "Current page", confirms, watches progress.

**Independent Test**: Click "Sync TLDs" → modal opens with scope options. Select "Current page", confirm. Verify TldSyncButton shows progress, completes, shows summary. Table row counts update.

### Implementation

- [ ] T013 [P] [US3] Create `TldSyncModal.tsx` in `components/domains/TldSyncModal.tsx` — Dialog component with two scope options: "All domains" (label: "{total} domains") and "Current page" (label: "{pageCount} domains"). Confirm button closes modal and triggers sync. Accept `totalDomains` and `currentPageDomainIds` props.
- [ ] T014 [US3] Wire TldSyncModal to TldSyncButton — on confirm, set job scope to "all" or "page" with resolved domain IDs. Pass to TldSyncButton which handles progress, completion, and error states.
- [ ] T015 [US3] Place "Sync TLDs" button trigger in domains page — add near existing table controls (e.g., near pagination). Opens TldSyncModal on click.
- [ ] T016 [US3] Verify — modal opens with correct domain counts, selecting "Current page" fires job with correct domain IDs, progress bar advances, completion notification appears
- [ ] T017 [US3] Handle edge case — if "Current page" has 0 domains (empty page), show "No domains on this page" and disable confirm

**Checkpoint**: US3 functional — sync button with scope selection works end-to-end

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final verification

- [ ] T018 Verify responsive layout — desktop: column visible without horizontal scroll. Mobile (<768px): TldCell visible in card layout. Tablet (768-1024px): horizontal-scrollable table with column included.
- [ ] T019 Ensure all new components use theme CSS variables (no hardcoded emerald/amber/zinc colors)
- [ ] T020 Verify `npx tsc --noEmit` passes with zero errors
- [ ] T021 Final cleanup — remove any debug logs, unused imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Verifies prerequisites — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all UI integration
- **US1+US2 (Phase 3)**: Depends on Foundational (TldCell complete)
- **US3 (Phase 4)**: Depends on US1+US2 (table must have column before sync button placement)
- **Polish (Phase 5)**: Depends on all phases

### Within-Phase Dependencies

- Phase 3: T007 (TldDropdown) can run in parallel with T009 (table integration) — different files
- T008 wires dropdown into cell — must follow T007
- T009 and T010 (table + card) can be done in either order

### Parallel Opportunities

- **Phase 3**: T007 (TldDropdown) + T009 (table integration) can run in parallel
- **Phase 4**: T013 (modal) can start while Phase 3 wraps up — different files, no dependency on table integration details

---

## Implementation Strategy

### MVP First (Phase 1–3, tasks T001–T012)

1. Verify prerequisites (T001–T002)
2. Build TldCell with all states (T003–T006)
3. Add TldDropdown + integrate into table and card (T007–T012)
4. **STOP and VALIDATE**: Column visible, refresh works, dropdown works

### Incremental Delivery

1. Setup + Foundational → TldCell component ready
2. Add US1+US2 → Table column + dropdown → **MVP!**
3. Add US3 → Sync modal with scope → full feature
4. Add Polish → Verified on all breakpoints → production-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [US*] label maps task to user story
- Existing `TldSyncButton` from Phase 17-18 handles progress/error states — Phase 4 only adds scope selection
- `DomainRow` type may not yet include `reserved_tlds_count` — cast or extend type locally
- API routes from Phase 18 are assumed functional
- Run `npx tsc --noEmit` after each phase
