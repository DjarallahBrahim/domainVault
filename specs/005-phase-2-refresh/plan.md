# Implementation Plan: Phase 2 Refresh — Manual Domain Entry

**Branch**: `005-phase-2-refresh` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-phase-2-refresh/spec.md`

## Summary

Add manual single-domain entry to the existing Phase 2 domain management system.
Currently, all domains must be imported via CSV. This refresh adds a modal dialog form
("Add Domain") accessible from the Domains list page, allowing users to create
individual domain records without preparing a CSV file.

Technical approach: React Hook Form + Zod for the entry form, shadcn/ui Dialog for the
modal, existing `domains-client.ts` queries extended with `insertSingleDomain()`.
Domain name validation, TLD auto-derivation, and duplicate detection reuse the same
logic as CSV import. The form integrates seamlessly into the existing domain list page
with optimistic TanStack Query cache updates.

**Supabase connection**: Uses the existing browser client (`createClient`) for the
insert and the existing `domains` table with RLS from Phase 1. No new tables, no new
migrations, no new Route Handlers. The `domains-client.ts` file gets one new function;
all other files are new components.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, React Hook Form v7,
Zod v3, shadcn/ui (Dialog — already installed), date-fns v3, Lucide React

**Storage**: Supabase PostgreSQL — `domains` table (Phase 1); no schema changes

**Testing**: Manual E2E verification per spec acceptance scenarios

**Target Platform**: Vercel (serverless), modern browsers (Chrome, Firefox, Safari,
Edge — latest 2 versions)

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Manual entry form submit → domain visible in list <2s,
validation response <200ms

**Constraints**: No `service_role` key on client, no Route Handlers, server components
default, no new tables, no new npm dependencies, reuses all existing patterns

**Scale/Scope**: Single-domain entry, 1 new component, 2 updated components,
1 new query function, 1 new Zod schema

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation on all inputs, RLS on all tables | ✅ New form reuses Zod schema patterns; RLS on domains unchanged |
| I. Data Integrity & Security | Cross-table mutation integrity | ✅ Single-table insert (domains only); no cross-table concerns |
| I. Data Integrity & Security | Service role never exposed | ✅ Uses anon key + RLS; no Route Handlers |
| II. Architecture Discipline | Server Components default, typed helpers | ✅ Existing page structure unchanged; new query function in `-client.ts` |
| II. Architecture Discipline | Query file split pattern | ✅ New `insertSingleDomain()` in `domains-client.ts` (browser client) |
| II. Architecture Discipline | TanStack Query, optimistic updates | ✅ Insert mutation uses `useMutation` with optimistic cache update |
| III. UX Excellence | Toast notifications, inline errors, responsive | ✅ Success toast; inline Zod errors; modal dialog responsive on mobile |
| III. UX Excellence | Skeleton loaders on async fetches | ✅ Not applicable (form is instant; insert uses button loading state) |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | React Hook Form + Zod for forms | ✅ New form uses RHF + Zod manualEntrySchema |
| V. Phased Delivery | Spec, plan, tasks required | ✅ Spec complete; this plan; tasks to follow |

**GATE RESULT**: PASS — zero violations, zero unjustified deviations.

## Project Structure

### Documentation (this feature)

```text
specs/005-phase-2-refresh/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Phase 1 — form schema & entity model
├── quickstart.md        # Phase 1 — verification guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

New and modified files only. All existing files not listed remain untouched.

```text
components/domains/
├── domain-add-dialog.tsx           # NEW: Modal dialog with manual entry form (RHF + Zod)
├── domain-list-client.tsx          # UPDATED: Add "Add Domain" button, wire dialog
└── domain-empty-state.tsx          # UPDATED: Add "Add your first domain" CTA

lib/
├── supabase/queries/
│   └── domains-client.ts           # UPDATED: Add insertSingleDomain() function
└── validations/
    └── domain.ts                   # UPDATED: Add manualEntrySchema
```

**Structure Decision**: Single Next.js App Router project. Manual entry component goes
in `components/domains/` alongside existing domain components. The query function is
added to existing `domains-client.ts` (browser-side, follows query file split pattern).
The Zod schema is added to existing `lib/validations/domain.ts` (co-located with other
domain schemas). No new directories or route pages needed.

## Complexity Tracking

> No violations to justify — all constitution gates pass.
