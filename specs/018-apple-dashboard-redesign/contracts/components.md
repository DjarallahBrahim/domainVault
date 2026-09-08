# Component Contracts: Apple-Inspired Dashboard Redesign

**Date**: 2026-09-08 | **Feature**: `018-apple-dashboard-redesign`

Contracts below are organized in two tiers: **shared primitives** (new/edited in `components/ui/`, consumed app-wide later) and **dashboard widgets** (edited in place under `components/dashboard/`). Data flow is unchanged everywhere; only props that shape presentation are shown where a widget contract is impacted.

## Tier 1 — Shared Primitives

### WidgetCard

Section shell that replaces the ~24 copy-pasted `rounded-xl border border-border bg-bg-surface p-6` wrappers. Renders its own loading and empty states so widgets stop duplicating the wrapper + title in three branches.

```tsx
interface WidgetCardProps {
  title: string;
  description?: string;            // small muted line under title
  action?: React.ReactNode;        // right-aligned header action (e.g. <Segmented>, link)
  loading?: boolean;               // show skeleton body (label stays visible)
  empty?: boolean;                 // show standardized empty body
  emptyMessage?: string;
  children?: React.ReactNode;
  className?: string;
}

<WidgetCard title="Revenue Over Time" action={<Segmented … />} loading={isLoading}>
  <RevenueChartBody />
</WidgetCard>
```

**Behavior**: wrapper uses token surface + soft radius + elevation (not a full stroke ring); header renders title (17px semibold) + optional `action`; `loading` shows in-shell skeleton; `empty` shows `emptyMessage` centered with muted styling. No widget should need to hand-roll its shell again.

---

### Segmented

Apple-style mutually exclusive control with ONE sliding thumb (spring-driven) instead of N active-filled buttons.

```tsx
interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  size?: "xs" | "sm";
  className?: string;
  "aria-label"?: string;
}

<Segmented
  options={[{ value: "12m", label: "12M" }, { value: "24m", label: "24M" }, { value: "all", label: "All" }]}
  value={range}
  onChange={setRange}
  aria-label="Revenue range"
/>
```

**Behavior**: container is a rounded translucent/tinted track; the active thumb animates between options with a spring (`lib/motion.ts`); options carry `aria-pressed` and are keyboard-arrow navigable within `role="group"`; thumb position uses `motion` `layout` so it slides, not re-fills. Replaces the hand-rolled chips in the revenue chart (12M/24M/All), leaderboard (Top / Best ROI), and promotion pool filters.

---

### StatValue

A label + big tabular number for the hero band and mini-stat surfaces. Owns counter + reduced-motion behavior so KPI logic isn't repeated.

```tsx
interface StatValueProps {
  label: string;
  value: number;
  format?: (n: number) => string;  // default: toLocaleString("en-US")
  prefix?: string;                 // "$"
  suffix?: string;
  sub?: string | null;             // muted supporting line, e.g. "(N all expiring)"
  accent?: "primary" | "success" | "warning" | "danger" | null;
  href?: string;                   // renders <Link> with chevron affordance
  loading?: boolean;
}

<StatValue label="Total Domains" value={42} prefix="$" href="/domains" loading={isLoading} />
```

**Behavior**: number rendered `tabular-nums`; counts up on a spring from 0 on mount/value-change when motion allowed, jumps to final value under `prefers-reduced-motion`; `loading` renders an in-cell skeleton; `href` wraps in `Link` and shows a chevron. Replaces `AnimatedCounter` in `dashboard-kpi-cards.tsx` and the per-card markup in `dashboard-month-snapshot.tsx`.

---

### ChartTooltip

The single material tooltip used by every Recharts `content={…}`.

```tsx
interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  rows: Array<{ label: string; value: React.ReactNode; swatch?: string; hint?: string }>;
  footnote?: React.ReactNode;
}
// Used via: <Tooltip content={<ChartTooltip rows={…} />} />
```

**Behavior**: translucent material background (`backdrop-filter` blur + token surface), token border/shadow, resolves correctly in light AND dark (fixes the current hard-coded `#1a1a24` tooltip that breaks light mode); swatches optional; auto-renders null when inactive. Rows derive series colour from `lib/theme/chart-colors.ts`.

---

### Badge (edited) · Skeleton (edited) · Card (edited)

```tsx
// Badge: variants now resolve to defined tokens; tint pills are consolidated here
//   variant: "default" | "success" | "warning" | "danger" | "neutral" | "outline"
//   → each = bg-{token}/10 text-{token} border-{token}/20 (replaces inline span pills)
<Badge variant="danger">≤7d</Badge>

// Skeleton: bg resolves to a defined token (currently inert bg-primary/10)
<Skeleton className="h-8 w-20" />

// Card: base aligned to token surface/radius/shadow (no stroke-ring-everything)
<Card className={...}><CardContent>…</CardContent></Card>
```

**Behavior**: `Badge` default/secondary/destructive variants no longer reference undefined `bg-primary`/`bg-secondary`/`bg-destructive` tokens. `DomainStatusBadge`, `DomainExpiryBadge`, critical-renewal pills and promotion confirm strip migrate onto the fixed `Badge` variants.

---

## Tier 2 — Dashboard Widgets

### DashboardClient (restructure only)

```tsx
<DashboardClient initialStats initialSegments initialExpiringDomains initialQuickStats />
```

**Behavior change**: renders grouped sections (global stats → month snapshot → portfolio health → performance) and wraps each in the shared entrance stagger. **No prop or data-flow change.**

### Global stats (`DashboardGlobalStats`) + Month snapshot (`DashboardMonthSnapshot`)

```tsx
<DashboardGlobalStats stats={stats} />          // 5 tinted stat cards (icons + accent figures)
<DashboardMonthSnapshot />                      // titled "<Month> Snapshot" card w/ 3 tinted cells
```

**Behavior**: the KPI row and the current-month snapshot are two separate colour-anchored blocks (see `StatCard`). Preserved click targets (`/domains`, `/domains?expiry=3m`, `/sales`). Each stat uses the spring count-up with reduced-motion fallback.

### Donut / Critical / Promotion / QuickStats

All migrate to `WidgetCard` shells and existing props (`segments`, `domains`, `selectedPool`, `quickstats`); donut + charts adopt `ChartTooltip` and token palettes. Promotion pool chips → `Segmented`. Urgency labels → `Badge` variants.

### Revenue / SpendSold / Leaderboard / Platform

Chart widgets adopt: `WidgetCard` shell, `Segmented` range/sort controls, `ChartTooltip`, series colours from `lib/theme/chart-colors.ts`, hairline-or-no grid, soft-rounded bars (`radius={[6,6,0,0]}`-family from a shared constant). Data fetching hooks and query keys unchanged.

### Dashboard empty / page header

`app/(dashboard)/dashboard/page.tsx` and `components/dashboard/dashboard-empty-state.tsx` adopt the large-title type treatment and material styling; empty state keeps its single primary action and CTA copy.

---

## Verification Notes

- New primitives are unit-verifiable in isolation (render on an existing page or the error-boundary Card usage).
- Every changed file: run `npm run lint` and `npx tsc --noEmit`.
- Visual QA: both themes; 375 / 768 / 1024 / 1920px; OS reduce-motion on/off; keyboard walk of segmented controls and stat links.
