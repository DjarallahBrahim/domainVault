# Implementation Plan: Phase 4 Refresh — Sales Analytics on Dashboard

**Branch**: `007-phase-4-refresh` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-phase-4-refresh/spec.md` and master plan.md §PHASE 4 (US-024–US-027).

## Summary

Add 4 sales analytics widgets to the existing dashboard: Revenue Over Time bar chart
(with 12M/24M/All toggle and cumulative line), Top Sales Leaderboard (top 5/10 with
Best ROI re-sort), Platform Performance breakdown (horizontal bars), and expandable
ROI Analysis detail per sale. US-021 (Log Sale), US-022 (Sales List), and US-023
(Sales KPI Cards) are already implemented and untouched.

Technical approach: Recharts for Revenue and Platform charts, table-based component
for the Leaderboard with inline expansion for ROI detail. New sales queries added to
`dashboard.ts` (server) and `dashboard-client.ts` (client). Dashboard layout extended
with a new row below the existing widgets.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Recharts v2 (BarChart, LineChart with ComposedChart),
date-fns v3, shadcn/ui (Table, Badge), Supabase JS client v2, TanStack Query v5

**Storage**: Supabase PostgreSQL — `sales` + `domains` tables (existing); no new tables

**Testing**: Manual E2E verification per spec acceptance scenarios

**Target Platform**: Vercel (serverless), modern browsers

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: New widgets load with existing dashboard data (<2s total),
charts animate <600ms, leaderboard expand <200ms

**Constraints**: 0 new npm deps, 0 new DB migrations, ≤2 new queries (fits within
existing dashboard query budget), responsive 375px–1920px

**Scale/Scope**: 4 new dashboard components, 2 query file updates, 1 dashboard
layout update

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Requirement | Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation, RLS | ✅ No new user inputs; RLS on sales/domains unchanged |
| I. Data Integrity & Security | Service role never exposed | ✅ Anon key + RLS |
| II. Architecture Discipline | Server Components default | ✅ Dashboard page SSR hydrates; chart components are client |
| II. Architecture Discipline | Query file split pattern | ✅ New queries split: server (`dashboard.ts`) + client (`dashboard-client.ts`) |
| II. Architecture Discipline | TanStack Query, typed helpers | ✅ New queries use TanStack Query with existing patterns |
| III. UX Excellence | Toast, inline errors, responsive | ✅ Charts have tooltips, empty states; responsive across breakpoints |
| III. UX Excellence | Skeleton loaders | ✅ Skeleton placeholders while data loads |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | Charts follow Chart Interaction Standard | ✅ Custom tooltips, hover effects, animated entry |
| V. Phased Delivery | Spec, plan, tasks | ✅ Spec complete; this plan; tasks to follow |

**GATE RESULT**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/007-phase-4-refresh/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology decisions
├── data-model.md        # Data models & queries
├── quickstart.md        # Verification guide
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
components/dashboard/
├── dashboard-revenue-chart.tsx        # NEW: Revenue bar chart with cumulative line
├── dashboard-sales-leaderboard.tsx    # NEW: Top sales table with expandable ROI detail
├── dashboard-platform-breakdown.tsx   # NEW: Platform performance chart/table
├── dashboard-client.tsx               # UPDATED: Add new widgets to layout

lib/supabase/queries/
├── dashboard.ts                       # UPDATED: Add fetchSalesAnalytics()
└── dashboard-client.ts                # UPDATED: Client-side variant
```

**Structure Decision**: New components in `components/dashboard/` alongside existing
widgets. Queries extended in existing dashboard query files. Dashboard layout updated
to include new widgets in a full-width row below the promotion section.

## Dashboard Layout (Updated)

```
Desktop ≥1024px:
┌─────────────────────────────────────────────────┬──────────────────┐
│  KPI Cards (4 across)                            │                  │
├──────────────────────┬──────────────────────────┤  Critical        │
│  Expiry Donut        │  Registrar Chart         │  Renewals        │
├──────────────────────┴──────────────────────────┤                  │
│  Promotion Section (full width)                 │  Quick Stats     │
├─────────────────────────────────────────────────┴──────────────────┤
│  Revenue Over Time Chart (full width)                               │
├────────────────────────────────┬────────────────────────────────────┤
│  Top Sales Leaderboard         │  Platform Breakdown                │
└────────────────────────────────┴────────────────────────────────────┘

Tablet 768–1023px: single column, all sections stacked.
Mobile <768px: stacked cards, simplified chart variants.
```

## Complexity Tracking

> No violations to justify.
