# Implementation Plan: Phase 3 — Dashboard & Analytics

**Branch**: `003-dashboard-analytics` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-dashboard-analytics/spec.md`

## Summary

Deliver a portfolio dashboard with summary cards (total, active, expiring, value), a
12-month expiration timeline chart, a TLD distribution chart, a portfolio value
distribution chart, an expiring-soon domains table, and automatic active→expired
status transition. This transforms the blank `/dashboard` route from Phase 1 into the
primary analytics landing page.

Technical approach: Server Components for initial data fetching (counts, aggregations),
Recharts for all chart visualizations, TanStack Query for optional client-side
interactivity (chart hover, time-range toggle). The auto-transition runs as a
server-side `UPDATE` query when the dashboard loads — idempotent, no cron needed.
All aggregations are computed via Supabase `.select()` with optional client-side
grouping for charts.

**Supabase connection**: All dashboard queries use the typed server client
(`createServerClient`) for SSR. RLS policies from Phase 1 enforce per-user isolation.
No new tables — all dashboard data is derived from the existing `domains` table. No
custom Route Handlers needed.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, Recharts v2,
date-fns v3, shadcn/ui (Card, Badge, Skeleton, Table), Zustand v4

**Storage**: Supabase PostgreSQL — `domains` table (Phase 1), all dashboard data
derived via aggregate queries; no new tables

**Testing**: Manual E2E verification per Definition of Done

**Target Platform**: Vercel (serverless), modern browsers (Chrome, Firefox, Safari,
Edge — latest 2 versions)

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Dashboard load <2s, charts render <500ms, auto-transition
query <1s

**Constraints**: No `service_role` key on client, no Route Handlers for dashboard
queries, server components by default, Recharts for all charts per constitution,
responsive 375px–1920px

**Scale/Scope**: Single-user portfolios, up to 50,000 domains, 1 dashboard page,
4 chart/table sections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Phase 3 Status |
|---|---|---|
| I. Data Integrity & Security | RLS on all tables, service role never exposed | ✅ Dashboard queries use anon key + RLS; no service_role |
| II. Architecture Discipline | Server Components default, TanStack Query for client fetches | ✅ Dashboard page server-rendered with SSR data; optional client hydration |
| II. Architecture Discipline | Typed helpers in `lib/supabase/queries/` | ✅ Dashboard query functions in `lib/supabase/queries/dashboard.ts` |
| III. UX Excellence | Skeleton loaders, responsive 375px–1920px | ✅ Skeleton cards/charts while loading; responsive chart layout per breakpoint |
| III. UX Excellence | Dashboard layout per constitution breakpoints | ✅ 2-col ≥1024px, 1-col 768–1023px, stacked cards <768px |
| IV. Code Quality | TypeScript strict, zero `any`, Recharts for charts | ✅ Enforced in CI; Recharts per constitution |
| IV. Code Quality | Indexes on expiration_date and status | ✅ Indexes exist from Phase 1 migration |
| V. Phased Delivery | Phase 2 DoD must pass before Phase 3 | ✅ Phase 2 DoD verified |

**GATE RESULT**: PASS — zero violations, zero unjustified deviations.

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-analytics/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions & best practices
├── data-model.md        # Phase 1 — dashboard data models & queries
├── quickstart.md        # Phase 1 — developer onboarding guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
└── (dashboard)/
    └── dashboard/
        └── page.tsx                      # Dashboard page (server component + client hydration)

components/
├── dashboard/                             # New: dashboard feature components
│   ├── dashboard-summary-cards.tsx        # 4 summary cards (total, active, expiring, value)
│   ├── dashboard-tld-chart.tsx            # TLD distribution bar chart
│   ├── dashboard-timeline-chart.tsx       # 12-month expiration timeline chart
│   ├── dashboard-value-chart.tsx          # Value by TLD bar chart
│   ├── dashboard-expiring-table.tsx       # Expiring-soon (≤90d) domains table
│   ├── dashboard-expired-table.tsx        # Expired domains table with danger highlight
│   └── dashboard-empty-state.tsx          # Empty state for zero-domain portfolios
└── ui/                                    # Existing shadcn/ui components

lib/
└── supabase/
    └── queries/
        └── dashboard.ts                   # New: typed dashboard aggregate query helpers
```

**Structure Decision**: Single Next.js App Router project. Dashboard components live
under `components/dashboard/`. Dashboard queries in `lib/supabase/queries/dashboard.ts`.
No new UI primitives needed — Card, Badge, Table, Skeleton already exist from Phase 1/2.
Recharts imported directly in chart components.

## Complexity Tracking

> No violations to justify — all constitution gates pass for Phase 3.
