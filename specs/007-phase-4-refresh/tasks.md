# Tasks: Phase 4 Refresh — Sales Analytics on Dashboard

**Input**: Design documents from `/specs/007-phase-4-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies needed. All libraries (Recharts, date-fns, shadcn/ui) already installed.

*Skipped.*

---

## Phase 2: Foundational — Sales Analytics Query

**Purpose**: Shared query function used by all 3 widgets. MUST complete before any UI stories.

- [x] T001 Add `fetchSalesAnalytics()` to `lib/supabase/queries/dashboard.ts` — query `sales JOIN domains` returning: `id`, `domain` (from domains), `sale_price`, `purchase_price`, `sold_at`, `platform`, `buyer`, `notes`, `created_at` (domain). Scope to `auth.uid()`. Order by `sold_at DESC`.
- [x] T002 [P] Add `fetchSalesAnalytics()` to `lib/supabase/queries/dashboard-client.ts` — client-side variant using browser Supabase client. Same query, same return shape.

**Checkpoint**: Sales data available for all widgets via shared query.

---

## Phase 3: User Story 1 — Revenue Over Time Chart (Priority: P1)

**Goal**: Bar chart of monthly revenue with cumulative line, 12M/24M/All toggle, tooltips, zero-height bars for empty months.

**Independent Test**: Render chart with sales data. Toggle 12M/24M/All. Hover bar → tooltip with month/revenue/count/cumulative. Empty months show bars.

- [x] T003 [US1] Create `components/dashboard/dashboard-revenue-chart.tsx` — client component; uses `useQuery` with `fetchSalesAnalytics`; groups sales by month client-side (using `date-fns` `format(sold_at, 'yyyy-MM')`); computes cumulative running total; renders Recharts `<ComposedChart>` with `<Bar>` for revenue (accent-primary fill, `animationDuration={600}`) and `<Line>` on secondary Y-axis for cumulative (accent-success stroke); toggle buttons: 12M (default), 24M, All time (filter displayed months); custom `<Tooltip>` showing: month name, revenue formatted as `$X,XXX`, number of sales, cumulative total; months with zero sales rendered as `minPointSize={1}` bars (no gaps); empty state "No sales data yet" when no sales; Skeleton while loading

---

## Phase 4: User Story 2 + 4 — Top Sales Leaderboard + ROI Detail (Priority: P2)

**Goal**: Top 5/10 sales leaderboard, Best ROI re-sort, expandable ROI detail with profit and hold duration.

**Independent Test**: Top 5 by price shown. Toggle to top 10. Best ROI re-sorts. Click row → expand shows profit, ROI %, hold duration. Accordion behavior.

- [x] T004 [US2] Create `components/dashboard/dashboard-sales-leaderboard.tsx` — client component; uses `useQuery` with `fetchSalesAnalytics`; renders compact `<table>` with columns: rank, domain (font-mono), sale price, ROI %, date; top 5 by default; state: `showTop10` toggle and `sortByROI` toggle; sort logic: `sale_price DESC` (default) or `roi_pct DESC` (Best ROI); ROI %: green for positive, red for negative, "—" when purchase_price missing; click a row sets `expandedId` state; expanded row shows detail row below: purchase price, sale price, gross profit (`sale - purchase`), ROI %, hold duration ("X days / Y months" using `date-fns differenceInDays` from `created_at` to `sold_at`), platform, buyer; accordion: clicking different row collapses previous; clicking expanded row collapses it; empty state "No sales yet" when no data; Skeleton while loading

---

## Phase 5: User Story 3 — Platform Performance (Priority: P2)

**Goal**: Horizontal bar chart or table of platform breakdown by revenue.

**Independent Test**: Platforms shown sorted by revenue. Hover → tooltip with details. "Other" for null platform. Empty state.

- [x] T005 [US3] Create `components/dashboard/dashboard-platform-breakdown.tsx` — client component; uses `useQuery` with `fetchSalesAnalytics`; groups sales by platform client-side (null → "Other"); computes `sales_count`, `total_revenue`, `avg_sale_price` per platform; sorted by `total_revenue DESC`; renders Recharts `<BarChart layout="horizontal">` with bars colored accent-primary; custom `<Tooltip>` showing: platform name, sales count, total revenue, avg sale price; Y-axis labels: platform names; X-axis: revenue; empty state "No sales data yet" when no data; Skeleton while loading

---

## Phase 6: Assembly — Dashboard Layout Integration

**Purpose**: Wire all new widgets into the existing dashboard layout.

- [x] T006 Update `components/dashboard/dashboard-client.tsx` — import `DashboardRevenueChart`, `DashboardSalesLeaderboard`, `DashboardPlatformBreakdown`; render in a new section below the existing 3-column grid:

  ```
  [Existing content...]
  <DashboardRevenueChart /> (full width)
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <DashboardSalesLeaderboard />
    <DashboardPlatformBreakdown />
  </div>
  ```

- [x] T007 Update `app/(dashboard)/dashboard/page.tsx` — if needed, add `fetchSalesAnalytics()` to the server-side Promise.all for SSR hydration (optional; widgets can fetch client-side)

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T008 Run `npm run typecheck` — fix all TypeScript errors
- [x] T009 Run `npm run lint` — fix all ESLint warnings
- [x] T010 Run `npm run build` — verify clean Vercel build
- [x] T011 Run quickstart.md verification checklist — confirm all 7 sections pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. BLOCKS all UI stories.
- **US1 (Phase 3)**: After Phase 2 — can run in parallel with US2, US3.
- **US2 (Phase 4)**: After Phase 2 — can run in parallel with US1, US3.
- **US3 (Phase 5)**: After Phase 2 — can run in parallel with US1, US2.
- **Assembly (Phase 6)**: After US1, US2, US3 complete.
- **Polish (Phase 7)**: After Assembly.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2.
- **US2 (P2)**: Independent after Phase 2.
- **US3 (P2)**: Independent after Phase 2.
- **US4**: Integrated into US2 (leaderboard expandable rows).

---

## Parallel Opportunities

```bash
# Phase 2: Both query functions in parallel
T001 — server query (dashboard.ts)
T002 — client query (dashboard-client.ts)

# Phases 3-5: All 3 widgets in parallel
T003 [US1] — Revenue chart
T004 [US2] — Leaderboard + ROI detail
T005 [US3] — Platform breakdown
```

---

## Implementation Strategy

### MVP First (US1 — Revenue Chart)

1. Phase 2: Foundational (T001 + T002 parallel)
2. Phase 3: US1 — Revenue Over Time (T003)
3. Phase 6 (partial): Wire revenue chart into layout
4. **STOP and VALIDATE**: Revenue chart renders correctly

### Incremental Delivery

1. Foundational → Shared query ready
2. US1 (P1) → Revenue chart → MVP
3. US2 + US4 (P2) → Leaderboard + ROI detail
4. US3 (P2) → Platform breakdown
5. Assembly → Full layout integration
6. Polish → Build + verify

---

## Notes

- Total: 11 tasks across 7 phases
- [P] tasks can run in parallel
- US4 (ROI Analysis) is integrated into US2 (leaderboard expandable rows) — no separate phase
- All widgets share one `fetchSalesAnalytics` query — data fetched once, aggregated client-side
- No new DB tables or migrations needed
- Commit after each phase
- Run `npm run typecheck && npm run lint` after each phase introducing new code
