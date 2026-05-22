# Implementation Plan: Phase 3 — Dashboard & Analytics

**Branch**: `003-dashboard-analytics` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-dashboard-analytics/spec.md`

## Summary

Deliver a portfolio dashboard with summary cards (total, active, expiring, value), a
12-month expiration timeline bar chart, a TLD distribution bar chart, a portfolio value
bar chart (by TLD, sorted descending), an expiring-soon domains table, and automatic
active→expired status transition. This transforms the blank `/dashboard` route from
Phase 1 into the primary analytics landing page.

Technical approach: Server Components for initial data fetching (counts, aggregations),
Recharts for all chart visualizations (bar charts per clarification — no pie/donut),
TanStack Query for optional client-side interactivity. The auto-transition runs as a
server-side `UPDATE` query when the dashboard loads — idempotent, no cron needed.
All aggregations are computed via client-side Map/Reduce on domain rows fetched from
Supabase.

**Supabase connection**: All dashboard queries use the typed server client
(`createServerClient`) for SSR. RLS policies from Phase 1 enforce per-user isolation.
No new tables — all dashboard data is derived from the existing `domains` table.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, Recharts v2,
date-fns v3, shadcn/ui (Card, Badge, Skeleton, Table), Zustand v4

**Storage**: Supabase PostgreSQL — `domains` table (Phase 1), all dashboard data
derived via aggregate queries; no new tables

**Testing**: Manual E2E verification per Definition of Done

**Target Platform**: Vercel (serverless), modern browsers

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Dashboard load <2s, charts render <500ms, auto-transition
query <1s

**Constraints**: No `service_role` on client, no Route Handlers, server components
default, Recharts bar charts only, responsive 375px–1920px

**Scale/Scope**: Single-user portfolios, up to 50,000 domains, 1 page, 3 charts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Phase 3 Status |
|---|---|---|
| I. Data Integrity & Security | RLS on all tables, service role never exposed | ✅ Dashboard queries use anon key + RLS |
| II. Architecture Discipline | Server Components default, typed helpers | ✅ Dashboard SSR + `lib/supabase/queries/dashboard.ts` |
| II. Architecture Discipline | TanStack Query for client fetches | ✅ Optional hydration for interactive chart features |
| III. UX Excellence | Skeleton loaders, responsive, WCAG 2.1 AA | ✅ Skeleton cards/charts; responsive 2-col/1-col/stacked |
| III. UX Excellence | Dashboard layout per constitution breakpoints | ✅ 2-col ≥1024px, 1-col 768–1023px, stacked <768px |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | Recharts for charts, indexes on expiration_date/status | ✅ Recharts v2; Phase 1 indexes exist |
| V. Phased Delivery | Phase 2 DoD must pass | ✅ Verified |

**GATE RESULT**: PASS — zero violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-analytics/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Phase 1 — dashboard data models
├── quickstart.md        # Phase 1 — developer onboarding
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/(dashboard)/dashboard/page.tsx           # Dashboard page (server + client hydration)

components/dashboard/
├── dashboard-summary-cards.tsx              # 4 summary cards grid
├── dashboard-tld-chart.tsx                  # TLD distribution bar chart
├── dashboard-timeline-chart.tsx             # 12-month expiration timeline bar chart
├── dashboard-value-chart.tsx                # Value by TLD bar chart
├── dashboard-expiring-table.tsx             # Expiring-soon (≤90d) table
├── dashboard-expired-table.tsx              # Expired domains table
└── dashboard-empty-state.tsx                # Zero-domain empty state

lib/supabase/queries/dashboard.ts            # Dashboard aggregate query helpers
```

**Structure Decision**: Single Next.js App Router project. Dashboard components in
`components/dashboard/`. Dashboard queries in `lib/supabase/queries/dashboard.ts`.
All charts are bar charts per spec clarification. No new UI primitives needed —
Card, Badge, Table, Skeleton already exist from Phase 1/2.

## Complexity Tracking

> No violations to justify — all constitution gates pass for Phase 3.
