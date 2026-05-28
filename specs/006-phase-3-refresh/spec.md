# Feature Specification: Phase 3 Refresh — Dashboard & Analytics (Redesigned)

**Feature Branch**: `006-phase-3-refresh`

**Created**: 2026-05-24

**Status**: Draft

**Input**: "Full rebuild of Phase 3 per master plan v2. Delete deprecated v1 components (Section 9) first. US-013–US-019, all [NEW] or [UPDATED] unless tagged [DONE]."

**Tags legend**:
- **[DONE]** — Don't touch. Fully implemented, stable.
- **[NEW]** — Build from scratch per master plan spec.
- **[UPDATED]** — Exists but must be modified per master plan spec.
- **[DELETED]** — Remove from codebase before any new work begins.

## Clarifications

*(None yet.)*

## Prerequisite — Deleted Components [DELETED]

Before implementing any new stories, these 3 v1 components and their associated queries MUST be removed:

| Component | Original Role | Action |
|---|---|---|
| Expiry Timeline 3-Month bar chart | US-014 v1 | **[DELETED]** — remove component file + associated query |
| Expiry Timeline 6-Month toggle | US-015 v1 | **[DELETED]** — remove component file + associated query |
| TLD Distribution Donut Chart | US-017 v1 | **[DELETED]** — remove component file + associated query |

## User Scenarios & Testing

### User Story 1 — KPI Cards (Priority: P1) [UPDATED]

Per US-013 in the master plan, the dashboard has 4 KPI cards: **Total Domains**,
**Portfolio Value**, **Expiring in 90 Days**, **Sold This Year**. Each card displays
an icon, a large animated counter on load, a subtle trend indicator vs last month,
and a colored accent stripe on the left border. Cards are clickable — they navigate
to the corresponding filtered view. Hover lifts the card with a shadow transition.
Skeleton shown while loading.

**Why this priority**: KPI cards are the primary information surface of the dashboard.
They provide the at-a-glance summary every investor needs first.

**Independent Test**: Load dashboard. 4 cards render with correct counts. Hover a
card — it lifts with shadow. Click "Total Domains" → `/domains`. Click "Expiring
in 90 Days" → `/domains?expiry=3m`. Click "Sold This Year" → `/sales`. Refresh
while data loads → skeleton cards shown.

**Acceptance Scenarios**:

1. **Given** a user with domains in their portfolio, **When** the dashboard loads,
   **Then** 4 KPI cards display: Total Domains (count), Portfolio Value (sum of
   purchase prices for active domains), Expiring in 90 Days (count of active
   domains expiring within 90 days), Sold This Year (count of sales this calendar
   year).
2. **Given** a KPI card, **When** the user hovers over it, **Then** the card lifts
   with a shadow transition.
3. **Given** the "Total Domains" card, **When** clicked, **Then** the user navigates
   to `/domains`.
4. **Given** the "Expiring in 90 Days" card, **When** clicked, **Then** the user
   navigates to `/domains?expiry=3m`.
5. **Given** the "Sold This Year" card, **When** clicked, **Then** the user navigates
   to `/sales`.
6. **Given** dashboard data is loading, **When** the page renders, **Then** skeleton
   cards are shown in place of the KPI values.

---

### User Story 2 — Expiry Donut Chart (Priority: P1) [NEW]

Per US-014 in the master plan, the dashboard shows a donut chart with 4 non-overlapping
segments representing active domains expiring within: ≤1 month (red), ≤3 months (amber),
≤6 months (yellow), ≤9 months (green). The center of the donut displays the total domain
count. A legend beside the chart shows each segment's color, label, count, and percentage.
Hovering a segment brightens it and shows a tooltip with domain names and expiry dates.
Clicking a segment navigates to `/domains?expiry=1m` (or `3m`, `6m`, `9m`). If all
segments are zero, an empty state message is shown.

**Why this priority**: The donut chart replaces the v1 Expiry Timeline bar chart. It is
the primary visual summary of portfolio health — showing at a glance how much of the
portfolio needs attention.

**Independent Test**: Create domains with varied expiration dates. Verify donut renders
with correct segment counts (non-overlapping — a domain in ≤1m is NOT counted in ≤3m).
Hover a segment → tooltip shows domain names. Click a segment → navigates to filtered
domains page. Delete all domains → empty state shown.

**Acceptance Scenarios**:

1. **Given** active domains with mixed expiration dates, **When** the dashboard loads,
   **Then** the donut chart renders 4 segments with correct non-overlapping counts
   (≤1m, ≤3m, ≤6m, ≤9m) and colors matching the constitution badge mapping.
2. **Given** the donut chart, **When** hovering a segment, **Then** the segment
   brightens and a tooltip lists the domain names and their expiry dates in that
   window.
3. **Given** a donut segment, **When** clicked, **Then** the user navigates to
   `/domains?expiry=<window>` (1m, 3m, 6m, or 9m).
4. **Given** a portfolio with zero active domains or zero expiring domains,
   **When** the dashboard loads, **Then** an empty state message appears: "No
   expiring domains — your portfolio is in great shape."

---

### User Story 3 — Registrar Breakdown Chart (Priority: P1) [NEW]

Per US-015 in the master plan, the dashboard shows a horizontal bar chart of domains
grouped by registrar. X-axis: domain count. Y-axis: registrar name (sorted descending,
top 10). Bar color: accent-primary with opacity gradient. Each bar has a hover tooltip
showing registrar name, domain count, and % of total portfolio. Clicking a bar
navigates to `/domains?registrar=<name>`. Domains with null/empty registrar appear
under "Unknown". Empty state if no registrar data exists.

**Why this priority**: Replaces the v1 TLD Distribution chart. Registrar is a more
actionable dimension — users need to know which registrars hold their portfolio.

**Independent Test**: Import domains with varied registrar values. Verify chart shows
top 10 registrars descending by count. Hover bar → tooltip with name, count, %.
Click "GoDaddy" bar → `/domains?registrar=GoDaddy`. Verify "Unknown" entry for
domains with no registrar.

**Acceptance Scenarios**:

1. **Given** active domains with registrar data, **When** the dashboard loads,
   **Then** a horizontal bar chart shows registrars sorted by domain count descending,
   top 10.
2. **Given** the registrar chart, **When** hovering a bar, **Then** a tooltip shows
   the registrar name, domain count, and percentage of total portfolio.
3. **Given** a chart bar, **When** clicked, **Then** the user navigates to
   `/domains?registrar=<registrar_name>` with the registrar filter auto-applied.
4. **Given** domains with null or empty registrar, **When** the chart renders,
   **Then** those domains are grouped under an "Unknown" bar.
5. **Given** a portfolio with no registrar data (all null), **When** the dashboard
   loads, **Then** an empty state message is shown for the chart.

---

### User Story 4 — Critical Renewals Alert Panel (Priority: P2) [UPDATED]

Per US-016 in the master plan, the right column of the dashboard shows up to 10
domains expiring within 30 days, sorted ascending by days remaining. Each row shows
a badge with days remaining. "Mark as Renewed" per row opens an inline date picker
to update the expiration date. An "All clear" message appears when nothing is urgent.
A "View All" link navigates to `/domains?expiry=1m`. The "View All" link uses the
new URL param format from Phase 2.

**Why this priority**: Critical renewals are time-sensitive. This panel gives users
immediate visibility into domains that need action now.

**Independent Test**: Create a domain expiring in 10 days. Panel shows it at the top
with "10 days" badge. Click "Mark as Renewed" → inline date picker → select date →
save → domain disappears from panel. Create a domain expiring in 40 days → panel
does NOT show it (only ≤30 days). No domains expiring within 30 days → "All clear".

**Acceptance Scenarios**:

1. **Given** domains expiring within 30 days, **When** the dashboard loads, **Then**
   up to 10 of them are listed in the Critical Renewals panel sorted by days remaining
   ascending.
2. **Given** a domain row in the panel, **When** the user clicks "Mark as Renewed",
   **Then** an inline date picker appears enabling the user to update the expiration
   date for that domain.
3. **Given** a renewed domain, **When** the expiration date is updated past 30 days,
   **Then** the domain is removed from the panel.
4. **Given** no domains expiring within 30 days, **When** the dashboard loads,
   **Then** an "All clear — nothing expiring this month" message is displayed.
5. **Given** the panel, **When** the user clicks "View All", **Then** they navigate
   to `/domains?expiry=1m`.

---

### User Story 5 — Promotion Table (Priority: P2) [NEW]

Per US-017 in the master plan, the dashboard includes a "Domains to Promote This Week"
widget. Each ISO week, 10 domains are selected from the user's active portfolio.
Default pool: active domains expiring within 3 months. The user can change the pool
via a styled dropdown (1m/3m/6m/9m/All active). Selection is random but deterministic
per `(user_id, week_start)` — stored in the `promotions` table. On page load: check
if a batch exists for the current week; if not, generate and insert one.

Each row has a "Promote" button. Clicking it transitions the row into an inline
confirmation bar: "✓ Mark as promoted? [Yes] [Cancel]". Clicking Yes sets
`promoted_at = NOW()` and shows a green "Promoted ✓" badge. Clicking Cancel
collapses the confirmation. Already-promoted domains show the badge and no button.

**Why this priority**: Promotion tracking encourages users to actively market their
domains each week, increasing sales velocity.

**Independent Test**: Load dashboard on a fresh week. 10 domains are generated and
displayed. Change pool to "Expiring in 1 month" → list updates. Click "Promote" on
a domain → inline confirmation appears → click Yes → green "Promoted ✓" badge.
Reload page → promoted status persists. Verify empty state when pool has <10 domains.

**Acceptance Scenarios**:

1. **Given** a user with ≥10 active domains expiring within 3 months, **When** the
   dashboard loads, **Then** 10 domains are displayed in the promotion table for the
   current week.
2. **Given** the promotion pool dropdown, **When** the user changes to "Expiring in
   1 month" or "All active domains", **Then** a new batch of 10 domains is generated
   for the selected pool (replacing previous rows).
3. **Given** a promotion row, **When** the user clicks "Promote", **Then** an inline
   confirmation bar appears: "✓ Mark as promoted? [Yes] [Cancel]" — styled within
   the row.
4. **Given** the inline confirmation, **When** the user clicks "Yes", **Then**
   `promoted_at` is set, a green "Promoted ✓" badge replaces the button, and the
   confirmation collapses.
5. **Given** the inline confirmation, **When** the user clicks "Cancel", **Then**
   the confirmation bar collapses and the row returns to its normal state.
6. **Given** an already-promoted domain, **When** rendered, **Then** it shows the
   green "Promoted ✓" badge and no Promote button.
7. **Given** a promotion batch exists for the current week, **When** the page is
   reloaded, **Then** the same 10 domains appear (deterministic per week).
8. **Given** the selected pool has fewer than 10 domains, **When** the dashboard
   loads, **Then** an empty state message is shown: "Not enough active domains to
   fill a promotion list."

---

### User Story 6 — Portfolio Value Over Time (Priority: P2) [DONE]

Per US-018 in the master plan, the area chart showing cumulative portfolio value per
month is already implemented and functional. Toggle: last 12 months / all time.
Tooltip: date, count, total value. Empty state if fewer than 2 data points.

**Status**: **[DONE]** — no changes needed. Included for completeness.

---

### User Story 7 — Quick Stats Widget (Priority: P3) [UPDATED]

Per US-019 in the master plan, the right column quick stats widget shows: Average
price, **Most common Registrar** (updated from Most common TLD in v1), Oldest domain,
Newest domain, Total expired, Total earnings. On desktop (≥1024px), it appears in the
right sidebar column. On mobile (<1024px), it displays as a horizontal scroll row of
stat chips.

**Why this priority**: Quick stats provide supplementary portfolio data. The key
change is replacing "Most common TLD" with "Most common Registrar."

**Independent Test**: View dashboard on desktop → quick stats in right column showing
"Most common Registrar" (not TLD). Resize to mobile → stats as horizontal scroll chips.
Verify each stat shows correct value.

**Acceptance Scenarios**:

1. **Given** the quick stats widget on desktop, **When** the dashboard loads,
   **Then** stats include: Average price, Most common Registrar, Oldest domain,
   Newest domain, Total expired, Total earnings.
2. **Given** the quick stats widget, **When** "Most common Registrar" is displayed,
   **Then** it shows the registrar with the highest domain count in the portfolio
   (replacing the v1 "Most common TLD" stat).
3. **Given** the dashboard on mobile (<1024px), **When** the quick stats render,
   **Then** they appear as a horizontal scroll row of stat chips instead of a
   sidebar column.

---

## Requirements

### Functional Requirements

#### Deleted Components [DELETED]

- **FR-001**: [DELETED] The v1 Expiry Timeline 3-Month bar chart component and its
  associated query MUST be removed.
- **FR-002**: [DELETED] The v1 Expiry Timeline 6-Month toggle component and its
  associated query MUST be removed.
- **FR-003**: [DELETED] The v1 TLD Distribution Donut Chart component and its
  associated query MUST be removed.

#### KPI Cards [UPDATED]

- **FR-004**: [UPDATED] Dashboard MUST display 4 KPI cards: Total Domains, Portfolio
  Value, Expiring in 90 Days, Sold This Year.
- **FR-005**: [NEW] Each KPI card MUST have an icon, a large animated counter on load,
  a colored accent stripe on the left border, and a hover lift effect with shadow
  transition.
- **FR-006**: [NEW] KPI cards MUST be clickable: Total Domains → `/domains`, Expiring
  in 90 Days → `/domains?expiry=3m`, Sold This Year → `/sales`.
- **FR-007**: [NEW] KPI cards MUST show skeleton placeholders while data is loading.

#### Expiry Donut Chart [NEW]

- **FR-008**: [NEW] Dashboard MUST display a donut chart with 4 non-overlapping
  segments: ≤1 month (red), ≤3 months (amber), ≤6 months (yellow), ≤9 months (green).
  Counts are non-overlapping — a domain in ≤1m is only counted in that segment.
- **FR-009**: [NEW] Donut center MUST display the total active domain count.
- **FR-010**: [NEW] A legend MUST appear beside or below the chart showing each
  segment's color, label, count, and percentage.
- **FR-011**: [NEW] Hovering a segment MUST brighten it and show a tooltip listing
  domain names and their expiry dates for that window.
- **FR-012**: [NEW] Clicking a segment MUST navigate to `/domains?expiry=<window>`.
- **FR-013**: [NEW] If all segments are zero, an empty state message MUST appear.

#### Registrar Breakdown Chart [NEW]

- **FR-014**: [NEW] Dashboard MUST display a horizontal bar chart of active domains
  grouped by registrar, top 10 sorted by count descending.
- **FR-015**: [NEW] Each bar MUST have a hover tooltip showing registrar name, domain
  count, and percentage of total portfolio.
- **FR-016**: [NEW] Clicking a bar MUST navigate to `/domains?registrar=<name>`.
- **FR-017**: [NEW] Domains with null or empty registrar MUST be grouped under
  "Unknown".
- **FR-018**: [NEW] An empty state message MUST appear if no registrar data exists.

#### Critical Renewals Alert Panel [UPDATED]

- **FR-019**: [UPDATED] Dashboard MUST display up to 10 domains expiring within 30
  days, sorted by days remaining ascending. Each row shows a badge with days remaining.
- **FR-020**: [NEW] "Mark as Renewed" MUST open an inline date picker to update the
  domain's expiration date.
- **FR-021**: [NEW] "View All" MUST navigate to `/domains?expiry=1m` using the new
  URL param format.
- **FR-022**: [NEW] An "All clear" message MUST appear when no domains expire within
  30 days.

#### Promotion Table [NEW]

- **FR-023**: [NEW] Dashboard MUST display a "Domains to Promote This Week" widget
  showing 10 domains selected from the user's active portfolio.
- **FR-024**: [NEW] The selection pool MUST default to active domains expiring within
  3 months, with a dropdown to change to 1m, 6m, 9m, or All active.
- **FR-025**: [NEW] Selection MUST be deterministic per `(user_id, week_start)` and
  persisted in the `promotions` table. On load, if no batch exists for the current
  week, one is generated and inserted.
- **FR-026**: [NEW] Each row MUST have a "Promote" button. Clicking transitions the
  row into an inline confirmation bar: "✓ Mark as promoted? [Yes] [Cancel]".
- **FR-027**: [NEW] Clicking "Yes" MUST set `promoted_at = NOW()` and show a green
  "Promoted ✓" badge. Clicking "Cancel" must collapse the bar.
- **FR-028**: [NEW] Already-promoted domains MUST show the "Promoted ✓" badge with
  no button.
- **FR-029**: [NEW] An empty state message MUST appear if the selected pool has fewer
  than 10 domains.

#### Portfolio Value Chart [DONE]

- **FR-030**: [DONE] The existing area chart rendering cumulative portfolio value per
  month is already implemented. No changes required.

#### Quick Stats Widget [UPDATED]

- **FR-031**: [UPDATED] Quick stats widget MUST display "Most common Registrar"
  instead of the v1 "Most common TLD."
- **FR-032**: [NEW] On desktop (≥1024px), stats MUST appear in the right sidebar
  column. On mobile (<1024px), they MUST display as horizontal scroll chips.

### Key Entities

- **Promotion** [NEW]: Tracks weekly promotion batches. Attributes: user_id, domain_id,
  week_start (Monday date), promoted_at (null = pending, timestamp = confirmed).
  Lives in the `promotions` table (Migration 002). One domain can be promoted once
  per week (unique constraint on user_id, domain_id, week_start).
- **Domain** (existing): No schema changes. Used by KPI cards, donut chart, registrar
  chart, critical renewals panel, promotion table, and quick stats.
- **Sale** (existing): Used by "Sold This Year" KPI card and total earnings stat.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dashboard renders all KPI cards, charts, and panels within 2 seconds
  with no more than 4 Supabase queries.
- **SC-002**: Donut chart segments are visually distinct with correct non-overlapping
  counts for 100% of test portfolios.
- **SC-003**: Registrar chart shows correct descending order for portfolios up to
  50,000 domains.
- **SC-004**: Critical renewals panel correctly identifies 100% of domains expiring
  within 30 days.
- **SC-005**: Promotion table generates a deterministic, stable batch for the current
  week that persists across page reloads.
- **SC-006**: Inline confirmation for promotion completes in under 2 seconds with
  database persistence.
- **SC-007**: Dashboard is fully responsive: 2-column ≥1024px, single-column
  768–1023px, stacked cards <768px, per the master plan layout.
- **SC-008**: All v1 deleted components are fully removed with zero dead code
  references in the codebase.
- **SC-009**: Data migration 002 (promotions table) and 003 (registrar index) are
  applied and types regenerated.
- **SC-010**: The application builds with zero TypeScript errors and zero ESLint
  warnings.

## Assumptions

- Migration 002 (promotions table) and Migration 003 (registrar index) from the
  master plan are applied before Phase 3 implementation begins.
- Supabase types are regenerated after migrations to include the `promotions` table.
- The existing `lib/supabase/queries/dashboard.ts` can be extended or rewritten for
  the new queries. The v1 queries for deleted components are removed.
- Recharts is already installed and supports donut charts (`PieChart` with `innerRadius`).
- The promotion batch selection uses `Math.random()` seeded by `user_id + week_start`
  for deterministic but random-feeling selection.
- The "Mark as Renewed" date picker uses the native HTML date input or the existing
  date input pattern from the domain add form.
- The 4-query limit for dashboard rendering assumes combined/parallel Supabase
  requests (stats summary, expiry segments, registrar breakdown, promotions).
- All charts follow the Chart Interaction Standard from the master plan: custom
  tooltips, hover effects, animated entry, clickable navigation.
