# Tasks: Phase 3 Refresh — Dashboard & Analytics (Redesigned)

**Input**: Design documents from `/specs/006-phase-3-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per quickstart.md — no automated test tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

---

## Phase 1: Setup — Migrations & Types

**Purpose**: Apply new database schema and regenerate types before any code changes.

- [x] T001 Apply Migration 002 — create `supabase/migrations/002_promotions.sql` from master plan §5.2 (promotions table with RLS, unique constraint, index) and apply via Supabase
- [x] T002 Apply Migration 003 — create `supabase/migrations/003_registrar_index.sql` from master plan §5.3 (`CREATE INDEX idx_domains_registrar ON domains(registrar)`) and apply via Supabase
- [x] T003 [P] Run `npm run types:generate` to regenerate `types/supabase.ts` with the new `promotions` table and types

**Checkpoint**: `promotions` table exists, registrar index exists, types up-to-date.

---

## Phase 2: Foundational — Deletions & Queries

**Purpose**: Remove v1 dead code and create shared dashboard queries. MUST complete before UI stories.

- [x] T004 [P] Delete `components/dashboard/dashboard-timeline-chart.tsx` — v1 Expiry Timeline bar chart
- [x] T005 [P] Delete `components/dashboard/dashboard-tld-chart.tsx` — v1 TLD Distribution donut chart
- [x] T006 [P] Delete any 6-month toggle variant or associated dead code from `components/dashboard/`
- [x] T007 [P] Update `lib/supabase/queries/dashboard.ts` — rewrite server-side queries: `fetchDashboardStats()` (total_active, portfolio_value, expiring_90d, expiring_30d, sold_this_year), `fetchExpirySegments()` (non-overlapping exp_1m/3m/6m/9m counts), `fetchRegistrarBreakdown()` (top 10 by count), `fetchCurrentPromotions()` (join promotions+domains for current week). Ensure ≤4 queries total. Remove any v1 query functions for deleted charts.
- [x] T008 [P] Create `lib/supabase/queries/dashboard-client.ts` — client-side mutation: `updatePromotion(promotionId, { promoted_at })` for inline confirm; `generatePromotionBatch(userId, pool)` for pool change (delete existing + insert new). Use browser Supabase client.

**Checkpoint**: Dead code removed. All dashboard queries ready. Ready for UI component stories.

---

## Phase 3: User Story 1 — KPI Cards (Priority: P1)

**Goal**: 4 clickable KPI cards with animated counters, hover lift, colored accent stripes, skeleton loading.

**Independent Test**: 4 cards render with correct values. Hover lifts. Click navigates to correct route. Skeleton shown during load.

- [x] T009 [US1] Create/update `components/dashboard/dashboard-kpi-cards.tsx` — client component; accepts `DashboardStats` as prop; renders 4 `<Card>` components: Total Domains (icon: Globe), Portfolio Value (icon: DollarSign, formatted currency), Expiring in 90 Days (icon: Clock, links to `/domains?expiry=3m`), Sold This Year (icon: TrendingUp, links to `/sales`); each card: left accent stripe, hover scale+shadow via Tailwind, animated counter from 0 to value on mount (useEffect + interval); Skeleton variant shown when data is null/loading; Total Domains card links to `/domains`

---

## Phase 4: User Story 2 — Expiry Donut Chart (Priority: P1)

**Goal**: Donut chart with 4 non-overlapping segments, center total count, legend, hover tooltips with domain names, click navigation, empty state.

**Independent Test**: Donut renders with correct segment counts. Hover shows domain names. Click navigates. Empty state when all zero.

- [x] T010 [US2] Create `components/dashboard/dashboard-expiry-donut.tsx` — client component; accepts `ExpirySegments` as prop; uses Recharts `<PieChart>` with `innerRadius={60} outerRadius={100}`; 4 `<Pie>` segments with colors: ≤1m=#ef4444, ≤3m=#f59e0b, ≤6m=#eab308, ≤9m=#10b981; center `<Label>` shows total count; custom `<Tooltip>` renders domain names + expiry dates (passed via tooltipData prop or computed); legend beside chart with color swatches + labels + counts + percentage; onClick segment navigates to `/domains?expiry=1m` (or 3m/6m/9m); empty state when all segments 0; animated entry via `animationDuration={600}`

---

## Phase 5: User Story 3 — Registrar Breakdown Chart (Priority: P1)

**Goal**: Horizontal bar chart top 10 registrars, hover tooltips, click navigation, "Unknown" grouping.

**Independent Test**: Chart shows top 10 registrars descending. Hover shows count + %. Click bar navigates. "Unknown" for null registrars.

- [x] T011 [US3] Create `components/dashboard/dashboard-registrar-chart.tsx` — client component; accepts `RegistrarBreakdown[]` as prop; uses Recharts `<BarChart layout="horizontal">`; X-axis: domain count; Y-axis: registrar name (sorted desc, top 10); bars use accent-primary with opacity gradient; custom `<Tooltip>` shows registrar name, count, % of total; onClick bar navigates to `/domains?registrar=<name>`; handle null/empty registrar as "Unknown"; empty state if no data; animated entry via `animationDuration={600}`

---

## Phase 6: User Story 4 — Critical Renewals Panel (Priority: P2)

**Goal**: Up to 10 domains expiring ≤30 days, urgency-sorted, inline date picker for renewal, "View All" link, "All clear" state.

**Independent Test**: Domains expiring within 30 days shown sorted. "Mark as Renewed" opens date picker. "View All" navigates. "All clear" when none.

- [x] T012 [US4] Update `components/dashboard/dashboard-critical-renewals.tsx` — client component; fetches domains expiring ≤30 days via query; renders up to 10 rows sorted by days ascending; each row: domain name, days-remaining badge (color-mapped), "Mark as Renewed" button; clicking "Mark as Renewed" reveals inline `<Input type="date">` + Save/Cancel buttons; Save calls `updateDomain()` with new expiration_date via `useMutation`; on success invalidate queries + row removed; "View All" link → `/domains?expiry=1m`; "All clear" message when no expiring domains; Skeleton while loading

---

## Phase 7: User Story 5 — Promotion Table (Priority: P2)

**Goal**: Weekly promotion widget with pool selector, deterministic batch generation, inline confirm/cancel, promoted badges.

**Independent Test**: Batch generates on load. Pool dropdown changes batch. Promote shows inline confirm. Yes persists promoted_at. Cancel collapses. Badge shown for promoted.

- [x] T013 [US5] Create `components/dashboard/dashboard-promotion-table.tsx` — client component; uses `useQuery` to fetch current week promotions; renders table: Domain, Registrar, Expiration Date, Days Until Expiry, Promoted?; pool selector dropdown (Expiring in 1m/3m/6m/9m/All active, default 3m) via `<Select>`; on pool change: call `generatePromotionBatch` mutation (delete existing + insert new); per row "Promote" button (ghost, small) — clicking sets `confirmingId` state; inline confirmation bar below domain name: "✓ Mark as promoted? [Yes] [Cancel]" styled as colored banner within row; Yes calls `updatePromotion` with `promoted_at = NOW()`, shows green "Promoted ✓" badge, hides button; Cancel clears `confirmingId`; already-promoted rows show green badge, no button; empty state: "Not enough active domains to fill a promotion list"; Skeleton while loading
- [x] T014 [US5] Add `generatePromotionBatch()` logic to `lib/supabase/queries/dashboard.ts` or `dashboard-client.ts` — accept `userId` + `pool`; query eligible domains from selected pool; shuffle deterministically using hash of `userId + week_start`; insert 10 into promotions with `promoted_at = NULL`; on pool change: delete existing rows for current week + user before inserting

---

## Phase 8: User Story 6 — Portfolio Value Chart (Priority: P2) [DONE]

**Goal**: No changes. Existing component works.

*Skipped — no tasks. Existing `dashboard-value-chart.tsx` remains unchanged.*

---

## Phase 9: User Story 7 — Quick Stats Widget (Priority: P3)

**Goal**: Replace "Most common TLD" with "Most common Registrar". Desktop sidebar column, mobile horizontal scroll chips.

**Independent Test**: Stats show "Most common Registrar". Desktop: right column. Mobile: scroll chips.

- [x] T015 [US7] Update `components/dashboard/dashboard-quick-stats.tsx` — replace "Most common TLD" stat with "Most common Registrar" (computed from registrar breakdown data or a dedicated query); ensure stats display: Average price, Most common Registrar, Oldest domain, Newest domain, Total expired, Total earnings; desktop (≥1024px): vertical sidebar column; mobile (<1024px): horizontal flex scroll row of stat chips; Skeleton while loading

---

## Phase 10: Assembly — Dashboard Page & Client

**Purpose**: Wire all components into the dashboard page and client wrapper.

- [x] T016 Create `components/dashboard/dashboard-client.tsx` — client component; accepts `initialStats`, `initialSegments`, `initialRegistrarData`, `initialPromotions` as props; uses TanStack Query with `initialData` for hydration; renders dashboard layout per master plan:
  ```
  Desktop: KPI cards row → [Expiry Donut | Registrar Chart] → [Promotion Table (left) | Critical Renewals + Quick Stats (right)]
  Tablet: single column stacked
  Mobile: stacked cards
  ```
  Uses CSS grid/flexbox for responsive layout; passes data to each child component; includes `<Suspense>` boundaries with skeleton fallbacks
- [x] T017 Update `app/(dashboard)/dashboard/page.tsx` — server component; runs all 4 dashboard queries in parallel via `Promise.all`; passes results as props to `DashboardClient`; handles empty portfolio state (no domains → show empty state with CTA to import)

---

## Phase 11: Polish & Cross-Cutting Concerns

- [x] T018 Run `npm run typecheck` — fix all TypeScript errors
- [x] T019 Run `npm run lint` — fix all ESLint warnings
- [x] T020 Run `npm run build` — verify clean Vercel build
- [x] T021 Run quickstart.md verification checklist — confirm all 10 sections pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. Blocks all code changes.
- **Foundational (Phase 2)**: After Phase 1 — BLOCKS all UI stories.
- **US1–US3 (Phases 3–5)**: After Phase 2 — P1 stories, can run in parallel.
- **US4 (Phase 6)**: After Phase 2 — can run in parallel with US1–US3.
- **US5 (Phase 7)**: After Phase 2 + T008 (client queries) — can run in parallel.
- **US7 (Phase 9)**: After Phase 2 — can run in parallel.
- **Assembly (Phase 10)**: Depends on all components (US1–US5, US7).
- **Polish (Phase 11)**: After Assembly.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P1)**: Independent after Phase 2
- **US3 (P1)**: Independent after Phase 2
- **US4 (P2)**: Independent after Phase 2
- **US5 (P2)**: Depends on T008 (client queries) + T014 (batch logic)
- **US7 (P3)**: Independent after Phase 2 (may reuse registrar data from Phase 2)
- **US6**: No tasks (DONE)

---

## Parallel Opportunities

```bash
# Phase 1-2: Setup + Foundational
T001, T002, T003 — parallel (migrations + types)
T004, T005, T006, T007, T008 — parallel (all different files)

# Phase 3-6 + 9: All UI components can be built in parallel after Phase 2
T009 [US1] — KPI cards
T010 [US2] — Expiry donut
T011 [US3] — Registrar chart
T012 [US4] — Critical renewals
T013 + T014 [US5] — Promotion table (sequential within story)
T015 [US7] — Quick stats
```

---

## Implementation Strategy

### MVP First (P1 Stories)

1. Phase 1: Migrations + types
2. Phase 2: Delete v1 code + create queries
3. Phases 3–5: US1 (KPI cards) + US2 (Donut) + US3 (Registrar)
4. Phase 10 (partial): Wire P1 components
5. **STOP and VALIDATE**: Dashboard shows KPI cards + both charts with real data

### Incremental Delivery

1. Setup + Foundational → Queries ready
2. US1 + US2 + US3 (P1) → Core dashboard visuals
3. US4 (P2) → Critical renewals panel
4. US5 (P2) → Promotion table
5. US7 (P3) → Quick stats
6. Assembly + Polish → Full dashboard

---

## Notes

- Total: 21 tasks across 11 phases
- [P] tasks can run in parallel
- T001–T003 (migrations) must complete before any code that references the promotions table
- T004–T006 must complete before the dashboard page is rewritten (to avoid referencing dead components)
- 4 Supabase queries max per dashboard render (enforced in T007/T017)
- All charts follow Chart Interaction Standard: custom tooltips, hover effects, animated entry, clickable navigation
