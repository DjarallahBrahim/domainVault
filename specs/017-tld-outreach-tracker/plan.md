# Implementation Plan: Promoting (TLD Outreach Tracker)

**Branch**: `017-tld-outreach-tracker` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-tld-outreach-tracker/spec.md`

## Summary

A new `/promoting` page where a user picks one of their domains and sees every reserved TLD variant of that domain (data already computed by the TLD Reservation Checker, Phases 14–22). For each reserved TLD the user tracks manual outreach: a Contacted checkbox and a Reply status (Pending / Positive / Negative). If the selected domain was never checked (or has zero reserved TLDs), a one-click "Run TLD Check" reuses the existing single-domain refresh capability — no new DNS logic is built.

**Technical approach**: One new migration (`tld_outreach` table), three TanStack Query hooks (`usePromotingDomains`, `useReservedTlds`, `useTldOutreach`), one new dashboard route (`app/(dashboard)/promoting/page.tsx`), and six client components. Writes are plain Supabase upserts (RLS-protected) with optimistic updates; reads reuse the existing Phase 18 extensions/refresh routes. No new third-party network calls.

## Technical Context

**Language/Version**: TypeScript strict mode, React 18, Next.js 14+ App Router

**Primary Dependencies**: shadcn/ui (Command/Popover, Checkbox, Select, Badge, Card, Skeleton, Table), TanStack Query v5, Lucide React, Supabase client, date-fns

**Storage**: New `tld_outreach` table (Migration 009) with RLS. Reads from `domains.reserved_tlds_count` / `tlds_last_checked_at` (Phase 14 columns) and the Phase 18 extensions route. No new external services.

**Testing**: Manual UI verification + `npx tsc --noEmit`. Migration verified via `supabase gen types typescript > types/supabase.ts` + SQL apply.

**Target Platform**: Web (Vercel) — responsive from 375px mobile (stacked cards + scroll chips) through 1920px desktop (table layout)

**Project Type**: Web application — Next.js App Router, client components for interactive widgets

**Performance Goals**: Reserved TLDs visible within 3s of domain selection; checkbox/reply toggles update instantly (optimistic); no extra DB fetch when opening a domain picker option beyond the lightweight list

**Constraints**: Reuse the existing design system (plan.md §4) and shadcn/ui primitives. Reuse Phase 18 routes as-is. Writes go through the RLS-protected Supabase client (standard CRUD — no Route Handlers). No new third-party calls. `contacted_at` / `reply_at` timestamps set by the application at write time (the migration defines the columns; no DB trigger).

**Scale/Scope**: 1 migration, 3 new hooks, 1 new page route + nav entry, 7 new components, 1 new types file, 2 additions to `lib/query-keys.ts`, 1 new typed query file (`lib/supabase/queries/outreach-client.ts`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Data Integrity & Security** | PASS | Migration 009 adds `tld_outreach` with RLS policy `auth.uid() = user_id` and a `UNIQUE(domain_id, tld)` constraint (one tracking row per variant, no duplicates). Rows are created lazily on first interaction — no pre-seeding. `contacted_at` / `reply_at` are set at write time and cleared when state reverts. Reads and writes are scoped to the authenticated user; the reused Phase 18 routes already enforce ownership server-side. |
| **II. Architecture Discipline** | PASS | All new components are Client Components — required for interactivity (combobox, checkboxes, selects, optimistic updates). Standard CRUD goes through the RLS-protected Supabase browser client via typed helpers in `lib/supabase/queries/outreach-client.ts` — no Route Handlers, matching the domain-CRUD pattern (US-010/US-011). TanStack Query with centralized keys added to `lib/query-keys.ts`. No server-only dependency (`next/headers`) is introduced, so no query-file split is needed beyond the existing client pattern. |
| **III. UX Excellence & Accessibility** | PASS | Skeleton loaders on every async section (picker, table, summary cards). Optimistic toggles roll back to a toast on failure. Reply select disabled until contacted with explanatory tooltip. Both dark/light themes styled via CSS variables only; keyboard-navigable combobox/checkbox/select; responsive 375px–1920px. |
| **IV. Code Quality & Performance** | PASS | TypeScript strict, zero `any` in new code, no new dependencies. Only 3 lightweight reads on page load (picker list, reserved TLDs, outreach rows), no N+1. Sort applied client-side (per-domain reserved-TLD volume is small). Migration indexed on `user_id`, `domain_id`, `reply_status`. |
| **V. Phased Delivery & Verification** | PASS | Independently shippable page with a clear DoD (migration → hooks → page/components → polish). Reuses Phase 18 routes and Phase 14 columns — no change to existing DNS logic. Verifiable via `npx tsc --noEmit` + manual UI checklist. |

**Gate verdict**: PASS.

**Post-design re-check (after Phase 1)**: PASS — no new violations introduced. Design adds one typed query file (`outreach-client.ts`) and one migration, both conforming to the constitution (typed helpers, browser-client CRUD, RLS policy, optimistic updates, centralized query keys). The only Route Handler used is the *existing* Phase 18 refresh route, which performs server-side DNS work (not standard CRUD) — appropriate reuse, not a new pattern.

## Project Structure

### Documentation (this feature)

```text
specs/017-tld-outreach-tracker/
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
supabase/migrations/
└── 009_tld_outreach.sql          # NEW: tld_outreach table + RLS + indexes

types/
└── promoting.ts                  # NEW: PromotingDomainOption, ReservedTld, ReplyStatus, OutreachRow

app/(dashboard)/
├── promoting/page.tsx            # NEW: route shell, delegates to PromotingPage
└── layout.tsx                    # EDIT: add Promoting to sidebar nav + mobile tab bar (Megaphone icon)

components/promoting/
├── PromotingPage.tsx             # NEW: page shell, layout, state orchestration
├── DomainPicker.tsx              # NEW: searchable combobox (Command + Popover)
├── PromotingSummaryCards.tsx     # NEW: 3 KPI-style cards for the selected domain
├── ReservedTldTable.tsx          # NEW: desktop table (TLD / Contacted / Reply)
├── ReservedTldCardRow.tsx        # NEW: mobile stacked-card layout
├── ReplyStatusSelect.tsx         # NEW: status pill select
└── RunTldCheckPrompt.tsx         # NEW: empty-state CTA (never checked / 0 reserved / no list)

lib/hooks/
├── usePromotingDomains.ts        # NEW: lightweight domain options for the picker
├── useReservedTlds.ts            # NEW: reserved TLDs for selected domain (Phase 18 route)
└── useTldOutreach.ts             # NEW: outreach rows + optimistic toggleContacted/setReplyStatus

lib/supabase/queries/
└── outreach-client.ts            # NEW: typed browser-client helpers (upsertOutreachRow, fetchOutreachRows)

lib/query-keys.ts                 # EDIT: add `promoting` namespace
```

**Structure Decision**: Single Next.js App Router project. New feature code lives under `components/promoting/`, `lib/hooks/`, and `lib/supabase/queries/` alongside the established feature directories. The page is a thin server route that renders a client shell. All data access uses typed helpers; the Phase 18 routes (`GET /api/tld-checker/domains/:domainId/extensions`, `POST /api/tld-checker/domains/:domainId/refresh`) are reused without modification.

## Complexity Tracking

> No violations.