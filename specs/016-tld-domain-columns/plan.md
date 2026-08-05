# Implementation Plan: TLD Domain Columns & Sync UI

**Branch**: `016-tld-domain-columns` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-tld-domain-columns/spec.md`

## Summary

Add a "TLDs Reserved" column to the domains table showing per-domain TLD reservation counts, an inline refresh button for domains without data, a clickable dropdown popover listing reserved extensions, and a "Sync TLDs" button with scope selection modal. This is the UI layer that makes Phases 14–18 visible and actionable to users.

**Technical approach**: Add a new column to the existing `DomainTable` component with three cell states (icon/spinner/badge). Create a `TldDropdown` popover component for listing reserved extensions. Wrap the existing `TldSyncButton` into a modal flow with scope selection. All data comes from Phase 18 API routes.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode, React 18

**Primary Dependencies**: Next.js 14+ App Router, shadcn/ui (Table, Badge, Popover, Dialog, Skeleton), Lucide React, TanStack Query v5

**Storage**: Reads from `domains.reserved_tlds_count` and `domain_extension_checks` via API routes. No new database tables.

**Testing**: Manual UI verification + `npx tsc --noEmit`

**Target Platform**: Web (Vercel) — responsive from 375px mobile (card layout) through 1920px desktop (table layout)

**Project Type**: Web application — React components within Next.js App Router

**Performance Goals**: Dropdown loads in <2s; table renders at same speed as before; sync progress updates within 3s

**Constraints**: Must work with existing `DomainRow` type (augmented with `reserved_tlds_count` and `tlds_last_checked_at`). Must not break existing Sedo/Spaceship integrations.

**Scale/Scope**: 3 new components + 1 modal + edits to 2 existing components (table + card). No API routes (Phase 18 already provides them).

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Data Integrity & Security** | PASS | All data access through authenticated API routes (Phase 18). No direct Supabase calls from client components. Dropdown links external domains — no internal data leakage. Refresh button calls single-domain endpoint which validates ownership server-side. |
| **II. Architecture Discipline** | PASS | New components are Client Components — required for interactivity (state, effects, event handlers). No Route Handlers needed. TLD data fetched via `useEffect` + fetch(). Existing table/card components are edited to add columns — no architectural changes. |
| **III. UX Excellence & Accessibility** | PASS | All states covered: refresh icon (idle), spinner (loading), count badge (data available), skeleton rows (dropdown loading), error indicator (refresh failed). Progress bar on sync button. Keyboard-navigable dropdown items. Responsive — table column on desktop, inline badge on mobile card. |
| **IV. Code Quality & Performance** | PASS | TypeScript strict, zero `any` where avoidable. Dropdown data fetched lazily (on-demand, not preloaded). Sync progress via Realtime with polling fallback. Reuses existing `useJobProgress` hook from Phase 17. No new dependencies. |
| **V. Phased Delivery & Verification** | PASS | Phase 19 (table column + dropdown) independently shippable. Phase 20 (sync button modal) builds on it. Each passes `npx tsc --noEmit` + visual verification. |

**Gate verdict**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/016-tld-domain-columns/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── components.md
├── quickstart.md
└── tasks.md
```

### Source Code

```text
components/domains/
├── domain-table.tsx          # EDIT: add "TLDs Reserved" column + TldCell integration
├── domain-card.tsx           # EDIT: add TLD status to mobile card layout
├── TldCell.tsx               # NEW: per-row cell component (icon/spinner/badge states)
├── TldDropdown.tsx           # NEW: popover listing reserved TLD extensions
├── TldSyncButton.tsx         # EXISTS: from Phase 17-18
└── TldSyncModal.tsx          # NEW: scope selection modal wrapping TldSyncButton

lib/hooks/
└── useJobProgress.ts         # EXISTS: from Phase 17-18
```

**Structure Decision**: Single Next.js App Router project. New components live in `components/domains/` alongside existing domain table components. Existing `DomainTable` and `DomainCard` are edited to insert the new column. The `TldSyncButton` from Phase 17-18 is wrapped with a modal for scope selection.

## Complexity Tracking

> No violations.
