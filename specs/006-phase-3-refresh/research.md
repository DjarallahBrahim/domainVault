# Research: Phase 3 Refresh — Dashboard & Analytics

**Date**: 2026-05-24

## Decisions

### 1. Donut Chart Implementation

**Decision**: Use Recharts `<PieChart>` with `innerRadius` prop for the donut shape.
4 `<Pie>` segments with `startAngle`/`endAngle` computed from non-overlapping
counts. Custom `<Tooltip>` renders domain names and expiry dates. Custom `<Label>`
in the center shows total count.

**Rationale**: Recharts is already installed and used by the existing dashboard
charts. `PieChart` supports donut via `innerRadius`. The non-overlapping segments
require pre-computing counts per window on the server.

**Alternatives considered**:
- D3.js — overkill; Recharts handles donut charts well.
- chart.js — would add another chart library when Recharts is already integrated.

### 2. Registrar Bar Chart

**Decision**: Use Recharts `<BarChart>` with `layout="horizontal"`. Data pre-sorted
by count descending on the server, top 10. Custom `<Tooltip>` shows registrar name,
count, percentage.

**Rationale**: Same pattern as the existing TLD Distribution chart (being deleted),
but with registrar dimension and horizontal layout per master plan. Recharts
`<BarChart>` supports horizontal layout natively.

### 3. Promotion Batch Generation

**Decision**: Server-side generation on dashboard load. Check if a batch exists for
`(user_id, DATE_TRUNC('week', CURRENT_DATE))`. If not, query eligible domains from
the selected pool, shuffle deterministically using a seed hash of `user_id + week_start`,
pick 10, insert into `promotions` table with `promoted_at = NULL`.

**Rationale**: Deterministic selection ensures the same batch on every page load
within the same week. The `promotions` table provides persistence and auditability.
Server-side generation avoids client-side randomness issues with SSR.

**Seed function**: `hash(user_id + week_start)` → sort domains by `md5(domain + seed)`
→ take first 10. This produces a random but stable ordering per week.

**Alternatives considered**:
- Client-side generation — fails SSR; would need `useEffect` and cause layout shift.
- `ORDER BY RANDOM()` in Postgres — not deterministic; different results per query.

### 4. Pool Selector

**Decision**: A styled `<Select>` dropdown that changes the expiry window filter
for the promotion pool. On change, delete existing rows for the current week and
re-generate a batch from the new pool. Optimistic UI update via TanStack Query.

**Rationale**: The master plan specifies a dropdown with 5 options. Changing the
pool effectively replaces the batch — this is a write operation that should go
through TanStack Query `useMutation`.

### 5. Inline Promotion Confirmation

**Decision**: Row-level state management (`useState` per row or a `Set` of confirming
IDs). Clicking "Promote" sets that row's confirming state. The confirmation bar is
rendered inline below the domain name within the same row. Clicking "Yes" calls
`updatePromotion(id, { promoted_at: new Date().toISOString() })`. Clicking "Cancel"
clears the confirming state.

**Rationale**: No dialog/modal — the master plan explicitly specifies an inline
confirmation bar within the row. This keeps the user in context and avoids the
overhead of a dialog for a simple boolean toggle.

### 6. KPI Card Animations

**Decision**: CSS `@keyframes` for the counter animation on mount. Use `useEffect`
to trigger a count-up from 0 to the target value over ~500ms. Hover lift via
Tailwind `hover:scale-[1.02] hover:shadow-lg transition-all`.

**Rationale**: No animation library needed. CSS transitions handle hover lift.
Counter animation is a simple interval-based increment that's performant and
doesn't require `requestAnimationFrame`.

### 7. Query Optimization — ≤4 Queries

**Decision**: Combine stats into a single query. 4 total queries:
1. Stats summary (total_active, portfolio_value, expiring_90d, expiring_30d, sold_this_year)
2. Donut segments (exp_1m, exp_3m, exp_6m, exp_9m)
3. Registrar breakdown (top 10 + counts)
4. Current week promotions (join domains)

All 4 run in parallel via `Promise.all` in the server component.

**Rationale**: The master plan explicitly caps at 4 queries. Combining stats into
one query with `FILTER` clauses avoids N+1.
