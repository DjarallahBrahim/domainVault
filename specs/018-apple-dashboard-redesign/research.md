# Research: Current Dashboard Design Audit (Input to the Apple-Inspired Redesign)

**Branch**: `018-apple-dashboard-redesign` | **Date**: 2026-09-08

This document records what the current design does today, why it falls short of the Apple design language, and which files carry each problem. It is the evidence base for the spec's user stories and requirements. Findings are grouped from a full survey of `components/dashboard/`, `components/layout/`, `components/ui/`, `app/globals.css`, `tailwind.config.ts`, and `app/layout.tsx`.

## Summary Judgement

The dashboard reads as **a wall of ~20 equal-weight, border-boxed cards**. Apple hierarchy comes from materials, spacing and type weight; here hierarchy is flattened because every widget uses the same bordered box, the same `text-sm font-semibold` title, and the same uniform `space-y-6` rhythm. Motion is fixed-duration CSS hover effects (no springs, no press feedback, no reduced-motion handling anywhere in the repo). Type uses two Google webfonts with fixed tracking. Several shadcn colour tokens are undefined, so some primitives render inert.

---

## 1. The card recipe is copy-pasted ~24 times

The container string `rounded-xl border border-border bg-bg-surface p-6` (optionally with `shadow`) appears across the dashboard, landing, showcase and tools. A `Card` primitive with this exact base already exists (`components/ui/card.tsx:8` — `rounded-xl border border-border bg-bg-surface text-text-primary shadow`) but is used in only one place (`components/shared/supabase-error-boundary.tsx`). The dashboard widgets hand-roll the wrapper instead, and repeat it again inside their own loading and empty states with the same title markup.

Affected: `dashboard-revenue-chart.tsx`, `dashboard-spend-sold-chart.tsx`, `dashboard-sales-leaderboard.tsx`, `dashboard-platform-breakdown.tsx`, `dashboard-promotion-section.tsx`, `dashboard-critical-renewals.tsx`, `dashboard-expiry-donut.tsx`, `dashboard-month-snapshot.tsx`, `dashboard-quick-stats.tsx`.

## 2. Title/header pattern duplicated 17+ times

`<h3 className="text-sm font-semibold mb-4">…</h3>` (or the `flex items-center justify-between mb-4` variant when a header action exists) repeats in every widget above. This is the natural seam for a `WidgetCard` header slot.

## 3. Recharts tooltip markup is byte-identical and drifting

`dashboard-revenue-chart.tsx`, `dashboard-spend-sold-chart.tsx`, `dashboard-platform-breakdown.tsx` and `dashboard-expiry-donut.tsx` all define `content={…}` inline returning the same raw `<div className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm shadow-lg">`. `dashboard-value-chart.tsx` drifts from the pattern with a hard-coded dark tooltip (`backgroundColor:"#1a1a24"`, `border:"1px solid #1e1e2e"`) that is **invisible/broken in light mode** — direct evidence of copy-paste drift.

## 4. Hex vs CSS-variable tokens are mixed even within a single file

- `dashboard-revenue-chart.tsx` uses `fill="var(--accent-primary)"` / `var(--accent-success)` for some series but hard-codes `#f59e0b` for the sales-count series in three places (legend swatch, tooltip inline `style`, `Bar fill`).
- `dashboard-platform-breakdown.tsx` defines a raw rainbow palette: `["#6366f1","#818cf8","#a5b4fc","#8b5cf6","#a78bfa","#22d3ee","#67e8f9","#10b981","#34d399","#f59e0b"]`.
- `dashboard-expiry-donut.tsx` defines `["#ef4444","#f59e0b","#eab308","#10b981","#94a3b8"]`.
- `components/layout/sidebar-footer.tsx` and `dashboard-value-chart.tsx` duplicate a hard-coded 8-colour avatar/categorical palette.
- Same colour is written three different ways across the app: `text-accent-primary` (class), `bg-[var(--accent-primary)]` (arbitrary value), and `style={{color:"#f59e0b"}}` (inline).
- Amber `#f59e0b` approximates `accent-warning` only in dark mode (`--accent-warning` is `#d97706` in light, `#f59e0b` in dark).

## 5. Undefined shadcn tokens → inert primitives (latent bugs)

`components/ui/badge.tsx`, `components/ui/skeleton.tsx`, `components/ui/checkbox.tsx` and the sonner theme reference `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-destructive`, `text-destructive-foreground` — none of which are defined in `app/globals.css` or `tailwind.config.ts` (the theme renames everything to `accent-*`, `bg-surface`, etc.). Consequences:
- `Skeleton` base background (`bg-primary/10`) does not resolve → skeletons depend on `animate-pulse` only and can look wrong.
- Only the `outline` variant of `Badge` maps to a real token; `default`/`secondary`/`destructive` variants are broken. Dashboard call sites work around this by passing `variant="outline"` plus a full className tint.

## 6. Typography

- Fonts: `Syne` (display) + `DM Sans` (body) via `next/font/google` in `app/layout.tsx`, `JetBrains Mono` for `code/pre/kbd` in `app/globals.css` (`@layer base`). Global rule `h1–h6 { font-family: var(--font-syne) }`.
- Page `<h1>` is only `text-2xl` (`app/(dashboard)/dashboard/page.tsx:41`, duplicated at :33 for the empty state). No large-title treatment, no size-specific tracking/leading anywhere.
- No tabular numerals for figures; numbers jitter in animated counters and columns.

## 7. Motion is fixed-duration, hover-centric, and non-adaptive

- KPI counters: linear `setInterval` stepping in `dashboard-kpi-cards.tsx` (`AnimatedCounter`, steps=20 @ 25ms) — no easing, no reduced-motion fallback.
- Cards: `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg` (KPI cards, month snapshot cells). Promotion section uses `transition-all duration-300 ease-in-out` cross-fade/slide and a `w-0 overflow-hidden` collapse trick.
- No `:active`/pointer-down press feedback anywhere. Active states are pure class swaps on hover.
- `RefreshCw` spins via `animate-spin`; skeletons via `animate-pulse`.
- **Zero matches** for `prefers-reduced-motion`, `motion-reduce`, or `motion-safe` across the entire repo.
- Recharts entry animation is `animationDuration={600}` per chart (not centralized, not disabled under reduced motion).

## 8. Segmented / toggle controls are hand-rolled and inconsistent

Same active/inactive idiom appears in four places with slightly different padding/radius: revenue range buttons (12M/24M/All), leaderboard ROI toggle, promotion filter chips, and a search-mode toggle. Active = `bg-accent-primary text-white border-accent-primary`; inactive = `border-border text-text-muted hover:text-text-primary`. None expose `role="group"`/`aria-pressed`; two simultaneous "active" fills can appear; no sliding thumb.

## 9. Tables and pills are split three ways

- Tables: (a) hand-rolled `<table>` in `dashboard-sales-leaderboard.tsx` and `dashboard-promotion-section.tsx`; (b) shared `ui/table` primitives in `dashboard-expiring-table.tsx` / `dashboard-expired-table.tsx`; (c) semantic `<tr>` in `components/ui/promotion-row.tsx`. Header/border/hover conventions vary (`border-border` vs `border-border/50`, `hover:bg-bg-elevated/30`).
- Badges/pills: `DomainStatusBadge`, `DomainExpiryBadge`, critical-renewals inline `<span>` and promotion confirm strip all re-implement the same `bg-{accent}/10 text-{accent} border-{accent}/20` tint pill. `DomainExpiryBadge` breaks the pattern with raw Tailwind `bg-yellow-500/10 text-yellow-600` for one band.
- Domain link convention `font-mono text-sm text-accent-primary hover:underline` repeats in expiring/expired/critical/leaderboard/promotion.

## 10. Theming & structure details

- `globals.css`: `* { @apply border-border }` gives every element a default 1px border (shadcn convention) — the single biggest driver of the "everything is boxed" look.
- Radius mismatch: cards use `rounded-xl` (0.75rem hard value); the token radius is 0.5rem and is effectively ignored by the dominant card style.
- Shadows: dashboard cards have none; only Card, buttons (`shadow`/`shadow-sm`), tooltips (`shadow-lg`) and landing/showcase cards use shadows. No elevation scale.
- Layout: `dashboard-client.tsx` is `space-y-6` with one `grid lg:grid-cols-3` row, charts stacked full-width, and a final `lg:grid-cols-2` row — uniform rhythm, every widget equal weight. Widgets actually mounted on `/dashboard`: KpiCards, MonthSnapshot, ExpiryDonut, PromotionSection, CriticalRenewals, QuickStats, RevenueChart, SpendSoldChart, SalesLeaderboard, PlatformBreakdown (`components/dashboard/dashboard-client.tsx:67-92`).
- Chrome: sidebar (`components/layout/sidebar.tsx`) is opaque `bg-bg-surface` with `border-r`, active item `bg-accent-primary/10 text-accent-primary`; bottom tab bar is an opaque `md:hidden fixed bottom-0 h-16 border-t bg-bg-surface`. Neither uses translucency.
- Accessibility: focus styling exists on `ui/button.tsx` (`focus-visible:ring-1 ring-ring`) but dashboard hand-rolled controls/segmented chips generally lack visible focus and `aria-pressed`.

## Design Language Target (summary of the fix direction)

Apple side of the comparison, per the `apple-design` skill:

| Current | Apple target |
|---|---|
| Borders ring every element (`* { border-border }`) | Hairlines + whitespace + material separation; borders removed from whole cards |
| Opaque chrome boxes | Translucent `backdrop-filter` materials floating over content |
| 5–10 raw-hex chart palettes | Token/constants-driven series colours; one accent + neutrals |
| Indigo as large saturated fills | System accent used sparingly for interactivity/selection |
| Fixed `space-y-6`, equal-weight cards | Sectioned hierarchy: hero band → health group → performance group |
| Syne/DM Sans webfonts, fixed tracking | System stack, weight/size/tracking set per size |
| Linear counter, CSS hover transitions | Springs, pointer-down press feedback, interruptible motion |
| No reduced-motion anywhere | `prefers-reduced-motion`/`-transparency`/`-contrast` handled in every animated component |
| 24× duplicated wrapper + tooltips + segmented logic | `WidgetCard`, `ChartTooltip`, `Segmented`, `StatValue`, fixed `Badge`/`Skeleton` |
