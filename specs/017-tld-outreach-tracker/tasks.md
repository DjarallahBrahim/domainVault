# Tasks: Promoting (TLD Outreach Tracker)

**Input**: Design documents from `/specs/017-tld-outreach-tracker/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated test suite is requested by this feature spec — verification is manual via the quickstart.md checklist plus `npx tsc --noEmit` (project standard). No test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js App Router project at repository root. Feature code lives under `components/promoting/`, `lib/hooks/`, `lib/supabase/queries/`, `types/`, and `app/(dashboard)/`. Migration lives under `supabase/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the environment the feature will be built in — the project already exists, so no scaffolding is required.

- [x] T001 Confirm feature branch `017-tld-outreach-tracker` is checked out with a clean working tree (`git status`)
- [x] T002 [P] Confirm Supabase migration tooling and types-generation workflow (`supabase/migrations/` numbering, `supabase gen types typescript > types/supabase.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data layer + shared types that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create Migration 009 in `supabase/migrations/009_tld_outreach.sql` (tld_outreach table, indexes, RLS policy per contracts/components.md)
- [x] T004 Apply migration and regenerate types via `supabase gen types typescript > types/supabase.ts` so `tld_outreach` is reflected in `types/supabase.ts`
- [x] T005 [P] Create `types/promoting.ts` (PromotingDomainOption, ReservedTld, ReplyStatus, OutreachRow per contracts/components.md)
- [x] T006 [P] Add `promoting` query-key namespace to `lib/query-keys.ts` (domains, reservedTlds, outreach per data-model.md)
- [x] T007 Create `lib/supabase/queries/outreach-client.ts` — typed browser-client helpers `upsertOutreachRow` and `fetchOutreachRows` (upsert keyed on `domain_id,tld`, RLS-scoped)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Select a Domain to Promote (Priority: P1) 🎯 MVP

**Goal**: A searchable domain picker that drives the whole page, plus the `/promoting` route, navigation entry, and `?domain=` deep-link.

**Why first**: Both P1 stories are required for an MVP, but the page is domain-scoped — nothing renders until a domain is selected. The picker is the gate every other story hangs off.

**Independent Test**: Open `/promoting`, search and select a domain → URL updates to `?domain=<id>`. Reload → same domain pre-selected. With an empty portfolio → "No domains yet — add one from Import" placeholder.

### Implementation for User Story 2

- [x] T008 [US2] Create `usePromotingDomains` hook in `lib/hooks/usePromotingDomains.ts` (TanStack Query key `['promoting','domains']`, selects id/domain/reserved_tlds_count/tlds_last_checked_at via `lib/supabase/queries/domains-client.ts` browser client)
- [x] T009 [P] [US2] Create `DomainPicker` component in `components/promoting/DomainPicker.tsx` (shadcn Command + Popover, JetBrains Mono domain names, reserved-count badge / "not checked" per option)
- [x] T010 [P] [US2] Create `PromotingPage` shell in `components/promoting/PromotingPage.tsx` (client component owning `selectedDomainId`; reads `?domain=` on mount, `router.replace` on change; renders picker + prompt when nothing selected; empty-portfolio placeholder)
- [x] T011 [P] [US2] Create route `app/(dashboard)/promoting/page.tsx` rendering `PromotingPage`
- [x] T012 [P] [US2] Add Promoting to navigation in `app/(dashboard)/layout.tsx` (sidebar desktop + bottom tab bar mobile, `Megaphone` lucide icon, active-route highlight)

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 4: User Story 1 - Track Outreach for Reserved TLDs (Priority: P1)

**Goal**: The reserved-TLD table with a Contacted checkbox per row, live-dot TLD links, optimistic persistence, and mobile stacked-card layout.

**Why this priority**: The entire value of the feature. After the picker, this is the core tracking workflow.

**Independent Test**: Select a domain with reserved TLD data → table lists every reserved variant (desktop) / stacked cards (mobile). Check Contacted, reload → persists. TLD link opens in a new tab; live dot reflects DNS state.

### Implementation for User Story 1

- [x] T013 [US1] Create `useReservedTlds` hook in `lib/hooks/useReservedTlds.ts` (key `['promoting','reserved-tlds',domainId]`; calls existing `GET /api/tld-checker/domains/:domainId/extensions`; exposes `{ tlds, isLoading, isEmpty, neverChecked }`)
- [x] T014 [P] [US1] Create `useTldOutreach` hook in `lib/hooks/useTldOutreach.ts` (key `['promoting','outreach',domainId]`; returns `Map<tld, OutreachRow>` with `{ contacted:false, reply_status:'pending' }` defaults; `toggleContacted` + `setReplyStatus` mutations)
- [x] T015 [P] [US1] Create `ReservedTldTable` in `components/promoting/ReservedTldTable.tsx` (desktop `<Table>`; TLD link with isLive dot, Contacted checkbox, placeholder Reply slot; 5 skeleton rows; sort by TLD)
- [x] T016 [P] [US1] Create `ReservedTldCardRow` in `components/promoting/ReservedTldCardRow.tsx` (mobile <md stacked cards, same data + callbacks)
- [x] T017 [US1] Integrate table/cards into `PromotingPage` — merge `useReservedTlds` + `useTldOutreach` by `tld`, `keepPreviousData` on refetch, sort-by-TLD default, render desktop vs mobile variant by breakpoint
- [x] T018 [US1] Wire Contacted checkbox: optimistic `toggleContacted(tld, next)` via `outreach-client.ts` upsert (sets/clears `contacted_at`), rollback + error toast on failure, hover tooltip with `contacted_at`; invalidate outreach + promoting-domains keys

**Checkpoint**: At this point, User Stories 2 AND 1 should both work independently — picker + core tracking table deliver the MVP

---

## Phase 5: User Story 4 - Choose a Reply Outcome (Priority: P2)

**Goal**: A colored status-pill control (Pending / Positive / Negative) that is disabled until the row is contacted, with optimistic persistence.

**Why this priority**: Completes the tracking record — makes outreach data actionable (warm vs cold targets). P2 because tracking contacts alone is still a usable MVP.

**Independent Test**: Contact a TLD → Reply pill enables → set Positive → pill turns green, persists after reload. Reply control is disabled (with tooltip) for uncontacted TLDs.

### Implementation for User Story 4

- [x] T019 [US4] Create `ReplyStatusSelect` in `components/promoting/ReplyStatusSelect.tsx` (shadcn Select styled as pill: neutral Pending / success-tint Positive / danger-tint Negative; disabled + tooltip "Mark as contacted first" while `contacted === false`)
- [x] T020 [US4] Integrate `ReplyStatusSelect` into the Reply column of `ReservedTldTable` and the card body of `ReservedTldCardRow`
- [x] T021 [US4] Wire reply changes: optimistic `setReplyStatus(tld, status)` via upsert (sets `reply_at` when leaving `'pending'`), rollback + error toast, invalidate keys; add sort-by-Reply (positive first) alongside existing TLD sort

**Checkpoint**: At this point, User Stories 2, 1, AND 4 should all work independently

---

## Phase 6: User Story 3 - See Outreach Summary at a Glance (Priority: P2)

**Goal**: Three KPI-style summary cards (Reserved TLDs / Contacted / Positive Replies) that stay in sync with the table.

**Why this priority**: High-value scanability for portfolio-scale users; uses the established US-013 card visual spec so it is low-risk.

**Independent Test**: Mark one TLD contacted + positive on a domain with several reserved TLDs → cards show correct totals and update instantly without reload.

### Implementation for User Story 3

- [x] T022 [US3] Create `PromotingSummaryCards` in `components/promoting/PromotingSummaryCards.tsx` (US-013 spec: icon, accent stripe, animated counter, hover lift, skeleton; Positive Replies card shows "N negative" danger-tinted subtext)
- [x] T023 [US3] Integrate cards into `PromotingPage` — render only when a domain is selected; derive counts from the merged reserved-TLD/outreach rows (not a separate fetch); re-render live on toggle/reply changes

**Checkpoint**: At this point, User Stories 2, 1, 4, AND 3 should all work independently

---

## Phase 7: User Story 5 - Run a TLD Check from the Promoting Page (Priority: P2)

**Goal**: Empty states (never checked / zero reserved / no TLD list configured) with a one-click action that reuses the existing single-domain refresh — no new DNS logic.

**Why this priority**: Makes the page self-sufficient for new domains; P2 because it only matters when reserved-TLD data is missing.

**Independent Test**: Select a never-checked domain → empty state with "Run TLD Check" → click → spinner → table replaces prompt automatically. Checked-but-zero domain → "Re-check" copy. Empty TLD list → button disabled with tooltip.

### Implementation for User Story 5

- [x] T024 [US5] Create `RunTldCheckPrompt` in `components/promoting/RunTldCheckPrompt.tsx` (3 variants per contracts/components.md; gates button when active TLD list is empty — reuse `fetchActiveTlds` with browser client)
- [x] T025 [US5] Wire run action into `PromotingPage` — call existing `POST /api/tld-checker/domains/:domainId/refresh`, spinner + disabled during call, invalidate `['promoting','reserved-tlds',domainId]` + `['promoting','domains']` on success so the table replaces the prompt

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify the feature spec DoD and master-plan quality bars across all stories

- [x] T026 [P] Responsive pass: verify every new component at 375px (cards + scroll chips), 768–1023px, and 1920px (table) with no horizontal clipping
- [x] T027 [P] Theme pass: dark + light both styled via CSS variables only — no hardcoded colors; WCAG AA contrast on pills, badges, links
- [x] T028 [P] Accessibility pass: keyboard navigation on picker, checkbox, and select; focus states visible; tooltips reachable
- [x] T029 [P] Static checks: `npx tsc --noEmit`, ESLint + Prettier clean, zero `any`, zero unused imports on all new files
- [ ] T030 [P] RLS verification: with two test accounts, confirm neither can read or write the other's `tld_outreach` rows
- [ ] T031 [P] Run the full quickstart.md test checklist end-to-end (build order, state flows, all 11 browser checks)
- [x] T032 [P] Changelog entry + confirm no new third-party network calls were introduced (all reads reuse Phase 18 routes, writes only to `tld_outreach`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US2 (Phase 3, P1)**: Depends on Foundational — no story dependencies (gate for the rest)
- **US1 (Phase 4, P1)**: Depends on Foundational + US2 (page needs a selected domain to render the table)
- **US4 (Phase 5, P2)**: Depends on US1 (ReplyStatusSelect is a column/card element of the tracking table)
- **US3 (Phase 6, P2)**: Depends on US1 (counts derive from the same merged rows) + US2 (renders only when a domain is selected)
- **US5 (Phase 7, P2)**: Depends on US2 (empty state appears in place of the table for the selected domain)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 1 (P1)**: Needs US2's selection plumbing; independently testable once a domain is selected
- **User Story 4 (P2)**: Integrates into US1's table; independently testable once the table exists
- **User Story 3 (P2)**: Derives from US1's merged data; independently testable once the table exists
- **User Story 5 (P2)**: Renders in place of US1's table for the selected domain

### Within Each User Story

- Hooks/data layer before components
- Leaf components (ReplyStatusSelect, DomainPicker, RunTldCheckPrompt) before container integration
- Core implementation before integration into PromotingPage

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (T005, T006)
- Within US2: T009–T012 are [P] — DomainPicker, PromotingPage, route, and nav entry touch different files (T008 hook must land first)
- Within US1: T014–T016 are [P] — both hooks and both layouts are separate files (T013 hook feeds the merge)
- Once US2 is complete, US1 can start; US1's table is a prerequisite for US3/US4

---

## Parallel Example: User Story 2

```bash
# Launch the picker, page shell, route, and nav entry together (after T008 lands):
Task: "Create DomainPicker component in components/promoting/DomainPicker.tsx"
Task: "Create PromotingPage shell in components/promoting/PromotingPage.tsx"
Task: "Create route app/(dashboard)/promoting/page.tsx"
Task: "Add Promoting to navigation in app/(dashboard)/layout.tsx"
```

## Parallel Example: User Story 1

```bash
# Launch both hooks and both layouts together (after T013 lands):
Task: "Create useTldOutreach hook in lib/hooks/useTldOutreach.ts"
Task: "Create ReservedTldTable in components/promoting/ReservedTldTable.tsx"
Task: "Create ReservedTldCardRow in components/promoting/ReservedTldCardRow.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 2 + User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 2 (picker + route + deep-link)
4. Complete Phase 4: User Story 1 (tracking table + Contacted toggle)
5. **STOP and VALIDATE**: picker + table work end-to-end — this is the MVP
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → data layer ready
2. Add US2 → test independently (picker/deep-link) → Demo
3. Add US1 → test independently (tracking table) → Deploy/Demo (**MVP**)
4. Add US4 → test independently (reply pills) → Deploy/Demo
5. Add US3 → test independently (summary cards) → Deploy/Demo
6. Add US5 → test independently (empty states) → Deploy/Demo
7. Polish → quality gates (tsc/lint/theme/responsive/RLS)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US2 (picker + route + nav)
   - Developer B: (after US2 merge) US1 — table + hooks + Contacted toggle
   - Developer C: (after US1 merge) US4 reply pill, then US3 cards
   - Developer D: (after US2 merge) US5 empty states
3. Stories integrate independently through `PromotingPage`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to the spec.md user stories (US1–US5)
- Each user story is independently completable and testable via its Independent Test
- Phase 18 routes (`GET .../extensions`, `POST .../refresh`) are reused — do NOT modify them
- Run `npx tsc --noEmit` after each logical group (project standard)
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently