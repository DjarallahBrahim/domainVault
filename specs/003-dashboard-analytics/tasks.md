# Tasks: Phase 3 — Dashboard & Analytics

**Input**: Design documents from `/specs/003-dashboard-analytics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per spec — no automated test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: Next.js App Router at repository root
- `components/dashboard/` — Dashboard feature components
- `lib/supabase/queries/` — Typed query helpers
- `app/(dashboard)/dashboard/` — Dashboard route page

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Phase 3 dependency

- [x] T001 Install recharts dependency: `npm install recharts@2`

**Checkpoint**: Recharts available for chart components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core dashboard query helpers that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create typed dashboard query helpers in `lib/supabase/queries/dashboard.ts` — export: `autoTransitionExpired()` (UPDATE active→expired for past-due domains), `fetchDashboardData()` (returns all domains + aggregated counts), `fetchDomainsForDashboard()` (selects all user domains with needed columns: id, domain, tld, expiration_date, purchase_price, status)

**Checkpoint**: Dashboard data queries ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Portfolio Overview Dashboard (Priority: P1) 🎯 MVP

**Goal**: Users see a dashboard landing page with summary cards (total, active, expiring soon, portfolio value) and a TLD distribution chart. Skeleton loaders display while data fetches. Empty state shown when no domains exist.

**Independent Test**: Import 50+ domains with varied TLDs and statuses, navigate to dashboard, verify summary counts and TLD chart match the domain list.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create summary cards in `components/dashboard/dashboard-summary-cards.tsx` — 4 cards in responsive grid (2-col mobile, 4-col desktop): Total Domains (Globe icon), Active (CheckCircle2), Expiring Soon ≤30d (AlertTriangle), Portfolio Value (DollarSign); each card shows icon, large number, and label; props accept `{ total, active, expiringSoon, portfolioValue }` numbers
- [x] T004 [P] [US1] Create TLD distribution chart in `components/dashboard/dashboard-tld-chart.tsx` — client component using Recharts `<BarChart>` with `<ResponsiveContainer>`; groups domains by TLD count; TLDs with <3 domains collapsed into "Other" category; uses accent-primary for bar color; props accept `{ tldCounts: { tld: string; count: number }[] }`
- [x] T005 [P] [US1] Create dashboard empty state in `components/dashboard/dashboard-empty-state.tsx` — shown when user has zero domains; message "No domains yet — import your first CSV" with CTA link to /import
- [x] T006 [US1] Implement dashboard page in `app/(dashboard)/dashboard/page.tsx` — server component that: (1) runs `autoTransitionExpired()`, (2) calls `fetchDashboardData()` to get all domains, (3) computes summary aggregates (total, active, expiringSoon, portfolioValue), (4) computes TLD counts with "Other" grouping, (5) renders `dashboard-summary-cards`, `dashboard-tld-chart`, and `dashboard-empty-state` when no domains exist; uses skeleton cards while loading; responsive grid per constitution: 2-col ≥1024px, 1-col 768–1023px, stacked <768px

**Checkpoint**: Dashboard landing page functional — summary cards and TLD chart visible

---

## Phase 4: User Story 2 — Expiration Timeline & Alerts (Priority: P1) 🎯 MVP

**Goal**: Users see a 12-month expiration timeline chart and a table of domains expiring within 90 days, sorted by soonest first. Expired domains shown in a separate section with danger highlight.

**Independent Test**: Import domains with expiration dates spread across 12 months, verify timeline chart groups correctly, verify expiring table lists domains sorted by date with accurate days-remaining.

### Implementation for User Story 2

- [x] T007 [P] [US2] Create expiration timeline chart in `components/dashboard/dashboard-timeline-chart.tsx` — client component using Recharts `<BarChart>` with `<ResponsiveContainer>`; groups future-expiring domains by calendar month for next 12 months; X-axis labels: short month names (Jan, Feb, ...); Y-axis: domain count; bars use accent-warning for ≤30 days, accent-primary for >30 days; empty state: "No domains expiring in the next 12 months"
- [x] T008 [P] [US2] Create expiring soon table in `components/dashboard/dashboard-expiring-table.tsx` — shadcn/ui Table; columns: domain name (link to /domains/[id]), TLD, expiration date (formatted), days remaining (with expiry badge color), status badge; filter: domains with status 'active' AND expiration_date within 90 days; sorted by expiration_date ASC; empty state: "No domains expiring soon — your portfolio is in good shape"; props accept `{ domains: DomainRow[] }`
- [x] T009 [P] [US2] Create expired domains section in `components/dashboard/dashboard-expired-table.tsx` — shadcn/ui Table with danger-color highlight; columns: domain name, TLD, days since expiry (e.g., "45 days ago" in accent-danger), status badge; filter: domains with expiration_date < today AND (status = 'expired' OR status = 'active'); empty state: "No expired domains"; props accept `{ domains: DomainRow[] }`
- [x] T010 [US2] Add expiration timeline and expiring/expired tables to dashboard page in `app/(dashboard)/dashboard/page.tsx` — compute timeline data (12-month buckets from domain expiration dates), filter expiring-soon and expired domain lists from fetched data; pass to `dashboard-timeline-chart`, `dashboard-expiring-table`, and `dashboard-expired-table`; integrate below summary cards in dashboard layout (depends on T007, T008, T009)

**Checkpoint**: Expiration timeline and expiring domains table functional alongside summary cards

---

## Phase 5: User Story 3 — Portfolio Value & TLD Distribution Charts (Priority: P2)

**Goal**: Users see a portfolio value distribution chart showing total purchase price grouped by TLD. Domains with no purchase price are excluded.

**Independent Test**: Import domains with varied purchase prices across TLDs, verify value chart segments match sum of prices per TLD.

### Implementation for User Story 3

- [x] T011 [P] [US3] Create value distribution chart in `components/dashboard/dashboard-value-chart.tsx` — client component using Recharts `<BarChart>` with `<ResponsiveContainer>`; groups total purchase_price by TLD; excludes domains with null or zero purchase_price; each bar uses rotating chart color palette; Y-axis shows dollar amounts formatted ($XXX); empty state: "No pricing data available"; props accept `{ tldValues: { tld: string; value: number }[] }`
- [x] T012 [US3] Add value chart to dashboard page in `app/(dashboard)/dashboard/page.tsx` — compute TLD value totals from fetched domains (filter out null/zero prices); pass to `dashboard-value-chart`; place below timeline chart in layout (depends on T011)

**Checkpoint**: Value distribution chart visible on dashboard

---

## Phase 6: User Story 4 — Domain Status Auto-Transition (Priority: P2)

**Goal**: Active domains with past expiration dates automatically transition to "expired" status when the dashboard loads. Transition is idempotent.

**Independent Test**: Set a domain's expiration date to yesterday with status "active", reload dashboard, verify status changes to "expired".

### Implementation for User Story 4

- [x] T013 [US4] Implement auto-transition query in `lib/supabase/queries/dashboard.ts` — `autoTransitionExpired()` function: runs `UPDATE domains SET status = 'expired' WHERE user_id = auth.uid() AND status = 'active' AND expiration_date < CURRENT_DATE::date` via Supabase server client; returns count of updated rows; idempotent — safe to call repeatedly
- [x] T014 [US4] Wire auto-transition into dashboard page in `app/(dashboard)/dashboard/page.tsx` — call `autoTransitionExpired()` before `fetchDashboardData()` so dashboard counts reflect updated statuses; handle errors silently (auto-transition failure should not block dashboard load) (depends on T013)

**Checkpoint**: Auto-transition working — expired active domains update on dashboard load

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual polish, responsive verification, and build quality checks

- [x] T015 [P] Add skeleton loaders to `components/dashboard/dashboard-summary-cards.tsx` — show 4 Skeleton cards with matching dimensions while data loads
- [x] T016 [P] Add skeleton loaders to chart components — show Skeleton rectangles in `dashboard-tld-chart.tsx`, `dashboard-timeline-chart.tsx`, `dashboard-value-chart.tsx` while data loads (each chart shows a single Skeleton placeholder matching chart dimensions)
- [x] T017 [P] Add skeleton loader to `components/dashboard/dashboard-expiring-table.tsx` — show 3 Skeleton rows while data loads
- [x] T018 Verify dashboard responsive layout per constitution: 2-col grid ≥1024px, 1-col 768–1023px, stacked cards <768px — test at 375px, 480px, 768px, 1024px, 1440px, 1920px
- [x] T019 Run TypeScript strict check: `npx tsc --noEmit` — ensure zero errors
- [x] T020 Run production build: `npm run build` — ensure clean Vercel build
- [x] T021 Run quickstart.md verification checklist — confirm all 10 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — can start immediately after
- **US2 (Phase 4)**: Depends on Foundational — can start in parallel with US1
- **US3 (Phase 5)**: Depends on Foundational — can start after US1 (needs dashboard page scaffold)
- **US4 (Phase 6)**: Depends on Foundational — can start in parallel with US1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 — benefits from US1 page scaffold but independently testable
- **US3 (P2)**: Depends on US1 (needs dashboard page to integrate chart into)
- **US4 (P2)**: Can start after Phase 2 — independently testable

### Within Each User Story

- [P] tasks (different files) can run in parallel
- Components before page integration
- Page integration last (wires components together)

---

## Parallel Opportunities

- **Phase 1**: Single task (T001)
- **Phase 2**: Single task (T002)
- **US1**: T003-T005 can run in parallel; T006 last
- **US2**: T007-T009 can run in parallel; T010 last
- **US3**: T011 can run immediately after Phase 2; T012 after T011 + US1
- **US4**: T013 can run immediately after Phase 2; T014 after T013 + US1
- **US1 + US2 + US4**: All can begin in parallel once Phase 2 complete
- **Polish**: T015-T017 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 components in parallel:
Task: "Create summary cards in components/dashboard/dashboard-summary-cards.tsx"
Task: "Create TLD distribution chart in components/dashboard/dashboard-tld-chart.tsx"
Task: "Create dashboard empty state in components/dashboard/dashboard-empty-state.tsx"

# Then assemble page:
Task: "Implement dashboard page in app/(dashboard)/dashboard/page.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch all US2 components in parallel:
Task: "Create expiration timeline chart in components/dashboard/dashboard-timeline-chart.tsx"
Task: "Create expiring soon table in components/dashboard/dashboard-expiring-table.tsx"
Task: "Create expired domains section in components/dashboard/dashboard-expired-table.tsx"

# Then integrate into page:
Task: "Add expiration timeline and tables to dashboard page"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — Both P1)

1. Complete Phase 1: Setup (recharts install)
2. Complete Phase 2: Foundational (dashboard queries)
3. Complete Phase 3: User Story 1 (Summary + TLD Chart)
4. Complete Phase 4: User Story 2 (Timeline + Expiring Table)
5. **STOP and VALIDATE**: Dashboard shows summary cards, charts, and expiring domains
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Summary + TLD Chart) → Test independently → **MVP Deploy**
3. US2 (Expiration Timeline) → Test independently → Deploy
4. US3 (Value Chart) + US4 (Auto-Transition) → Test independently → **Full Phase 3 Deploy**
5. Polish → Final verification → **Release**

### Parallel Team Strategy (2 developers)

With 2 developers after Phase 2:

- **Dev A**: US1 (Summary + TLD Chart) → US3 (Value Chart)
- **Dev B**: US2 (Timeline + Tables) → US4 (Auto-Transition)
- Both merge, then together on Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are manual E2E only — no automated test tasks in this phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 21 tasks across 7 phases
- MVP scope (US1 + US2): 12 tasks through Phase 4
