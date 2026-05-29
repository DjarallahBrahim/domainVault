# Feature Specification: Phase 4 Refresh — Sales Analytics on Dashboard

**Feature Branch**: `007-phase-4-refresh`

**Created**: 2026-05-24

**Status**: Draft

**Input**: "Add US-024, US-025, US-026, US-027 from master plan Phase 4 to the dashboard.
US-021, US-022, US-023 are already [DONE]."

**Tags legend**:
- **[DONE]** — Don't touch. Fully implemented.
- **[NEW]** — Build from scratch per master plan.

## Clarifications

*(None yet.)*

## User Scenarios & Testing

### User Story 1 — Revenue Over Time Chart (Priority: P1) [NEW]

Per US-024 in the master plan, the dashboard displays a bar chart showing revenue per
month. A toggle switches between 12 months, 24 months, and All time. An overlaid
cumulative line appears on a secondary Y-axis. Hovering a bar shows a tooltip with
month, revenue, number of sales, and cumulative total. Months with no sales show a
zero-height bar (not a gap).

**Why this priority**: Revenue visualization is the primary financial metric. It
gives users immediate insight into earnings trends and growth.

**Independent Test**: Create sales across multiple months. Chart renders bars per
month. Toggle 12M/24M/All time — data range changes. Hover a bar — tooltip shows
month, revenue, sales count, cumulative. Months with zero sales show thin bars.

**Acceptance Scenarios**:

1. **Given** a user with sales across several months, **When** the dashboard loads,
   **Then** a bar chart displays revenue per month with bars colored accent-primary.
2. **Given** the revenue chart, **When** the user selects "12M", **Then** only the
   last 12 months of data are shown.
3. **Given** the revenue chart, **When** the user selects "24M" or "All time",
   **Then** the data range expands accordingly.
4. **Given** the revenue chart, **When** the user hovers a bar, **Then** a tooltip
   shows: month name, revenue amount, number of sales that month, and cumulative
   revenue to date.
5. **Given** months with no sales, **When** rendered, **Then** those months show a
   zero-height (or minimal-height) bar — no gap in the chart.
6. **Given** the chart, **When** it mounts, **Then** bars animate in over 600ms.

---

### User Story 2 — Top Sales Leaderboard (Priority: P2) [NEW]

Per US-025 in the master plan, the dashboard shows a leaderboard of the top 5 sales
by sale price. Columns: rank, domain name, sale price, ROI %, date. A toggle expands
the list to top 10. A "Best ROI" toggle re-sorts by ROI percentage instead of sale
price. ROI is calculated as `((sale_price - purchase_price) / purchase_price) × 100`
and shown in green (positive) or red (negative). If purchase price is missing, ROI
shows "—".

**Why this priority**: A leaderboard celebrates wins and motivates users. It's
secondary to the revenue chart but adds engagement.

**Independent Test**: Create 8 sales with varying prices. Top 5 shown sorted by
price. Click "Show top 10" → 8 sales shown. Click "Best ROI" → re-sorted by ROI %.
Verify missing purchase price shows "—" for ROI.

**Acceptance Scenarios**:

1. **Given** a user with 5+ sales, **When** the dashboard loads, **Then** the top 5
   sales are displayed sorted by sale price descending, with rank, domain, price,
   ROI %, and date.
2. **Given** the leaderboard, **When** "Show top 10" is clicked, **Then** up to 10
   sales are shown (or all if fewer than 10 exist).
3. **Given** the leaderboard, **When** "Best ROI" toggle is clicked, **Then** the
   list re-sorts by ROI % descending.
4. **Given** a sale with no purchase price, **When** displayed, **Then** the ROI %
   column shows "—".
5. **Given** a sale with positive ROI, **When** displayed, **Then** ROI % is shown
   in green. Negative ROI shown in red.

---

### User Story 3 — Platform Performance (Priority: P2) [NEW]

Per US-026 in the master plan, the dashboard shows a horizontal bar chart or table
breaking down sales by platform. Columns: platform name, number of sales, total
revenue, average sale price. Sorted by total revenue descending. Hovering a bar
shows a tooltip with the platform name and revenue.

**Why this priority**: Platform breakdown helps users understand which marketplaces
are most profitable and where to focus selling efforts.

**Independent Test**: Create sales across different platforms (Sedo, Afternic,
Direct). Chart/table shows each platform with correct counts and revenue. Hover
bar → tooltip with platform name and total revenue. Verify sorting is by revenue
descending.

**Acceptance Scenarios**:

1. **Given** a user with sales across multiple platforms, **When** the dashboard
   loads, **Then** a horizontal bar chart or table displays platform breakdown
   sorted by total revenue descending.
2. **Given** the platform chart, **When** hovering a bar, **Then** a tooltip shows
   the platform name, number of sales, total revenue, and average sale price.
3. **Given** sales on a single platform, **When** the chart renders, **Then** a
   single bar is shown with that platform's data.
4. **Given** no sales exist, **When** the chart renders, **Then** an empty state
   message is shown: "No sales data yet."

---

### User Story 4 — ROI Analysis per Domain (Priority: P3) [NEW]

Per US-027 in the master plan, the leaderboard rows are expandable. Clicking a sale
reveals an expanded detail view: domain name, purchase price, sale price, gross
profit, ROI %, and hold duration ("Held for X days / Y months"), and platform.

**Why this priority**: ROI detail gives users insight into individual sale
performance. It's lower priority because top-level metrics are more important.

**Independent Test**: Click a leaderboard row. Expanded detail shows purchase price,
sale price, profit, ROI %, hold duration, platform. Click another row → previous
collapses, new one expands. Click expanded row → collapses.

**Acceptance Scenarios**:

1. **Given** a leaderboard row, **When** clicked, **Then** it expands to show:
   purchase price, sale price, gross profit (`sale - purchase`), ROI %, hold
   duration, and platform.
2. **Given** an expanded row, **When** another row is clicked, **Then** the
   previously expanded row collapses and the new one expands (accordion behavior).
3. **Given** an expanded row, **When** clicked again, **Then** it collapses.
4. **Given** a sale with missing purchase price, **When** expanded, **Then** profit
   and ROI % show "—" and hold duration still shows calculated value.

---

### Already Complete — No Changes Required

| Feature | Status |
|---|---|
| US-021 — Log a Sale (Sales page form + domain detail button) | **[DONE]** |
| US-022 — Sales List (paginated table with ROI, Profit, filters) | **[DONE]** |
| US-023 — Sales KPI Cards (Total Revenue, Profit, Avg Price, Sold) | **[DONE]** |

---

## Requirements

### Functional Requirements

#### Revenue Over Time Chart [NEW]

- **FR-001**: Dashboard MUST display a bar chart of revenue per month using the
  `sales` table.
- **FR-002**: Chart MUST have a toggle: 12 months / 24 months / All time, defaulting
  to 12 months.
- **FR-003**: An overlaid cumulative revenue line MUST appear on a secondary Y-axis.
- **FR-004**: Hovering a bar MUST show a tooltip with: month name, revenue amount,
  number of sales in that month, and cumulative revenue to date.
- **FR-005**: Months with zero sales MUST show a zero-height (or minimal 1px) bar
  — no gaps in the chart timeline.
- **FR-006**: Bars MUST animate on mount over 600ms.

#### Top Sales Leaderboard [NEW]

- **FR-007**: Dashboard MUST display the top 5 sales by sale price in a leaderboard
  table with columns: rank, domain, sale price, ROI %, date.
- **FR-008**: A toggle MUST expand the leaderboard to show top 10 sales.
- **FR-009**: A "Best ROI" toggle MUST re-sort the leaderboard by ROI % descending.
- **FR-010**: ROI % MUST be displayed in green for positive values and red for
  negative values.
- **FR-011**: When purchase price is missing, ROI % MUST display "—".

#### Platform Performance [NEW]

- **FR-012**: Dashboard MUST display a breakdown of sales by platform as a horizontal
  bar chart or table.
- **FR-013**: Display MUST include: platform name, number of sales, total revenue,
  and average sale price, sorted by total revenue descending.
- **FR-014**: Hovering a platform bar MUST show a tooltip with platform name,
  sales count, total revenue, and average sale price.
- **FR-015**: An empty state message MUST be shown when no sales data exists.

#### ROI Analysis per Domain [NEW]

- **FR-016**: Leaderboard rows MUST be expandable. Clicking a row reveals: purchase
  price, sale price, gross profit, ROI %, hold duration, and platform.
- **FR-017**: Expanded rows MUST use accordion behavior — only one row expanded at
  a time. Clicking an expanded row collapses it.
- **FR-018**: Hold duration MUST be calculated as `sold_at - created_at` (or
  `sold_at - purchase_date` if available) and displayed as "X days / Y months."
- **FR-019**: When purchase price is missing, profit and ROI % MUST display "—."

### Key Entities

- **Sale** (existing): Used by all new charts. Key fields: `sale_price`, `sold_at`,
  `buyer`, `platform`, `domain_id` (JOIN to `domains.purchase_price`).
- **Domain** (existing): Joined for `purchase_price` to calculate profit and ROI.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Revenue chart renders correctly for 100% of test portfolios with sales
  across 0–36 months.
- **SC-002**: Leaderboard correctly sorts by sale price and ROI % for portfolios
  with up to 1,000 sales.
- **SC-003**: Platform breakdown correctly aggregates sales for up to 20 distinct
  platforms.
- **SC-004**: Expanded ROI detail shows correct hold duration within 1 day margin
  for all test sales.
- **SC-005**: The dashboard loads all new widgets without exceeding the current
  query budget (new queries run alongside existing 4 dashboard queries).
- **SC-006**: All new widgets render within the existing dashboard performance
  budget (<2s total page load).
- **SC-007**: The application builds with zero TypeScript errors and zero ESLint
  warnings.

## Assumptions

- The `sales` table and `domains` table are already populated and RLS-enforced.
- Purchase price for ROI calculation comes from `domains.purchase_price` joined
  via `sales.domain_id`.
- The revenue chart, leaderboard, and platform breakdown are placed on the
  existing dashboard page beneath the current widgets (KPI cards, charts, promotion
  section) or integrated into the layout.
- Dashboard layout may need adjustment to accommodate the new widgets — the plan
  phase should analyze current layout and propose placement.
- All new charts follow the Chart Interaction Standard: custom tooltips, hover
  effects, animated entry, clickable where applicable.
- No new database tables or migrations are required — all data comes from existing
  `sales` and `domains` tables.
