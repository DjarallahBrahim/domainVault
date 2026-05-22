# Implementation Plan: Phase 4 — Sales Tracking & Earnings

**Branch**: `004-sales-tracking-earnings` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-sales-tracking-earnings/spec.md`

## Summary

Deliver a complete sales tracking system: log sales (from domain detail or Sales page),
auto-associate sales with domains (case-insensitive match), update domain status to
"sold", display a paginated sales list with earnings summary (total revenue, count,
average, highest), sort/filter by date range, edit and delete sales, and auto-revert
domain status when the last sale is deleted.

Technical approach: React Hook Form + Zod for the sale log/edit form, TanStack Query
for sales list fetching with optimistic updates, typed helpers in
`lib/supabase/queries/sales.ts`. Domain auto-association runs as a server-side lookup
during sale creation. The Sales page is a server component with TanStack Query hydration
(same pattern as domains list in Phase 2).

**Supabase connection**: All sales operations use the Supabase client with RLS from
Phase 1. No new tables — the `sales` table exists from Phase 1 migration. Domain status
changes (active→sold, sold→active) happen via Supabase `.update()` calls within the
sale create/delete flow.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, React Hook Form v7,
Zod v3, date-fns v3, shadcn/ui (Table, Card, Dialog, Badge, Input, Select, Toast)

**Storage**: Supabase PostgreSQL — `sales` table (Phase 1), `domains` table for
auto-association lookups; no new tables

**Testing**: Manual E2E verification per Definition of Done

**Target Platform**: Vercel (serverless), modern browsers

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Sales list <2s, sale log <2s, earnings summary <500ms

**Constraints**: No `service_role` on client, no Route Handlers, server components
default, RLS on sales table

**Scale/Scope**: Single-user portfolios, 1 sales table, earnings summary computed
on demand

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Phase 4 Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation, RLS on all tables | ✅ Sale form uses Zod; RLS on sales from Phase 1 |
| I. Data Integrity & Security | Service role never exposed | ✅ Anon key + RLS; no Route Handlers |
| II. Architecture Discipline | Server Components default, typed helpers | ✅ Sales page SSR + hydration; `lib/supabase/queries/sales.ts` |
| II. Architecture Discipline | TanStack Query, optimistic updates | ✅ Sale log/edit/delete use optimistic mutations |
| III. UX Excellence | Toast notifications, inline errors, responsive | ✅ Toast on sale log/delete; inline Zod errors; responsive layout |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | React Hook Form + Zod for forms | ✅ Sale log/edit form uses RHF + Zod |
| V. Phased Delivery | Phase 3 DoD must pass | ✅ Verified |

**GATE RESULT**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-sales-tracking-earnings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Phase 1 — sales data model
├── quickstart.md        # Phase 1 — developer onboarding
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/(dashboard)/sales/page.tsx              # Sales list + earnings summary (server + client)

components/sales/
├── sales-log-form.tsx                      # Sale log/edit form (RHF + Zod)
├── sales-list.tsx                          # Sales table (paginated, sortable)
├── sales-summary-cards.tsx                 # Earnings summary cards
├── sales-delete-dialog.tsx                 # Delete confirmation dialog
└── sales-empty-state.tsx                   # Empty state for no sales

lib/
├── supabase/queries/sales.ts               # Typed sales CRUD helpers
├── supabase/queries/sales-client.ts        # Client-side sales mutations
└── validations/sales.ts                    # Zod schemas for sale form
```

**Structure Decision**: Single Next.js App Router project. Sales components in
`components/sales/`. Queries split into server (`sales.ts`) and client (`sales-client.ts`)
to avoid `next/headers` leaking into client bundle (same pattern as Phase 2 domains).

## Complexity Tracking

> No violations to justify.
