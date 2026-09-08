# Tasks: Apple-Inspired Dashboard Redesign

**Branch**: `018-apple-dashboard-redesign` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Format: `[ID] [P?] [Story] Description`

- `ID`: e.g. `ADR-001` (Apple Dashboard Redesign). Story IDs: `US-1`…`US-5` from `spec.md`.
- `P?`: Priority 1/2/3.

## Path Conventions

| Kind | Location |
|---|---|
| Design tokens / fonts / media queries | `app/globals.css`, `app/layout.tsx`, `tailwind.config.ts` |
| Shared primitives | `components/ui/*` |
| Motion + chart theme | `lib/motion.ts`, `lib/theme/chart-colors.ts` |
| Shell chrome | `components/layout/*` |
| Dashboard widgets | `components/dashboard/*` |
| Verification | `npm run lint` · `npx tsc --noEmit` · manual QA |

## Phase 1: Foundation — Tokens, Fonts, Primitives (Blocking)

> Sets the system every other phase consumes. App stays fully functional throughout.

- [ ] `ADR-001` [P1] [US-3] Add dependency: `npm i motion`. Pin the version in `package.json`; no other new dependency.
- [ ] `ADR-002` [P1] [US-3] Swap fonts: remove `Syne` + `DM_Sans` from `app/layout.tsx`; set body/heading stack to the system font (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial`); keep `JetBrains Mono` variable for mono/domain names. Update `tailwind.config.ts` `fontFamily` so `font-display`/`font-body` resolve to the system stack (or remove the two and rely on `font-sans`).
- [ ] `ADR-003` [P1] [US-3] Define the type scale in tokens: large title ≈34px/600/`-0.02em`/leading 1.05; section ≈22px; card header ≈17px; body 15px; secondary 13px; caption ≈11–12px — each with its own tracking/leading. Add a `tabular-nums` utility and apply to stat/currency/number surfaces.
- [ ] `ADR-004` [P1] [US-1] Token overhaul in `app/globals.css`: layered surfaces (canvas / surface / elevated) for light + dark; hairline separator; shadow/elevation scale; soft group radius; soften the global `* { @apply border-border }` effect so full-card strokes stop ringing every widget (replace with hairline/whitespace where the redesign dictates).
- [ ] `ADR-005` [P1] [US-5] Fix undefined-token primitives: `ui/badge.tsx` and `ui/skeleton.tsx` (and checkbox/sonner theme) — remap `bg-primary`/`bg-secondary`/`bg-destructive`/`*-foreground` to defined accent/foreground tokens. Align `ui/card.tsx` base with the new surface/radius/shadow tokens.
- [ ] `ADR-006` [P1] [US-5] Build `components/ui/widget-card.tsx` — section shell with header slot (title + optional actions) and built-in `loading`/`empty` states.
- [ ] `ADR-007` [P1] [US-2/US-5] Build `components/ui/segmented.tsx` — Apple-style control: single sliding spring thumb, `role="group"`, `aria-pressed` options, keyboard (arrow) support.
- [ ] `ADR-008` [P1] [US-2/US-3/US-5] Build `components/ui/stat-value.tsx` — tabular number, spring count-up, reduced-motion → instant final value.
- [ ] `ADR-009` [P1] [US-4/US-5] Build `components/ui/chart-tooltip.tsx` — shared translucent-material Recharts tooltip (works in both themes; fixes the light-mode-broken dark tooltip).
- [ ] `ADR-010` [P1] [US-2] Create `lib/motion.ts` — house spring presets + reduced-motion helpers (bounce 0 / duration 0.4 default; entrance preset; press preset).
- [ ] `ADR-011` [P1] [US-4] Create `lib/theme/chart-colors.ts` — Recharts series/axis/tooltip colours sourced from tokens (consolidate the raw hex palettes).

**Phase 1 DoD**: `npm run lint` + `npx tsc --noEmit` pass; no Google Fonts request for Syne/DM Sans in DevTools; badge/skeleton render with visible, token-driven colours; primitives render on a throwaway or existing surface.

## Phase 2: App-Shell Chrome

- [ ] `ADR-020` [P1] [US-1/US-2] Restyle `components/layout/sidebar.tsx`: opaque `bg-bg-surface` → translucent `backdrop-blur` material; hairline edge; active item = neutral tinted fill + accent glyph (not saturated indigo fill); collapse/expand animated with a spring; respect `prefers-reduced-transparency`.
- [ ] `ADR-021` [P1] [US-1/US-2] Restyle `components/layout/bottom-tab-bar.tsx`: floating translucent rounded pill with blur + safe-area padding; active indicator driven by a `motion` `layoutId` spring; press-scale feedback on items.
- [ ] `ADR-022` [P2] [US-1] Content column: comfortable max-width + vertical rhythm in `app/(dashboard)/layout.tsx` so pages don't butt against the material edges.
- [ ] `ADR-023` [P2] [US-2] Theme toggle icon transition → spring (or short eased cross-fade); confirm no abrupt dark↔light brightness jump.

**Phase 2 DoD**: Chrome reads as floating translucent material in both themes; content visibly scrolls beneath it; reduced-transparency yields solid surfaces.

## Phase 3: Dashboard Restructure & Restyle

- [ ] `ADR-030` [P1] [US-3] `app/(dashboard)/dashboard/page.tsx`: replace `text-2xl` heading with Apple large-title header (title + date/subtitle + optional actions). Keep server data flow identical. (Confirm `Decision D-1` accent here.)
- [ ] `ADR-031` [P1] [US-1/US-2] Restructure `components/dashboard/dashboard-client.tsx` into sections — header / global stats / month snapshot / portfolio-health group / performance group — and add the shared entrance fade+rise stagger.
- [ ] `ADR-032` [P1] [US-1/US-3] Split stats into two colour-anchored blocks: `DashboardGlobalStats` (5 tinted `StatCard`s, icon chips + accent figures, preserved links) and `DashboardMonthSnapshot` (titled "<Month> Snapshot" card, 3 tinted cells). Spring counters via `useCountUp`; remove the linear `setInterval` `AnimatedCounter` and the interim merged hero band.
- [ ] `ADR-033` [P1] [US-4] `dashboard-expiry-donut.tsx`: thin ring, semantic token colours (map the raw hex expiry palette to warning/success tokens), centered large total, shared `ChartTooltip`.
- [ ] `ADR-034` [P1] [US-5] `dashboard-critical-renewals.tsx` + `dashboard-quick-stats.tsx`: `WidgetCard` shells; hairline rows; urgency pills via fixed `Badge` variants.
- [ ] `ADR-035` [P1] [US-2/US-5] `dashboard-promotion-section.tsx`: `WidgetCard` shell; `Segmented` for pool filters (replaces hand-rolled chips); press feedback; keep weekly-flow logic untouched.
- [ ] `ADR-036` [P1] [US-2/US-4/US-5] `dashboard-revenue-chart.tsx` + `dashboard-spend-sold-chart.tsx`: `WidgetCard` + `Segmented` (12M/24M/All), shared tooltip, token series colours (remove raw `#f59e0b`), hairline-or-no grid, soft-rounded bars, restyled axes/ticks.
- [ ] `ADR-037` [P2] [US-4/US-5] `dashboard-sales-leaderboard.tsx` + `dashboard-platform-breakdown.tsx`: `WidgetCard`, `Segmented` sort toggle, token-derived palette replacing the rainbow hex array, shared tooltip, restyled table/bars.
- [ ] `ADR-038` [P1] [US-2] Pointer-down press feedback (`scale(0.97)`, ≈100ms) across interactive cards/buttons/rows via a shared mechanism.
- [ ] `ADR-039` [P2] [US-1] `dashboard-empty-state.tsx`: material + large-title restyle, single primary action, consistent with new chrome.
- [ ] `ADR-040` [P2] [US-1] Verify usage of `dashboard-value-chart.tsx`, `dashboard-expiring-table.tsx`, `dashboard-expired-table.tsx`, `dashboard-summary-cards.tsx` on `/dashboard`; fix the light-mode-broken tooltip / hex drift where mounted; reconcile or remove genuinely dead components.
- [ ] `ADR-041` [P1] [US-5] Sweep: remove the last legacy wrapper string `rounded-xl border border-border bg-bg-surface p-6` from `components/dashboard/` (legit uses via `Card`/`WidgetCard` only).

**Phase 3 DoD**: First viewport reads as hero + grouped sections, not 20 equal boxes; counters/press/segmented/entrance all spring-driven and smooth; charts token-coloured with the shared tooltip; no raw hex in `components/dashboard/`.

## Phase 4: Feedback, Accessibility & Verification

- [ ] `ADR-050` [P1] [US-2] Reduced-motion layer: global `@media (prefers-reduced-motion: reduce)` override + `useReducedMotion` in every motion client; counters jump to final; chart entry animation off.
- [ ] `ADR-051` [P1] [US-1] `prefers-reduced-transparency` and `prefers-contrast: more` surfaces (solid/frostier backgrounds, defined edges) for the new materials.
- [ ] `ADR-052` [P1] [US-5] Keyboard + visible focus pass on all new interactive controls (segmented, stat links, chips); verify `aria-pressed`/`role="group"` on segmented controls.
- [ ] `ADR-053` [P2] [US-1] Contrast + responsiveness QA: light/dark AA check; 375 / 768 / 1024 / 1920px; no clipped controls or horizontal overflow.
- [ ] `ADR-054` [P2] [US-2] Performance trace: 60fps on press feedback, section entrance, counter settle, segmented slide on a mid-range profile.
- [ ] `ADR-055` [P1] — Final gate: `npm run lint`, `npx tsc --noEmit`, manual QA checklist (spec.md SC-001…SC-008); record `Decision D-1`/`D-2` outcomes in `plan.md`.

## Dependencies & Execution Order

### Phase Dependencies
- Phase 1 blocks everything (tokens, fonts, primitives).
- Phase 2 (chrome) can start as soon as `ADR-004` tokens + reduced-transparency utilities exist.
- Phase 3 depends on Phase 1 primitives (`WidgetCard`, `Segmented`, `StatValue`, `ChartTooltip`, motion + chart-colors) and, for the header/hero, on Phase 2's content-rhythm choices.
- Phase 4 is the final hardening pass and must run last.

### Story Dependencies
- US-5 (shared language) is delivered by Phase 1 and is the enabler for US-1/US-2/US-4.
- US-3 (typography) is entirely Phase 1 + the Phase 3 header/hero edits.
- US-1 (calm reading) is realized across Phases 2–3 and is only fully verifiable at the end of Phase 3.
- US-2 (motion) is realized across Phase 1 primitives + Phase 2 chrome + Phase 3 widgets; US-4 (data-viz) in Phase 3.

### Within Each Phase
Work top-to-bottom as numbered; every task leaves the app compiling. Commit per completed phase (or per `ADR` batch) with a message matching repo style, and only when the user asks.
