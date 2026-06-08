# Implementation Plan: Sedo Integration

**Branch**: `008-sedo-integration` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-sedo-integration/spec.md`

## Summary

Integrate Sedo marketplace API into DomainVault so users can list, edit price, and remove domain listings without leaving the platform. A cached Sedo column shows listing status in the Domains table (no per-row API calls). A global Sync button refreshes all listings at once. Credentials are configured in the Settings page via a new Sedo Credentials form section.

Build order per plan.md: Step 1 — Migrations → Step 2 — Settings Page → Step 3 — API Routes → Step 4 — Domains Page.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 14+ App Router

**Primary Dependencies**: @xmldom/xmldom (new — XML parsing for Sedo API), @types/xmldom (new — type definitions), next, supabase-js, @supabase/ssr, @tanstack/react-query v5, react-hook-form, zod, zustand, recharts, lucide-react, next-themes, date-fns

**Storage**: Supabase PostgreSQL — existing tables (domains, sales, import_logs, promotion_events) plus new tables (user_settings, sedo_listings) and new column (domains.bin). All with RLS enabled.

**Testing**: Manual QA via Vercel preview deploys. TypeScript compiler as primary safety net. No automated test framework configured.

**Target Platform**: Web — Next.js on Vercel. All major browsers (Chrome, Firefox, Safari, Edge). Responsive 375px–1920px.

**Project Type**: Web application — single Next.js project with App Router, API route handlers, and Supabase backend.

**Performance Goals**: Sedo overlay opens in <500ms (no extra DB fetch — data from table row). Sync of 500 listings in <30s (paginated, 100/request). Sedo column loads at table render speed (cache read, not API call).

**Constraints**: No `service_role` key on client. RLS on all tables. WCAG 2.1 AA minimum. Zero TypeScript errors. No per-row API calls for Sedo column. Sedo credentials never serialized to client state or logs.

**Scale/Scope**: Single-user portfolio management. 5 new API route handlers. 4 new components (SedoCell, SedoCardRow, SedoOverlay, SedoSyncButton). 2 new hooks (useSedoListings, useSedoSync). 2 new lib modules (client.ts, pricing.ts). 1 new types file (sedo.ts). 3 migration SQL files (history only). 1 updated page (settings). 1 updated page (domains).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Integrity & Security | ✅ PASS | RLS on new tables (user_settings, sedo_listings). Sedo credentials never exposed to client (proxied via API routes). Cache write-through pattern: upsert on success, delete on removal, stale-row cleanup on sync. All mutations auditable via timestamps. |
| II. Architecture Discipline | ✅ PASS | Server Components default for data fetching. Client Components only for interactivity (overlay, sync button, Sedo cell states). API routes used exclusively for Sedo secrets boundary. TanStack Query for client-side fetches with centralized keys. Query file split pattern — no `next/headers` leaks to client. |
| III. UX Excellence & Accessibility | ✅ PASS | Dark/light theme support throughout. Toast notifications for async results (sync, list, edit, remove). Inline errors for form validation and Sedo faults in overlay. Skeleton loaders during sync. Keyboard-navigable overlay (Escape to close, Tab through fields). Responsive overlay as bottom sheet on mobile. |
| IV. Code Quality & Performance | ✅ PASS | TypeScript strict mode, zero `any` types. Zod schemas for credential validation, overlay form pricing. Batch sync via paginated Sedo API (100/request). No per-row API calls — Sedo column reads from Supabase cache with TanStack Query. `@xmldom/xmldom` XML parsing server-side only. Migration files for history. |
| V. Phased Delivery & Verification | ✅ PASS | Independent Phase 5 — no dependency on incomplete phases. Full Definition of Done checklist from spec. Build order: Migrations → Settings → API → Domains. Each step independently testable. Vercel deploy with zero TS errors required. |

## Project Structure

### Documentation (this feature)

```text
specs/008-sedo-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — database schema
├── quickstart.md        # Phase 1 output — dev setup guide
├── contracts/           # Phase 1 output — API contracts
│   ├── check.md
│   ├── list.md
│   ├── insert.md
│   ├── edit.md
│   └── delete.md
└── tasks.md             # Phase 2 output — NOT created by plan
```

### Source Code (repository root)

```text
# New files for Phase 5 (all [NEW] — do not exist yet)

app/
├── api/sedo/                        # Route Handlers (server-side secrets boundary)
│   ├── check/route.ts               # GET  — CheckMember
│   ├── list/route.ts                # GET  — DomainList (paginated)
│   ├── insert/route.ts              # POST — DomainInsert
│   ├── edit/route.ts                # POST — DomainEdit
│   └── delete/route.ts              # POST — DomainDelete
├── (dashboard)/settings/
│   └── page.tsx                     # [UPDATED] — Add Account section + Sedo form

components/
├── settings/
│   ├── SettingsPage.tsx             # [NEW] — Settings layout with sections
│   └── SedoCredentialsForm.tsx      # [NEW] — Sedo credential fields + test + save
├── domains/
│   ├── DomainTable.tsx              # [UPDATED] — Add BIN + Sedo columns
│   ├── DomainMobileCard.tsx         # [UPDATED] — Add BIN + Sedo rows
│   ├── SedoCell.tsx                 # [NEW] — Desktop table Sedo column cell
│   ├── SedoCardRow.tsx              # [NEW] — Mobile card Sedo row
│   ├── SedoOverlay.tsx              # [NEW] — Unified create/edit/delete overlay
│   └── SedoSyncButton.tsx           # [NEW] — Global sync button in toolbar

lib/
├── sedo/
│   ├── client.ts                    # [NEW] — callSedo(): XML fetch + parse
│   └── pricing.ts                   # [NEW] — computeSedoPricing(), suggestion chips
├── hooks/
│   ├── useSedoListings.ts           # [NEW] — TanStack Query: read sedo_listings
│   └── useSedoSync.ts               # [NEW] — TanStack Query: mutation for sync
├── supabase/queries/
│   ├── settings.ts                  # [NEW] — Server-safe user_settings CRUD
│   ├── settings-client.ts           # [NEW] — Client-safe user_settings mutations
│   ├── sedo-listings.ts             # [NEW] — Server-safe sedo_listings queries
│   └── sedo-listings-client.ts      # [NEW] — Client-safe sedo_listings mutations
└── query-keys.ts                    # [UPDATED] — Add sedo-listings key

types/
└── sedo.ts                          # [NEW] — SedoCredentials, SedoListing, etc.

supabase/migrations/
├── 004_bin_column.sql               # [NEW] — History: ALTER TABLE domains ADD COLUMN bin
├── 005_user_settings.sql            # [NEW] — History: CREATE TABLE user_settings
└── 006_sedo_listings.sql            # [NEW] — History: CREATE TABLE sedo_listings
```

**Structure Decision**: Single Next.js App Router project — consistent with the existing codebase. API routes under `app/api/sedo/` follow Next.js conventions. Query file split pattern enforced for settings and sedo-listings modules. Migration files are for history/documentation only (tables already exist in Supabase).

## Complexity Tracking

> No constitution violations. No complexity justifications needed.

## Build Order

Step execution order from plan.md, enforced by dependencies:

1. **Step 1 — Migrations (history)**: Add migration SQL files to `supabase/migrations/`. Tables already exist — files are documentation only.
2. **Step 2 — Settings Page**: Build Settings page with Account section + Sedo Credentials form. Credentials must exist before any API call can work. Run migration scripts to create `user_settings` RLS policy (already done — file for history).
3. **Step 3 — API Routes + Lib**: Build `lib/sedo/client.ts`, `lib/sedo/pricing.ts`, and all 5 API routes. Each route follows the shared pattern: auth → fetch credentials → call Sedo → return. Install `@xmldom/xmldom`.
4. **Step 4 — Domains Page**: Build Sedo components (SedoCell, SedoCardRow, SedoOverlay, SedoSyncButton), hooks (useSedoListings, useSedoSync), types (sedo.ts). Add BIN + Sedo columns to existing DomainTable and DomainMobileCard.
