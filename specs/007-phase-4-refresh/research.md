# Research: Phase 4 Refresh — Sales Analytics on Dashboard

**Date**: 2026-05-24

## Decisions

### 1. Revenue Chart — Bar + Cumulative Line

**Decision**: Use Recharts `<ComposedChart>` with `<Bar>` for monthly revenue and
`<Line>` on a secondary Y-axis for cumulative total. Toggle buttons for 12M/24M/All
time range. Data pre-computed on the server with cumulative values.

**Rationale**: `<ComposedChart>` supports mixed bar + line with dual Y-axes natively.
Cumulative values computed in the query to avoid client-side re-computation on toggle.
Zero-height bars for months with no sales handled by `minPointSize={1}` on the Bar.

**Alternatives considered**:
- Two separate charts — no overlaid cumulative line; misses the requirement.
- Client-side cumulative calculation — doable but adds complexity; server pre-compute is cheaper.

### 2. Leaderboard Table

**Decision**: Use a styled `<table>` with shadcn/ui patterns (not the Table component
since the leaderboard is compact). Rows are clickable to expand for ROI detail.
Single expanded row state via `useState<number | null>`. Re-sort toggle between
"sale price desc" and "ROI % desc" via local state.

**Rationale**: The Table component from shadcn/ui adds unnecessary complexity for a
simple 5-10 row list. A compact custom table with inline expansion keeps the widget
dense and readable.

**Alternatives considered**:
- Dialog/modal for ROI detail — adds an extra click; inline expansion is faster.
- shadcn/ui Table — heavier markup; leaderboard is a simple list, not a data table.

### 3. Platform Breakdown

**Decision**: Horizontal bar chart using Recharts `<BarChart layout="horizontal">`
(same pattern as Registrar Breakdown). Platform names on Y-axis, total revenue on
X-axis. Tooltip shows: platform, sales count, total revenue, avg sale price.

**Rationale**: Same chart pattern already proven in the Registrar Breakdown widget.
Consistent look and feel across the dashboard. Platform data aggregated server-side.

**Alternatives considered**:
- Table format — works but a bar chart is more visual and scannable for revenue
  comparison across platforms.
- Vertical bars — less readable for platform names (long labels get truncated).

### 4. Query Design

**Decision**: Add `fetchSalesAnalytics()` to `dashboard.ts` (server) and
`dashboard-client.ts` (client). Returns all sales data needed for all 3 widgets in
one query to minimize round trips:

```typescript
SELECT
  s.sale_price, s.sold_at, s.platform, s.buyer, s.notes,
  d.domain, d.purchase_price,
  (s.sale_price - COALESCE(d.purchase_price, 0)) AS profit,
  d.created_at
FROM sales s
LEFT JOIN domains d ON s.domain_id = d.id
WHERE s.user_id = auth.uid()
ORDER BY s.sold_at DESC;
```

Revenue chart: aggregate by month on the server or client (client is simpler for
the toggle range). Leaderboard: sort by price/ROI % client-side. Platform: aggregate
by platform client-side.

**Rationale**: One query fetches all data; client-side aggregation for charts avoids
multiple queries with different GROUP BY clauses. The sales table is small enough
(<10K rows typical) that client-side aggregation is performant.

**Alternatives considered**:
- Separate queries per widget — more HTTP round trips; violates the ≤2 query budget.
- SQL GROUP BY for each chart — cleaner but requires 3 queries; adds DB load.

### 5. Hold Duration Calculation

**Decision**: Use `diffDays(sold_at, created_at)` where `created_at` is the domain's
creation timestamp. Display format: "X days / Y months." If `created_at` is missing,
show "—".

**Rationale**: `created_at` represents when the domain was added to the portfolio
(proxy for purchase date). No dedicated `purchase_date` column exists in the schema.

### 6. Dashboard Layout Integration

**Decision**: Add a new row below the existing 3-column layout. Revenue chart spans
full width on desktop. Leaderboard and Platform breakdown sit side by side below it.

**Rationale**: Adding below existing content is the least invasive — no need to
restructure existing widgets. Full-width revenue chart makes the bar chart legible
with 12+ months of data.
