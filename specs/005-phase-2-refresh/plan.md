# Implementation Plan: Phase 2 Refresh — Full v2 Alignment

**Branch**: `005-phase-2-refresh` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-phase-2-refresh/spec.md`

## Summary

Align the existing Phase 2 codebase with the v2 master plan. This involves 7 user
stories: 3 updates to existing components (CSV preview adding Registrar column,
domain list adding Registrar + Enter-key search + pagination options + CSV export,
domain add/edit converting from modal dialog to slide-over panel with Status field,
registrar autocomplete, and tag chips), and 4 new features (multi-domain
comma-separated search, improved filters with expiry window/registrar multi-select/
status multi-select/URL sync, manual entry tab on Import page, CSV column reference
banner).

Technical approach: shadcn/ui Sheet for slide-over panel, custom chip input component,
URL search params for filter state serialization, `ilike()` OR-logic for multi-domain
search, client-side Blob for CSV export. No new npm dependencies, no new database
migrations. One component deleted: `domain-add-dialog.tsx` replaced by
`domain-add-slideover.tsx`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, TanStack Query v5, React Hook Form v7,
Zod v3, shadcn/ui (Sheet, Dialog, Table, Select, Badge, Input, Textarea — all already
installed), PapaParse v5, date-fns v3, Lucide React

**Storage**: Supabase PostgreSQL — `domains` table (Phase 1); no schema changes

**Testing**: Manual E2E verification per spec acceptance scenarios

**Target Platform**: Vercel (serverless), modern browsers

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Preview table <2s for 1000 rows, filter apply <500ms,
slide-over animate <300ms, export CSV <3s for 1000 domains, CSV reference copy <200ms

**Constraints**: 0 new npm deps, 0 new DB migrations, no Route Handlers,
server components default, all existing patterns preserved

**Scale/Scope**: 1 deleted file, 12 changed files, 4 new files. Affects:
Domains page, Import page, CSV import flow, domain list table, filter/search bar.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation, RLS | ✅ All forms use Zod; RLS on domains unchanged |
| I. Data Integrity & Security | Service role never exposed | ✅ Anon key + RLS; no Route Handlers |
| II. Architecture Discipline | Server Components default, typed helpers | ✅ Page SSR + client queries split as before |
| II. Architecture Discipline | Query file split pattern | ✅ New queries in `-client.ts` files only |
| II. Architecture Discipline | TanStack Query, optimistic updates | ✅ All mutations use `useMutation` with cache invalidation |
| III. UX Excellence | Toast, inline errors, responsive | ✅ Toasts on add/save; inline Zod errors; slide-over responsive |
| III. UX Excellence | Skeleton loaders | ✅ Existing skeletons preserved; new slide-over loads instantly |
| IV. Code Quality | TypeScript strict, zero `any` | ✅ Enforced |
| IV. Code Quality | React Hook Form + Zod for forms | ✅ Slide-over form + Import tab form use RHF + Zod |
| V. Phased Delivery | Spec, plan, tasks required | ✅ Spec updated; this plan; tasks to follow |

**GATE RESULT**: PASS — zero violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-phase-2-refresh/
├── plan.md              # This file
├── spec.md              # Feature specification (updated)
├── research.md          # Technology decisions (updated)
├── data-model.md        # Form schemas & entity model (updated)
├── quickstart.md        # Verification guide (updated)
└── tasks.md             # Task list (to be regenerated)
```

### Source Code (repository root)

```text
components/domains/
├── domain-add-dialog.tsx          # [DELETED] — remove; replaced by slide-over
├── domain-add-slideover.tsx       # NEW: Slide-over panel (US-010, replaces dialog)
├── domain-list-client.tsx         # UPDATED: Enter-key search, Registrar column, pagination 25/50/100, Export CSV, multi-domain search
├── domain-empty-state.tsx         # UPDATED: Slide-over trigger (replaces dialog trigger)
├── domain-search.tsx              # UPDATED: Enter-key only, multi-domain comma parsing, expiry window filter
├── domain-table.tsx               # UPDATED: Add Registrar column
├── tag-input.tsx                  # NEW: Chip input component (reusable for tags)

components/import/
├── csv-uploader.tsx               # UPDATED: Add CSV column reference banner (US-031)
├── csv-summary.tsx                # UPDATED: Add Registrar column to preview (US-007)
├── manual-entry-tab.tsx           # NEW: "Add Manually" tab form (US-030)

app/(dashboard)/
├── domains/page.tsx               # No change (server component)
└── import/page.tsx                # UPDATED: Add tab UI (CSV Upload / Add Manually)

lib/
├── supabase/queries/domains-client.ts  # UPDATED: fetchRegistrarList() for autocomplete + multi-filter support
└── validations/domain.ts               # No change (manualEntrySchema reused)
```

**Structure Decision**: Single Next.js App Router project. New components in
`components/domains/` and `components/import/`. Tab UI on Import page is a
state-toggle pattern (no new dependency). Tag chip input is a reusable component.

## Complexity Tracking

> No violations to justify.
