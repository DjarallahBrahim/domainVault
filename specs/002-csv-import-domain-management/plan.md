# Implementation Plan: Phase 2 — CSV Import & Domain Management

**Branch**: `002-csv-import-domain-management` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-csv-import-domain-management/spec.md`

## Summary

Deliver bulk CSV import with duplicate handling choice (skip vs update), a paginated
domain list with search/filter/sort, domain detail view with editing, single and bulk
delete, and import log history. This phase transforms Phase 1's database schema into a
working portfolio management experience.

Technical approach: TanStack Query v5 for all client-side data fetching with centralized
query keys, PapaParse v5 for client-side CSV parsing with server-side batch upsert via
Supabase, React Hook Form + Zod for the domain edit form, and optimistic updates on all
mutations (edits, deletes). CSV columns are validated client-side; valid rows are sent to
Supabase in a single batch operation. Search and duplicate detection are case-insensitive
throughout.

**Supabase connection**: All domain and import_log operations go through the Supabase JS
client using the public `anon` key. RLS policies from Phase 1 enforce per-user isolation.
Batch operations use typed helpers in `/lib/supabase/queries/`. No custom Route Handlers
are created for CRUD — all mutations hit Supabase directly from client components or
server components.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, PapaParse v5,
React Hook Form v7, Zod v3, shadcn/ui (Table, Dialog, Select, Badge, Toast),
date-fns v3, Zustand v4

**Storage**: Supabase PostgreSQL — `domains` and `import_logs` tables (created in Phase 1)
with RLS policies already in place

**Testing**: Manual E2E verification per Definition of Done (test framework TBD
in a future phase)

**Target Platform**: Vercel (serverless), modern browsers (Chrome, Firefox, Safari,
Edge — latest 2 versions)

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: CSV import 1,000 rows <10s, 10,000 rows <60s, domain list
page <2s, search result <5s for 1,000 domains, edit save <2s, single delete <1s,
bulk delete (50) <5s

**Constraints**: No `service_role` key on client, no Route Handlers for standard
CRUD, batch inserts only (single-row loops prohibited per constitution), server
components by default for data fetching, 10 MB file upload limit, 50 domains/page,
max 50 bulk delete

**Scale/Scope**: Single-user portfolios, 2 data tables (domains, import_logs),
up to 50,000 domains per CSV, 50 domains per paginated page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Phase 2 Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation on all inputs, RLS on all tables | ✅ Domain edit form uses Zod; RLS on domains + import_logs enforced from Phase 1 |
| I. Data Integrity & Security | CSV malformed rows logged, skipped, never corrupt data | ✅ PapaParse validates client-side; invalid rows written to import_logs JSONB errors; batch upsert skips conflicts |
| I. Data Integrity & Security | All mutations traceable via timestamps + user_id FK | ✅ domains.updated_at triggers on edit; import_logs records every import with user_id |
| I. Data Integrity & Security | Service role never exposed to client | ✅ Phase 2 uses Supabase anon key + RLS; no Route Handlers needed |
| II. Architecture Discipline | Server Components default | ✅ Domain list page fetches via server component; detail page server-rendered with TanStack Query hydration |
| II. Architecture Discipline | TanStack Query for client fetches, typed helpers | ✅ Centralized query keys in `lib/query-keys.ts`; typed supersede in `lib/supabase/queries/` |
| II. Architecture Discipline | Optimistic updates on every mutation | ✅ Edit save, delete, bulk delete all use TanStack Query optimistic updates |
| III. UX Excellence | Skeleton loaders, toast notifications, inline errors | ✅ Domain list skeleton table; import progress indicator; toast for import/save/delete results; inline Zod errors on edit form |
| III. UX Excellence | Responsive 375px–1920px; domain table per breakpoints | ✅ Card layout <480px, scrollable 480–767px, full table ≥768px per constitution |
| IV. Code Quality | TypeScript strict, zero `any`, ESLint + Prettier | ✅ Enforced in CI; no new `any` types |
| IV. Code Quality | React Hook Form + Zod for forms | ✅ Domain edit form uses RHF + Zod schema in `lib/validations/domain.ts` |
| IV. Code Quality | Batch inserts for CSV, indexes on expiration_date + status | ✅ PapaParse + single Supabase batch upsert; indexes exist from Phase 1 migration |
| V. Phased Delivery | Phase 1 DoD must pass before Phase 2 | ✅ Phase 1 DoD verified (see Phase 1 plan) |

**GATE RESULT**: PASS — zero violations, zero unjustified deviations.

## Project Structure

### Documentation (this feature)

```text
specs/002-csv-import-domain-management/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions & best practices
├── data-model.md        # Phase 1 — updated entity models & query patterns
├── quickstart.md        # Phase 1 — developer onboarding guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
└── (dashboard)/
    ├── domains/
    │   ├── page.tsx                      # Domain list (server component, TanStack Query hydration)
    │   └── [id]/
    │       └── page.tsx                  # Domain detail + edit (client component)
    └── import/
        ├── page.tsx                      # CSV import page (client component)
        └── history/
            └── page.tsx                  # Import log history (client component)

components/
├── domains/                              # New: domain feature components
│   ├── domain-table.tsx                  # Paginated, sortable, filterable table
│   ├── domain-card.tsx                   # Mobile card layout (<480px)
│   ├── domain-detail-form.tsx            # Edit form (RHF + Zod)
│   ├── domain-search.tsx                 # Search input + filter dropdowns
│   ├── domain-delete-dialog.tsx          # Single + bulk delete confirmation
│   ├── domain-status-badge.tsx           # Status badge (active/expired/sold/pending)
│   ├── domain-expiry-badge.tsx           # Expiry countdown badge with color mapping
│   └── domain-empty-state.tsx            # Empty state with import CTA
├── import/                               # New: CSV import feature components
│   ├── csv-uploader.tsx                  # Drag-and-drop file upload zone
│   ├── csv-progress.tsx                  # Import progress bar + row counter
│   ├── csv-summary.tsx                   # Post-import results card
│   └── csv-option-toggle.tsx             # "Skip existing" / "Update existing" toggle
├── history/                              # New: import log history components
│   ├── import-log-list.tsx               # Import history table
│   └── import-log-detail.tsx             # Expandable error detail panel
└── ui/
    ├── table.tsx                         # New: shadcn/ui Table component
    ├── dialog.tsx                        # New: shadcn/ui Dialog component
    ├── select.tsx                        # New: shadcn/ui Select component
    ├── badge.tsx                         # New: shadcn/ui Badge component
    ├── toast.tsx                         # New: shadcn/ui Sonner toast
    └── skeleton.tsx                      # New: shadcn/ui Skeleton component

lib/
├── supabase/
│   └── queries/
│       ├── domains.ts                    # New: typed domain CRUD helpers
│       └── import-logs.ts               # New: typed import log read helpers
├── validations/
│   └── domain.ts                         # New: Zod schemas for domain edit + CSV row
└── query-keys.ts                         # New: centralized TanStack Query keys

types/
└── supabase.ts                           # Existing: auto-generated (already covers domains, import_logs)
```

**Structure Decision**: Single Next.js App Router project. New feature components
live under `components/domains/`, `components/import/`, and `components/history/`.
New shadcn/ui primitives added to `components/ui/`. All database access goes through
typed helpers in `lib/supabase/queries/`. TanStack Query keys centralized in
`lib/query-keys.ts`. Zod schemas for domain validation in `lib/validations/domain.ts`.

## Complexity Tracking

> No violations to justify — all constitution gates pass for Phase 2.
