# Implementation Plan: Phase 3 Refresh — Dashboard & Analytics (Redesigned)

**Branch**: `006-phase-3-refresh` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-phase-3-refresh/spec.md` and master plan.md §PHASE 3.

## Summary

Full rebuild of the dashboard page. First, delete 3 deprecated v1 components (Expiry
Timeline bar chart, 6-month toggle, TLD Distribution donut chart). Then implement:
updated KPI cards with clickable navigation and hover lift, new Expiry Donut Chart
(4 non-overlapping segments), new Registrar Breakdown horizontal bar chart, updated
Critical Renewals panel, new Promotion Table with pool selector and inline confirm,
and updated Quick Stats (Most common Registrar replaces TLD). Portfolio Value chart
remains unchanged.

Technical approach: everything is a client component (charts, cards, panels use
interactivity). Server component for initial SSR hydration via Supabase. Recharts for
donut + bar charts, shadcn/ui Card for KPI cards, existing table patterns for
promotion/renewals lists. New `promotions` table via Migration 002. New registrar
index via Migration 003.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, Recharts v2,
shadcn/ui (Card, Badge, Table, Select, Skeleton), date-fns v3, Lucide React

**Storage**: Supabase PostgreSQL — `domains`, `sales`, `import_logs` (existing);
`promotions` (new via Migration 002); `idx_domains_registrar` (new via Migration 003)

**Testing**: Manual E2E verification per spec acceptance scenarios

**Target Platform**: Vercel (serverless), modern browsers

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Dashboard load <2s, ≤4 Supabase queries, chart render <500ms

**Constraints**: No new npm deps, run migrations before code, ≤4 queries per dashboard
render, responsive 2-col/1-col/stacked per master plan layout

**Scale/Scope**: 1 database migration (002), 1 index migration (003), 3 deleted files,
~10 new/updated dashboard components, 1 page rewrite

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Requirement | Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation, RLS | ✅ Promotion table has RLS policy; domain queries use RLS |
| I. Data Integrity & Security | Service role never exposed | ✅ Anon key + RLS; no Route Handlers |
| II. Architecture Discipline | Server Components default | ✅ Dashboard page SSR hydrates initial data; charts are client |
| II. Architecture Discipline | Query file split pattern | ✅ Dashboard queries in server `dashboard.ts` + client `dashboard-client.ts` |
| II. Architecture Discipline | TanStack Query, optimistic updates | ✅ Promotion confirm uses optimistic `useMutation` |
| III. UX Excellence | Toast, inline errors, responsive | ✅ Toast on promotion confirm; inline date picker for renewals |
| III. UX Excellence | Skeleton loaders | ✅ Skeleton KPI cards + chart placeholders while loading |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | React Hook Form + Zod | ✅ Not applicable (no user-input forms in dashboard) |
| V. Phased Delivery | Spec, plan, tasks | ✅ Spec complete; this plan; tasks to follow |

**GATE RESULT**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/006-phase-3-refresh/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology decisions
├── data-model.md        # Dashboard data models
├── quickstart.md        # Verification guide
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
components/dashboard/
├── dashboard-timeline-chart.tsx      # [DELETED]
├── dashboard-tld-chart.tsx           # [DELETED]
├── dashboard-value-chart.tsx         # [DELETED] (6-month toggle variant or merged)
├── dashboard-kpi-cards.tsx           # UPDATED: 4 clickable cards with hover lift
├── dashboard-expiry-donut.tsx        # NEW: 4-segment donut chart
├── dashboard-registrar-chart.tsx     # NEW: horizontal bar chart top 10
├── dashboard-critical-renewals.tsx   # UPDATED: "View All" link, inline date picker
├── dashboard-promotion-table.tsx     # NEW: weekly batch + pool selector + inline confirm
├── dashboard-quick-stats.tsx         # UPDATED: "Most common Registrar"
├── dashboard-summary-cards.tsx       # UPDATED: renamed/merged into KPI cards
└── dashboard-client.tsx              # NEW: main dashboard client component (wires all widgets)

app/(dashboard)/dashboard/
└── page.tsx                          # UPDATED: server hydration + dashboard-client

lib/supabase/queries/
├── dashboard.ts                      # UPDATED: new queries (stats, donut segments, registrar, promotions)
└── dashboard-client.ts               # NEW: client-side mutations (promotion confirm)

supabase/migrations/
├── 001_initial_schema.sql            # Existing
├── 002_promotions.sql                # NEW: promotions table + RLS
└── 003_registrar_index.sql           # NEW: idx_domains_registrar
```

**Structure Decision**: Components in `components/dashboard/`. Queries split into
server (`dashboard.ts`) and client (`dashboard-client.ts`) per constitution. Three
v1 components deleted first (timeline, TLD donut, 6-month toggle). Migrations applied
before code changes.

## Complexity Tracking

> No violations to justify.
