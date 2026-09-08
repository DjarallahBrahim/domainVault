# Implementation Plan: Apple-Inspired Dashboard Redesign

**Branch**: `018-apple-dashboard-redesign` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: User request to redesign the `/dashboard` to Apple's design language; analysis in [research.md](./research.md); direction decisions locked in `spec.md`.

## Summary

A presentation-only redesign of the `/dashboard` route and its shared app shell to Apple's design language, executed as an **aggressive rethink**. Four confirmed decisions drive everything: (1) dashboard first, other pages after; (2) aggressive restructure, not a re-skin; (3) add the `motion` package for spring physics; (4) move to the platform system font stack.

Work splits into a **shared foundation** (design tokens, fonts, new primitives — reusable by later page rollouts), the **app-shell chrome** (translucent sidebar + floating tab bar), the **dashboard restructure + restyle** (sections, materials, type, data-viz), and a final **feedback/a11y/verification** pass. No data query, hook, route, or schema changes. The only new dependency is `motion`.

## Technical Context

**Language/Version**: TypeScript strict, React 18, Next.js 14+ App Router, Tailwind CSS v3

**Primary Dependencies**: shadcn/ui primitives, TanStack Query v5 (data flow untouched), Recharts (chart styling only), Lucide React, **new: `motion`** (springs / reduced-motion hook), next-themes, sonner

**Storage**: None — no migrations, no schema, no new queries. All data fetching in `dashboard-client.tsx` and the server page stays byte-for-byte identical in behaviour.

**Testing**: `npm run lint` + `npx tsc --noEmit` + manual visual QA checklist (light/dark, 375–1920px, keyboard, reduced-motion). Chart/theme changes verified in both themes (current hard-coded tooltips break light mode).

**Target Platform**: Web (Vercel) — responsive 375px → 1920px

**Project Type**: Web application — Next.js App Router; client components for the motion/animation layer

**Performance Goals**: No net-new render cost; removing two Google webfonts lowers page weight; motion kept on compositor-friendly `transform`/`opacity`; counters settle exactly on final values; no layout shift worse than today.

**Constraints**: Presentation-only. Zero changes to `lib/supabase/**`, `app/api/**`, hooks, or data model. `Recharts` stays. The weekly promotion flow is untouched (widget presentation only). Reduced-motion / reduced-transparency / contrast preferences are respected everywhere (the repo currently has **zero** `prefers-reduced-motion` handling — this is a correctness gap the redesign fixes).

**Scale/Scope**: 1 dependency; token/type-scale rework in `globals.css` + `tailwind.config.ts`; font change in `app/layout.tsx`; ~6 new/updated shared primitives in `components/ui/`; 2 shell components restyled; ~10 dashboard widgets restructured/restyled; 1 new motion-config module; several dead/broken-token fixes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Data Integrity & Security** | PASS | Presentation-only. No schema, query, or route changes. No new data written, read, or exposed. The `motion` dependency is client-side and processes no data. |
| **II. Architecture Discipline** | PASS | Reuses the existing route/data flow unchanged. New shared primitives live in `components/ui/` (established location); dashboard-specific widgets stay in `components/dashboard/`; one `lib/motion.ts` config mirrors the existing `lib/` convention. Centralizing the 24× duplicated wrapper/tooltip/segmented logic is a net architecture improvement, not a departure. |
| **III. UX Excellence & Accessibility** | PASS | This phase exists to raise UX: adds press feedback (pointer-down), spring motion, tabular numerals, focus-visible treatment on hand-rolled controls, and the repo's first `prefers-reduced-motion` / `-transparency` / `-contrast` handling. Fixes undefined-token regressions (`Badge`, `Skeleton`). Contrast re-verified on both themes. |
| **IV. Code Quality & Performance** | PASS | TypeScript strict, no `any` in new code. One small, tree-shakeable dependency. Removing two Google webfonts reduces weight/CLS. Motion restricted to `transform`/`opacity`. No N+1, no new fetch. Recharts series colours consolidated into one constants module. |
| **V. Phased Delivery & Verification** | PASS | Independently shippable phases: foundation → chrome → dashboard → polish. Each phase keeps the app compiling and shippable (no half-migrated state). Verified via `npm run lint`, `npx tsc --noEmit`, and a manual QA checklist per phase. |

**Gate verdict**: PASS.

**Post-design re-check (after Phase 1)**: PASS — no new violations. The design adds only `motion`, tokens/type-scale, and shared primitives. Aggressive restructure keeps all data features; nothing removed or hidden.

## Direction & Open Decisions

### Decision D-1 — Accent colour (confirm visually before Phase 2)
- Default recommendation: shift the interaction accent toward a system feel — Apple blue family (light `#007AFF`, dark `#0A84FF`) — used sparingly (selection, links, interactive highlights).
- Alternative: keep an indigo tint but desaturate usage (no large fills).
- All values live in CSS variables, so reversal is a token edit. **Do not** propagate a decision into hard-coded hex.

### Decision D-2 — Hero composition (RESOLVED: two separate blocks)
- **Final**: KPI row and month snapshot are TWO separate colour-anchored sections — `DashboardGlobalStats` (5 tinted stat cards with coloured icon chips) and `DashboardMonthSnapshot` (a titled `<Month> Snapshot` card with 3 tinted cells) — restoring the earlier structure with the new styling. The interim merged `HeroBand` was removed.

### House style for motion (skill §3–§5, quick reference)
| Use | Config |
|---|---|
| Default UI / reposition | critically damped, `bounce: 0`, `duration: 0.4` |
| Section entrance | fade + rise `~8px`, `bounce: 0`, `duration: 0.45`, stagger `0.06` |
| Momentum / flick interactions | reserve `bounce` only here (currently: none gesture-driven on dashboard) |
| Press feedback | pointer-down `scale(0.97)`, ~100ms |
| Counter | spring, settle ≤ ~1s, no drift; reduced-motion → final value instantly |
| Segmented thumb | spring `bounce: 0`, `duration: 0.3` |

## Project Structure

### Documentation (this feature)

```text
specs/018-apple-dashboard-redesign/
├── spec.md
├── research.md
├── plan.md
├── tasks.md
└── contracts/
    └── components.md
```

### Source Code (targets of this phase)

```text
app/
├── layout.tsx                         # EDIT: drop Syne + DM_Sans next/font; system stack; keep JetBrains Mono var
└── globals.css                        # EDIT: token overhaul (colour/materials/hairlines/radius/shadow/type scale/motion
                                       #       reduced-motion/transparency/contrast media queries, tabular-nums)

app/(dashboard)/
├── layout.tsx                         # EDIT (only if needed for content column width/rhythm)
└── dashboard/page.tsx                 # EDIT: large-title header markup (data flow unchanged)

components/ui/
├── card.tsx                           # EDIT: align base with token system (soft radius/shadow, no ring-everything)
├── badge.tsx                          # EDIT: fix undefined-token variants → accent/foreground tokens; keep tint API
├── skeleton.tsx                       # EDIT: fix bg-primary/10 → defined token
├── widget-card.tsx                    # NEW: section shell — header(title+actions) + content + loading/empty states
├── segmented.tsx                      # NEW: Apple-style control, sliding spring thumb, role=group, aria-pressed
├── stat-value.tsx                     # NEW: tabular number + counter + reduced-motion behaviour
└── chart-tooltip.tsx                  # NEW: shared material tooltip for all Recharts `content={…}`

lib/
└── motion.ts                          # NEW: shared spring presets + reduced-motion helpers (house config)
lib/theme/
└── chart-colors.ts                    # NEW: token-driven series/axis colours for Recharts (single constants module)

components/layout/
├── sidebar.tsx                        # EDIT: translucent material, selection style, spring collapse
├── bottom-tab-bar.tsx                 # EDIT: floating translucent pill + layoutId active indicator
└── theme-toggle.tsx                   # EDIT: spring/Apple-styled icon transition

components/dashboard/
├── dashboard-client.tsx               # EDIT: section restructure (global stats / month snapshot / health / performance) + entrance stagger
├── dashboard-global-stats.tsx         # NEW: KPI row — 5 tinted StatCard (icon chip + accent figure)
├── dashboard-month-snapshot.tsx       # NEW: titled "<Month> Snapshot" card, 3 tinted StatCard cells (replaces old merged band)
├── dashboard-expiry-donut.tsx         # EDIT: thin ring, semantic token colours, centered total, shared tooltip
├── dashboard-critical-renewals.tsx    # EDIT: WidgetCard shell + pill variants
├── dashboard-promotion-section.tsx    # EDIT: WidgetCard shell + Segmented for pool filters + press feedback
├── dashboard-quick-stats.tsx          # EDIT: WidgetCard shell, hairline stat rows
├── dashboard-revenue-chart.tsx        # EDIT: WidgetCard + Segmented + shared tooltip + token series + grid/axis restyle
├── dashboard-spend-sold-chart.tsx     # EDIT: same conventions as revenue chart
├── dashboard-sales-leaderboard.tsx    # EDIT: WidgetCard + Segmented + restyled table
├── dashboard-platform-breakdown.tsx   # EDIT: token palette, shared tooltip, restyled bars
├── dashboard-empty-state.tsx          # EDIT: material/type restyle; single primary action
├── dashboard-value-chart.tsx          # EDIT only if mounted on /dashboard (verify usage) — fix broken light-mode tooltip
├── dashboard-summary-cards.tsx        # CHECK: currently unused by dashboard-client — reconcile or delete if dead
├── dashboard-expiring-table.tsx       # EDIT only if mounted on /dashboard (verify usage)
└── dashboard-expired-table.tsx        # EDIT only if mounted on /dashboard (verify usage)
```

**Structure Decision**: One Next.js project, no new routes. Shared primitives go to `components/ui/`; the motion config mirrors the `lib/` convention (`lib/motion.ts`); Recharts token mapping in `lib/theme/chart-colors.ts`. Widgets are restyled inside their existing files in `components/dashboard/` to keep diffs reviewable. Anything built here is deliberately generic so the Domains/Sales/Import/checker pages can adopt it in later phases.

## Implementation Phases

> Build order mirrors `tasks.md`. Each phase is independently shippable; the app compiles and runs at every checkpoint.

### Phase 0 — Foundation: tokens, fonts, primitives
1. `npm i motion`.
2. Type scale + system font stack in `globals.css`/`tailwind.config.ts`; remove `Syne`/`DM Sans` from `app/layout.tsx`; add `tabular-nums` utility; define size-specific tracking/leading.
3. Token overhaul: layered surface colours (light + dark), hairline separator, radius, shadow/elevation scale; fix `* { border-border }` so whole-card strokes stop ringing every widget.
4. Fix undefined-token family (`badge.tsx`, `skeleton.tsx`, checkbox/sonner theme). Align `Card` base with the new token system.
5. Build shared primitives: `WidgetCard`, `Segmented`, `StatValue`, `ChartTooltip`; add `lib/motion.ts` and `lib/theme/chart-colors.ts`.

### Phase 1 — App-shell chrome
1. Sidebar: translucent `backdrop-filter` material, hairline edge, neutral-tint selection with accent glyph, spring collapse/expand.
2. Bottom tab bar: floating translucent pill, safe-area padding, `layoutId` spring indicator.
3. Content column max-width/rhythm; theme-toggle icon transition via spring; `prefers-reduced-transparency`/`contrast` handling on the new materials.

### Phase 2 — Dashboard restructure & restyle
1. Page header → Apple large title (confirm `Decision D-1` accent; `Decision D-2` resolved as two blocks).
2. Global stats + month snapshot: build `StatCard`-based colour-anchored sections (tinted icon chips, accent figures, spring counters, preserved links).
3. Portfolio-health group: donut (thin ring/semantic colours/center total), critical renewals, promotion (Segmented pool filters).
4. Performance group: revenue + spend-vs-sold + leaderboard + platform breakdown restyled to shared chart conventions (`ChartTooltip`, token palette, soft-rounded bars, hairline-or-no grid).
5. Wire section entrance stagger + spring counters + pointer-down press feedback across interactive elements; empty/loading states via `WidgetCard`.

### Phase 3 — Feedback, accessibility & verification
1. Reduced-motion / transparency / contrast media-query layer + `useReducedMotion` in motion clients.
2. Keyboard + visible focus pass on every new interactive control; `aria-pressed` on segmented options.
3. Contrast check (light + dark), responsive pass 375–1920px, performance trace (60fps press/entrance/counter).
4. Gate: `npm run lint`, `npx tsc --noEmit`, manual QA checklist from `spec.md`; update AGENTS.md design notes only if a durable convention is introduced.

## Rollout After This Phase

The primitives and tokens built in Phases 0–1 are the design system for the rest of the app. Later page rollouts (Domains, Sales, Import, checkers, Promoting, Settings) become "adopt `WidgetCard`, swap to tokens/type scale, apply `Segmented`/`StatValue`/`ChartTooltip`, add press + reduced-motion" rather than a per-page redesign. A follow-up spec (`019`) can sequence those pages.

## Complexity Tracking

> No violations expected — this phase is presentation-only, additive in primitives, and subtractive in duplication (24× wrapper → one `WidgetCard`, N tooltips → one `ChartTooltip`, N chip controls → one `Segmented`).
