# Feature Specification: Apple-Inspired Dashboard Redesign

**Feature Branch**: `018-apple-dashboard-redesign`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User request: "analyse our 'dashbord' design and make a plan to change to like apple design", using the `apple-design` skill (WWDC *Designing Fluid Interfaces*, UI typography, materials & depth, accessibility).

**Locked direction decisions** (confirmed with the user):
1. **Scope**: start with `/dashboard` and its shared app shell (sidebar + bottom tab bar); roll out to the remaining dashboard-area pages afterwards, reusing the primitives this phase builds.
2. **Aggressiveness**: aggressive rethink — re-architect layout, spacing, type and data-viz hierarchy, not just a re-skin.
3. **Motion**: add the `motion` package for true spring physics (interruptible, velocity-aware). No new dependencies beyond it.
4. **Typography**: move to the platform system font stack for everything (keep `JetBrains Mono` for domain names / codes only); build hierarchy from weight + size + tracking.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A Dashboard That Reads Calm, Not Busy (Priority: P1)

A domain investor opens the dashboard and is able to find the number that matters within a few seconds. The screen no longer reads as a wall of equal-weight, border-boxed cards. Materials, spacing, and type size create hierarchy: one quiet hero band with the headline numbers, clearly separated portfolio-health and performance sections, and chrome that floats as translucent material rather than sitting in an opaque box.

**Why this priority**: Every other story in this phase is subordinate to this one visual outcome. If the dashboard still reads as ~20 identical bordered cards, nothing else has been achieved. This is the reason the redesign exists.

**Independent Test**: Open `/dashboard` in light and dark mode at 1440px. Confirm: no full-card 1px borders ringing every widget; grouped sections separated by whitespace/materials rather than strokes; the top "hero" numbers visually dominate; the sidebar and (mobile) tab bar render as translucent, blurred materials.

**Acceptance Scenarios**:

1. **Given** the dashboard renders, **When** the page is scanned, **Then** the headline portfolio numbers are the first visual anchor (largest type on the page), followed by clearly grouped sections — it MUST NOT look like a grid of identical bordered boxes.
2. **Given** the page chrome (sidebar, mobile tab bar), **When** content scrolls beneath it, **Then** the chrome renders as a translucent `backdrop-filter` material so content is visible under it, in both themes.
3. **Given** a widget with no data, **When** it renders, **Then** it shows a single standardized empty state via the shared widget shell (no per-widget drift).
4. **Given** either theme, **When** the dashboard is fully loaded, **Then** no hard-coded hex color breaks the other theme (e.g., the current hard-coded `#1a1a24` tooltip that is invisible in light mode).

---

### User Story 2 - Fluid, Spring-Driven Motion (Priority: P1)

Interactions feel alive: content springs into place on load, segmented controls slide their thumb, buttons give instant press feedback on pointer-down, and the KPI counters count up on a spring — not a linear timer. Every animation is interruptible and respects reduced motion.

**Why this priority**: Fluidity is the defining quality of the Apple design language (skill §1–§6). Without it the restyle is only a skin.

**Independent Test**: Reload the dashboard and confirm sections rise+fade in with a slight stagger. Click a segmented control (Revenue 12M/24M/All) and confirm the active thumb slides with a spring. Press-and-hold any button and confirm it scales down on pointer-down, not on release. Toggle OS "reduce motion" and confirm all of it collapses to opacity cross-fades.

**Acceptance Scenarios**:

1. **Given** the dashboard mounts, **When** sections first appear, **Then** they animate in with a short spring (fade + ~8px rise) and a small stagger, using a shared motion config — never a hard-coded per-widget animation.
2. **Given** the KPI hero numbers, **When** they load, **Then** each counts up on a spring from 0 to its value (replacing the current linear `setInterval` counter).
3. **Given** a pressable element (button, card, row control), **When** the pointer goes down, **Then** feedback fires on pointer-down (≈0.97 scale, ~100ms), not only on hover or release.
4. **Given** a segmented control, **When** the selection changes, **Then** the active highlight is a single thumb that slides between options with a spring (no two simultaneous active fills).
5. **Given** `prefers-reduced-motion: reduce`, **When** the page renders or animates, **Then** springs/slides are replaced by short opacity cross-fades and static final states; counters show the final value without counting.

---

### User Story 3 - Apple Typography & System Font (Priority: P1)

The dashboard is typeset in the platform system font. Hierarchy comes from weight, size, and size-specific tracking (skill §15), not from a decorative display face. Large titles use tight leading and slightly negative tracking; small labels use tabular figures and comfortable spacing. Numbers align in columns because they are tabular.

**Why this priority**: Type is the largest surface area of the redesign and the fastest way to feel "system". Removing the two Google webfonts also cuts network weight and layout shift.

**Independent Test**: Inspect computed styles. Confirm `body` uses `-apple-system`/system stack (no Syne, no DM Sans anywhere), the page `<h1>` is ~34px with `letter-spacing: -0.02em`, and all KPI/stat figures render with `font-variant-numeric: tabular-nums`.

**Acceptance Scenarios**:

1. **Given** the app shell, **When** fonts load, **Then** the body and every heading use the system font stack; `Syne` and `DM Sans` are removed from `app/layout.tsx` and no longer requested from Google Fonts.
2. **Given** the page title, **When** it renders, **Then** it uses large-title styling (≈34px, weight ~600, `-0.02em` tracking, ~1.05 leading) instead of the current `text-2xl`.
3. **Given** any numeric figure (KPI, chart axis label, currency), **When** it renders, **Then** it uses tabular numerals so digits align across rows and animate counters without jitter.
4. **Given** the heading scale, **When** it is applied, **Then** section (~22px), card header (~17px), body (15px), secondary (13px) and caption (~11–12px) sizes each carry an appropriate size-specific tracking and leading value.

---

### User Story 4 - Apple-Style Data Visualization (Priority: P2)

Charts look restrained and legible: no heavy gridlines or cluttered axes; larger bars with softly rounded tops; a single accent + neutrals for comparisons instead of rainbow palettes; material tooltips shared across every chart; a thin-ring donut with the total centered in the middle.

**Why this priority**: The dashboard is data-forward, so chart craft carries disproportionate weight in the perceived quality. P2 because it sits below the shell, type, and motion stories in visual impact but above polish.

**Independent Test**: Open the Revenue chart and toggle ranges — confirm gridlines are gone or hairline, bars use a soft top radius and token colors, and the tooltip uses the shared material style. Confirm the same tooltip/axis styling in Spend vs Sold, Platform breakdown, and the donut.

**Acceptance Scenarios**:

1. **Given** any Recharts widget, **When** it renders, **Then** it uses a shared tooltip component (translucent material, no per-file copy-paste) and shared axis/tick conventions (11–12px, muted tick color).
2. **Given** the Revenue / Spend vs Sold charts, **When** they render, **Then** they use the token color system (primary series = accent, secondary comparisons = neutral/semantic), no raw `#f59e0b`-style hexes outside a single theme constants module.
3. **Given** the expiry donut, **When** it renders, **Then** the ring is thin, the segment palette maps to semantic warning/success tokens, and the total active count sits large and centered.
4. **Given** the Platform breakdown, **When** it renders, **Then** the rainbow categorical palette is replaced with a restrained, token-derived scale.
5. **Given** charts on first load, **When** reduced motion is off, **Then** they animate in once (~500–600ms); **When** reduced motion is on, **Then** they render statically without entry animation.

---

### User Story 5 - A Shared Component Language (Priority: P1)

The duplicated visual patterns — 24 copy-pasted card wrappers, per-widget tooltips, hand-rolled segmented controls and tint badges — are collapsed into a small set of primitives: a `WidgetCard` shell with built-in loading/empty states, a `Segmented` control with a sliding thumb, a shared `ChartTooltip`, a `StatValue`, and consistent `Badge` variants. This is what makes the aggressive rethink maintainable and what the later page rollouts will consume.

**Why this priority**: Without this, the redesign would re-introduce the same drift it is trying to remove (this is also a correctness fix — current `Badge` and `Skeleton` reference undefined shadcn tokens and render inert).

**Independent Test**: `grep` for the legacy card recipe `rounded-xl border border-border bg-bg-surface p-6` inside `components/dashboard/` — confirm near-zero remaining occurrences. Confirm `ui/badge.tsx` and `ui/skeleton.tsx` no longer reference undefined `bg-primary`/`bg-secondary` tokens.

**Acceptance Scenarios**:

1. **Given** a dashboard widget, **When** it needs a container, **Then** it consumes the shared widget shell (or the fixed `Card` primitive) with a header slot for title + actions — the legacy wrapper string is not re-added.
2. **Given** any segmented/toggle control, **When** it renders, **Then** it uses the shared `Segmented` primitive with `role="group"`, `aria-pressed` on options, keyboard support, and a spring-driven active thumb.
3. **Given** any Recharts tooltip, **When** it renders, **Then** it comes from the shared `ChartTooltip`.
4. **Given** `ui/badge.tsx`, `ui/skeleton.tsx`, `ui/checkbox.tsx` and the Toaster theme, **When** they render, **Then** their color classes resolve to defined CSS variables (no inert `bg-primary`-family references).
5. **Given** a stat number, **When** it renders, **Then** it uses `StatValue`/tabular numerals so counter animation and reduced-motion behavior are consistent everywhere.

---

### Edge Cases

- What happens when the dashboard has zero domains (empty state)? → The empty state is redesigned with the same material/typography language and a single primary action; the hero band and charts do not render broken shells.
- What happens with a slow data load? → Each section uses the `WidgetCard` skeleton state; previously loaded data stays visible during refetch (no flicker).
- What happens when the user has reduced motion enabled? → All springs/slides collapse to opacity cross-fades; counters jump to final values; charts skip entry animation.
- What happens when the user prefers reduced transparency? → Translucent surfaces become frostier/solid (blur removed, background opacity raised) via `prefers-reduced-transparency`.
- What happens when the user prefers more contrast? → Surfaces gain near-solid backgrounds and defined edges via `prefers-contrast: more`.
- What happens when the revenue chart has months with zero sales? → Zero-height bars render (current behavior preserved) with the Apple-styled axis/tooltip.
- What happens if `motion` fails to load / JS is disabled? → The page renders fully static and usable; motion is progressive enhancement only.
- What about the widgets currently mounted on `/dashboard` that other pages also use (e.g., `DashboardExpiryBadge`, status badges)? → Shared primitives are updated in place so other pages inherit the fix without extra work; purely dashboard-scoped widgets are restyled here.

## Requirements *(mandatory)*

### Functional Requirements

**Shell & Chrome**

- **FR-001**: The desktop sidebar MUST render as a translucent material (background blur + semi-transparent surface) instead of an opaque `bg-bg-surface` box, with content scrolling beneath it, in both themes.
- **FR-002**: The mobile bottom tab bar MUST render as a floating, translucent, rounded material with blur and safe-area padding, replacing the opaque full-width bar.
- **FR-003**: Active navigation MUST be indicated by a neutral tinted fill + accent glyph (not a saturated full-colour fill), with the collapse/expand transition spring-driven.
- **FR-004**: The dashboard content column MUST adopt a comfortable max width and vertical rhythm consistent with the material chrome (no edge-to-edge card walls).

**Layout & Hierarchy**

- **FR-005**: The dashboard MUST be re-organized into Apple-style sections — a header, a colour-anchored global-stats block, a month-snapshot block, a portfolio-health group, and a performance group — replacing the uniform `space-y-6` stack of equal cards.
- **FR-006**: The KPI row (`dashboard-global-stats.tsx`) and month snapshot (`dashboard-month-snapshot.tsx`) MUST render as TWO colour-anchored sections: a global stat row of tinted cards (coloured icon chips + accent figures) and a titled `<Month> Snapshot` card — not eight identical borderless grey cells.
- **FR-007**: Clickable stat cells MUST carry a visible affordance (e.g., chevron) and MUST keep their existing navigation targets (`/domains`, `/domains?expiry=3m`, `/sales`).
- **FR-008**: All section containers MUST rely on material/shadow/whitespace for separation; full-card 1px strokes ringing every widget MUST be removed.

**Typography**

- **FR-009**: The body and all headings MUST use the system font stack (`-apple-system`-family). `Syne` and `DM_Sans` Google fonts MUST be removed from `app/layout.tsx`.
- **FR-010**: A type scale MUST be defined (large title ≈34px/600/-0.02em, section ≈22px, card header ≈17px, body 15px, secondary 13px, caption ≈11–12px) with size-specific tracking/leading (skill §15). No single `letter-spacing` for all sizes.
- **FR-011**: All numeric figures MUST render with `font-variant-numeric: tabular-nums`.
- **FR-012**: Domain names and codes continue to use `JetBrains Mono`; the mono face MUST NOT be used for body text.

**Colour & Materials**

- **FR-013**: Accent colour(s) MUST be re-tuned toward a system feel and used sparingly for interactivity/selection — not as large saturated fills. The decision and exact hex values are recorded in the plan (`Decision D-1`) and MUST live in CSS variables for trivial reversal.
- **FR-014**: Layered surface colours MUST be resolved for both themes (canvas vs. surface vs. elevated) and MUST include a shadow/elevation scale and a hairline separator token.
- **FR-015**: Every colour used by a dashboard widget MUST resolve to a defined token; raw hex values (e.g., `#f59e0b`, `#1a1a24`, the Recharts palettes) MUST be consolidated into a theme constants module used by the chart layer.
- **FR-016**: `prefers-reduced-transparency` MUST reduce/drop backdrop blur and raise surface opacity; `prefers-contrast: more` MUST yield near-solid surfaces with defined edges.

**Motion**

- **FR-017**: The `motion` package MUST be added and a shared motion config module created (house style: `bounce: 0` critically-damped springs by default; bounce reserved for momentum-driven gestures).
- **FR-018**: Section entrance MUST use a shared fade + small-rise spring with stagger, driven by the motion config.
- **FR-019**: KPI counters MUST animate on a spring (replacing the `setInterval` linear counter in `dashboard-kpi-cards.tsx`).
- **FR-020**: Pressable elements MUST give pointer-down feedback (~0.97 scale, ≈100ms), applied via a shared mechanism (component + CSS `:active`).
- **FR-021**: Segmented controls MUST animate their active thumb with a spring.
- **FR-022**: Every animated interaction MUST respect `prefers-reduced-motion` (cross-fade/static fallback) via media queries and `useReducedMotion`.

**Data Visualization**

- **FR-023**: All Recharts widgets MUST use the shared `ChartTooltip` (translucent material) and shared axis/tick conventions.
- **FR-024**: Gridlines MUST be removed or reduced to hairlines; bars MUST use softly rounded tops; series colours MUST come from the token/constants module.
- **FR-025**: The expiry donut MUST use a thin ring, semantic token colours, and a large centered total.
- **FR-026**: Chart entry animation MUST be retained at ~500–600ms and disabled under reduced motion.

**Component Consolidation (Correctness + Consistency)**

- **FR-027**: A `WidgetCard` shell (header/title/action slot + content + built-in loading & empty states) MUST be created and adopted by dashboard widgets; the legacy wrapper string MUST NOT be re-introduced in `components/dashboard/`.
- **FR-028**: A `Segmented` primitive MUST be created (Apple-style sliding thumb, `role="group"`, `aria-pressed`, keyboard support) and replace the hand-rolled active/inactive chip logic in the revenue chart, leaderboard toggle, and promotion filter chips.
- **FR-029**: A `StatValue`/tabular-number component MUST be created for consistent counter + reduced-motion behavior.
- **FR-030**: `ui/badge.tsx` and `ui/skeleton.tsx` MUST be fixed so every variant resolves to defined CSS variables (currently `bg-primary`/`bg-secondary`/`bg-destructive`/`*-foreground` are undefined). Tint pills (`bg-{accent}/10 text-{accent} border-{accent}/20`) MUST be consolidated into Badge variants.
- **FR-031**: Keyboard focus MUST be visible on every interactive element with a subtle, consistent focus treatment in both themes.

**Performance & Safety**

- **FR-032**: This phase MUST NOT change any data query, hook, route, or schema. It is presentation-only (plus the `motion` dependency and font change).
- **FR-033**: The redesign MUST NOT introduce layout shift worse than today while data loads (skeletons inside the widget shell, no raw content flash).
- **FR-034**: Removing the two Google display/body webfonts MUST NOT regress readability or the dark/light theme system.

### Key Entities

- **Design Token**: A named value (colour, radius, shadow, blur, spacing, type size/tracking/leading, motion timing) defined once and consumed by class or JS constant — the single source of truth the redesign is built on.
- **Widget Card / Widget Shell**: The shared section container with a header (title + optional action slot), content area, and standardized loading/empty states. Replaces the ~24 copy-pasted wrappers.
- **Segmented Control**: The Apple-style mutually exclusive option control with a single sliding spring thumb, used for chart range toggles (12M/24M/All), leaderboard sort and promotion pool filters.
- **Stat Cell / StatValue**: A label + big tabular number (+ optional trend glyph/chevron/affordance). Used by the stat cards and mini-stat rows.
- **Chart Tooltip**: The one material tooltip used by every Recharts widget.
- **Chart Theme Constants**: The JS module mapping Recharts needs (series fills, axis ticks, cursor) to the design tokens, replacing raw hex and duplicated tooltip markup.
- **Global Stats**: The colour-anchored KPI row (Total Domains, Portfolio Value, Lifetime Revenue, Expiring ≤90d, Sold This Year) — tinted icon chips + accent figures.
- **Month Snapshot**: The titled `<Month> Snapshot` section (Invested / Sold / Revenue + domains acquired) presented as its own card.
- **Portfolio-Health Group**: The section grouping expiry donut, promotion, and critical renewals.
- **Performance Group**: The section grouping revenue, spend-vs-sold, sales leaderboard and platform breakdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dashboard renders in both themes with zero `console` errors and zero undefined-colour regressions; every chart/tooltip resolves visible tokens in both themes.
- **SC-002**: Visual density decreases measurably: the number of visually distinct "boxed" widgets on the first viewport drops (hero cards merged into one band; bordered-card recipe removed from `components/dashboard/`).
- **SC-003**: Press feedback, segmented sliding, and section entrances complete with no jank at 60fps on a mid-range device (checked in DevTools performance trace); counters settle on the exact final value with no drift.
- **SC-004**: With OS reduce-motion on, no dashboard element animates position; only opacity cross-fades remain, and all content reaches its final state.
- **SC-005**: Page weight improves: the Google Fonts request for `Syne`/`DM Sans` is gone from the network tab.
- **SC-006**: `npm run lint` and `npx tsc --noEmit` pass with zero errors.
- **SC-007**: The dashboard is fully usable at 375px, 768px, 1024px and 1920px with no clipped controls, horizontal overflow, or broken grid.
- **SC-008**: Keyboard navigation reaches and activates every interactive element (segmented controls, stat links, badges with actions) with a visible focus indicator.

## Assumptions

- The current information architecture is preserved in substance: no data feature is removed. The redesign reorganizes presentation and hierarchy only (per the "aggressive rethink" direction, layout and emphasis may change).
- The `/dashboard` route shell (`app/(dashboard)/dashboard/page.tsx`) may change its heading/header markup but MUST keep the same server data flow into `DashboardClient`.
- Dashboard-scoped components are restyled in this phase; shared components touched here (Card, Badge, Skeleton, Button, tooltips, Segmented, fonts, tokens) become the base for later rollout to Domains/Sales/Import/checkers.
- `Recharts` remains the charting library; no migration to another chart library is in scope.
- Adding `motion` (the successor to Framer Motion) is approved. No other new dependency is introduced without re-checking.
- The current `promotion` weekly flow, queries, and data model are out of scope and unchanged; only its widget presentation is restyled.
- Exact accent hue (Apple blue vs. retained indigo tint) is an open implementation choice to be confirmed visually before Phase 2 (`Decision D-1`).
