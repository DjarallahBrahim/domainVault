# Research: Phase 3 — Dashboard & Analytics

**Date**: 2026-05-22

## Overview

Phase 3 introduces four new concerns not present in Phase 1/2:
1. **Recharts integration** with Next.js server components
2. **Aggregate queries** — counting, summing, grouping domains
3. **Server-side auto-transition** — idempotent status update
4. **Chart responsiveness** — Recharts across 375px–1920px

All decisions are constrained by the constitution: server components by default,
Recharts for charts, indexes on expiration_date/status, no Route Handlers.

---

## 1. Dashboard Data Fetching Strategy

### Decision: Server component with SSR + optional TanStack Query hydration

**Rationale**: The dashboard is the landing page — it must load fast (SC-001: <2s).
A server component fetches all aggregate data (counts, sums, grouped data) at request
time via Supabase. This avoids client-side waterfall requests. For optional
interactivity (e.g., toggling time range on expiration chart), TanStack Query can
re-fetch updated aggregates without a full page reload.

**Implementation pattern**:
```
Server component → fetch dashboard aggregates → render cards + charts →
optional client component wrapper for interactive features
```

**Aggregate queries**: Supabase `.select()` with PostgREST features:
- Count: `select("*", { count: "exact", head: true })` with filters
- Sum: `select("purchase_price")` + client-side reduce
- Group by TLD: `select("tld, status, expiration_date, purchase_price")` +
  client-side grouping with Map/Reduce
- Since Supabase doesn't support SQL `GROUP BY` through the client directly,
  client-side aggregation is used for the predictable data volumes (≤50k domains)

**Alternatives considered**:
- **Supabase `.rpc()` with PostgreSQL function**: Requires a migration and
  `service_role` for function creation. Unnecessary complexity for simple aggregations.
- **Supabase `.select()` with `or`/`in` filters**: Already used for expiring-soon query.
- **Client-side fetch only**: Violates constitution — server components must be default.

---

## 2. Recharts Integration

### Decision: Recharts v2 with ResponsiveContainer for responsive charts

**Rationale**: Recharts is the constitution-mandated charting library. It provides
React components for bar charts, pie charts, and line charts. `ResponsiveContainer`
handles width responsiveness automatically.

**Chart components**:
- **TLD Distribution**: `<BarChart>` with `<Bar>` per TLD, TLD on X-axis, count on Y-axis
- **Expiration Timeline**: `<BarChart>` with months on X-axis (Jan–Dec), domain count on Y-axis
- **Value Distribution**: `<BarChart>` with TLD on X-axis, total value on Y-axis

**Responsive behavior**:
- Desktop (≥1024px): Full-size charts, 2-column grid
- Tablet (768–1023px): Single column, reduced chart height
- Mobile (<768px): `ResponsiveContainer` handles width; height set to 200px

**Theme colors**: Charts use the constitution CSS variables:
- `--accent-primary` (#6366f1) for primary bars
- `--accent-success` (#10b981) for active/healthy indicators
- `--accent-warning` (#f59e0b) for expiring-soon indicators
- `--accent-danger` (#ef4444) for expired indicators

**Recharts caveat**: Recharts components are client-only (`"use client"`). Chart
components must be separate client components while the dashboard page shell
remains a server component. Data is passed as props from server to client.

**Alternatives considered**:
- **Chart.js**: Not constitution-mandated; heavier bundle.
- **Nivo**: More modern but not constitution-mandated.
- **Server-rendered SVG charts**: No standard library for React server components;
  would require custom SVG generation.

---

## 3. Auto-Transition Strategy

### Decision: Server-side `UPDATE` query on dashboard load, idempotent

**Rationale**: The spec requires domains with past expiration dates to transition
from "active" to "expired" automatically. The simplest approach: when the dashboard
page loads (server component), execute one `UPDATE` query:

```sql
UPDATE domains
SET status = 'expired'
WHERE user_id = auth.uid()
  AND status = 'active'
  AND expiration_date < CURRENT_DATE
```

This is idempotent — running it multiple times only affects domains that still
need transition. No cron job, no background worker. The update happens before
fetching dashboard data, so counts reflect the updated statuses.

**RLS compatibility**: The Supabase client respects RLS, so `UPDATE` only affects
the authenticated user's rows. The `UPDATE` is an admin action on the user's own
data — no `service_role` needed.

**Performance**: Single `UPDATE` with indexes on `user_id`, `status`, and
`expiration_date` → sub-second execution even with thousands of domains.

**Alternatives considered**:
- **Client-side transition on every page load**: Would require updating individual
  rows → N queries, violates constitution batch requirement.
- **Database trigger**: Requires a migration to add a trigger. More robust but adds
  schema complexity for a simple operation.
- **Cron job / Edge Function**: Overkill for a single-user portfolio app. Adds
  infrastructure dependency.

---

## 4. Client-Side Data Aggregation

### Decision: Map/Reduce on domain rows for chart grouping

**Rationale**: Supabase PostgREST doesn't support SQL `GROUP BY` through the JS
client. For the data volumes in Phase 3 (≤50k domains), client-side aggregation is
fast and simple.

**Aggregation patterns**:

**TLD Distribution**:
```typescript
const tldCounts = new Map<string, number>();
for (const d of domains) {
  tldCounts.set(d.tld, (tldCounts.get(d.tld) ?? 0) + 1);
}
// Group TLDs with <3 into "Other"
```

**Expiration Timeline** (12 months):
```typescript
const monthly = new Array(12).fill(0);
for (const d of domains) {
  const date = new Date(d.expiration_date);
  const now = new Date();
  const monthDiff = (date.getFullYear() - now.getFullYear()) * 12 +
    (date.getMonth() - now.getMonth());
  if (monthDiff >= 0 && monthDiff < 12) {
    const idx = (now.getMonth() + monthDiff) % 12;
    monthly[idx]++;
  }
}
```

**Value by TLD**:
```typescript
const tldValues = new Map<string, number>();
for (const d of domains) {
  if (d.purchase_price && d.purchase_price > 0) {
    tldValues.set(d.tld, (tldValues.get(d.tld) ?? 0) + d.purchase_price);
  }
}
```

**Dashboard counts**:
```typescript
const total = domains.length;
const active = domains.filter(d => d.status === 'active').length;
const expiringSoon = domains.filter(d =>
  d.status === 'active' &&
  daysUntil(d.expiration_date) <= 30 &&
  daysUntil(d.expiration_date) > 0
).length;
const portfolioValue = domains
  .filter(d => d.purchase_price && d.purchase_price > 0)
  .reduce((sum, d) => sum + (d.purchase_price ?? 0), 0);
```

---

## 5. Summary Cards Pattern

### Decision: shadcn/ui Card with icon + value + label layout

**Layout**: Each summary card is a `<Card>` with:
- Icon (Lucide React) in top-left or left
- Large number (value)
- Small label below

**Cards**:
| Card | Icon | Value | Color |
|------|------|-------|-------|
| Total Domains | `Globe` | domain count | text-primary |
| Active | `CheckCircle2` | active count | accent-success |
| Expiring Soon | `AlertTriangle` | ≤30d count | accent-warning |
| Portfolio Value | `DollarSign` | $ sum | accent-primary |

**Grid layout**: `grid grid-cols-2 lg:grid-cols-4 gap-4` — 2 columns on mobile,
4 columns on desktop.

---

## 6. Expiring Soon Table

### Decision: shadcn/ui Table with computed days-remaining column

**Query**: Filter domains where `status = 'active'` AND `expiration_date`
between today and today + 90 days.

**Columns**: Domain name, TLD, expiration date (formatted), days remaining,
expiry badge, view link.

**Sorting**: Already sorted by expiration_date ASC via query.

**Empty state**: "No domains expiring soon — your portfolio is in good shape."

---

## 7. Chart Colors Mapping

Charts use the constitution design tokens via CSS variables. Since Recharts renders
SVG elements, colors are injected as inline styles referencing the CSS custom properties
or as direct hex values.

**Palette for multi-TLD charts**: When charting multiple TLDs, use a rotating palette
derived from the constitution accent colors:

```typescript
const chartColors = [
  "#6366f1", // accent-primary
  "#10b981", // accent-success
  "#f59e0b", // accent-warning
  "#ef4444", // accent-danger
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];
```

---

## 8. No New Dependencies

Phase 3 adds only one new package:

| Package | Version | Purpose |
|---|---|---|
| `recharts` | ^2 | Bar charts for TLD distribution, expiration timeline, value distribution |

All other dependencies (TanStack Query, shadcn/ui, date-fns, Supabase) already exist
from Phase 1/2.

---

## Summary of Key Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| Chart library | Recharts v2 | Constitution-mandated |
| Data fetching | Server component + client hydration | Fast initial load; interactive optional |
| Aggregations | Client-side Map/Reduce on domain rows | PostgREST lacks GROUP BY; data volume is manageable |
| Auto-transition | Server-side idempotent UPDATE | Single query; no cron/infra; respects RLS |
| Chart responsiveness | Recharts ResponsiveContainer | Automatic width handling; height adjusted per breakpoint |
| TLD grouping | <3 domains → "Other" | Prevents chart clutter per spec FR-015 |
| Summary cards | shadcn/ui Card grid | Consistent with existing design system |
| Expiring table | shadcn/ui Table with date-fns | Consistent with domain list table pattern |
