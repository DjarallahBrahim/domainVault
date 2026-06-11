# Implementation Plan: Spaceship SellerHub Integration

**Branch**: `009-spaceship-integration` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-spaceship-integration/spec.md`

## Summary

Integrate Spaceship SellerHub marketplace API into DomainVault so users can list, edit price, and remove domain listings for sale. Follows the same UX architecture established in Phase 5 (Sedo Integration): cached listing status column, unified overlay form, global sync button, and per-domain sync. Built on Spaceship's REST/JSON API with API Key + Secret header auth.

Build order: Migrations → Settings → API Routes → Domains Page.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 14+ App Router

**Primary Dependencies**: next, supabase-js, @supabase/ssr, @tanstack/react-query v5, react-hook-form, zod, zustand, recharts, lucide-react, next-themes, date-fns

**Storage**: Supabase PostgreSQL — extend `user_settings` table (`spaceship_api_key`, `spaceship_api_secret`), new `spaceship_listings` cache table. All with RLS.

**Testing**: Manual QA via Vercel preview deploys. TypeScript compiler as safety net.

**Target Platform**: Web — Next.js on Vercel. Responsive 375px–1920px.

**Project Type**: Web application — single Next.js project, App Router, API route handlers, Supabase backend.

**Performance Goals**: Overlay opens <500ms (no extra DB fetch). Sync 500 listings <30s (paginated). Column loads at table render speed (cache read).

**Constraints**: No credentials on client. RLS on all tables. WCAG 2.1 AA. Zero TS errors. Coexists with Sedo column without layout regressions.

**Scale/Scope**: 3 new API routes. 3 new components (SpaceshipCell, SpaceshipOverlay, SpaceshipSyncButton). 3 new hooks (useSpaceshipListings, useSpaceshipSync, useSpaceshipRefreshOne). 1 new lib module. 1 new types file. 1 updated page (settings). 1 updated page (domains). 1 migration SQL (history).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Integrity & Security | ✅ PASS | RLS on new table. API credentials proxied server-side. Cache write-through. All mutations auditable. |
| II. Architecture Discipline | ✅ PASS | Server components default. Client components for interactivity only. API routes for secrets boundary. TanStack Query + centralized keys. Query file split pattern. |
| III. UX Excellence & Accessibility | ✅ PASS | Dark/light themes. Toast + inline errors. Skeleton loaders. Responsive overlay (mobile bottom sheet). Keyboard navigable. |
| IV. Code Quality & Performance | ✅ PASS | TypeScript strict. Zod validation. Batch sync. No per-row API calls. Migration file for history. |
| V. Phased Delivery & Verification | ✅ PASS | Independent Phase 6. Full DoD checklist. Build order respected. Vercel deploy with zero TS errors. |

## Project Structure

### Documentation (this feature)

```text
specs/009-spaceship-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── list.md
│   ├── get.md
│   ├── create.md
│   ├── update.md
│   └── delete.md
└── tasks.md             # Phase 2 output — NOT created by plan
```

### Source Code (repository root)

```text
# New files for Phase 6

app/api/spaceship/
├── list/route.ts               # GET  — Paginated SellerHub domains list
├── create/route.ts             # POST — Create SellerHub listing
├── get/route.ts                # GET  — Get single listing details
├── update/route.ts             # PATCH — Update listing price
└── delete/route.ts             # DELETE — Remove listing

lib/spaceship/
└── client.ts                   # REST client (API Key + Secret headers)

lib/hooks/
├── useSpaceshipListings.ts     # TanStack Query: read spaceship_listings as Map
├── useSpaceshipSync.ts         # TanStack Query mutation: full sync
└── useSpaceshipRefreshOne.ts   # Per-domain sync via get endpoint

components/domains/
├── SpaceshipCell.tsx           # Desktop table column cell
├── SpaceshipOverlay.tsx        # Unified create/edit/delete overlay
└── SpaceshipSyncButton.tsx     # Global sync button in toolbar

types/
└── spaceship.ts                # Credentials, Listing, InsertPayload types

# Modified files

components/settings/
└── SettingsPage.tsx            # [UPDATED] — Add Spaceship credentials section

components/domains/
├── domain-table.tsx            # [UPDATED] — Add Spaceship column
├── domain-card.tsx             # [UPDATED] — Add Spaceship card row
├── domain-list-client.tsx      # [UPDATED] — Wire hooks + overlays
└── domain-search.tsx           # [UPDATED] — Add "Not listed on Spaceship" filter

app/(dashboard)/domains/page.tsx  # [UPDATED] — Server-side filter

lib/query-keys.ts               # [UPDATED] — Add spaceship-listings + settings keys
lib/supabase/queries/           # [UPDATED] — New queries for spaceship_listings
types/supabase.ts               # [UPDATED] — new table + columns

supabase/migrations/
└── 007_spaceship_listings.sql  # [NEW] — History/documentation
```

**Structure Decision**: Follows the proven Phase 5 pattern. Separate `lib/spaceship/` module for the REST client. Separate `spaceship_listings` cache table. Extends `user_settings` with Spaceship-specific columns. Components mirror Sedo equivalents (`SpaceshipCell` vs `SedoCell`).

## Complexity Tracking

> No constitution violations. No complexity justifications needed.

## Build Order

1. **Migrations (history)**: Add migration SQL file. Create `spaceship_listings` table + RLS. Add `spaceship_api_key` + `spaceship_api_secret` columns to `user_settings`.
2. **Settings Page**: Add Spaceship credentials form (API Key + Secret). Test connection + save.
3. **API Routes + Lib**: Build `lib/spaceship/client.ts` and all 5 API routes. Each route follows: auth → fetch credentials → call Spaceship API → return.
4. **Domains Page**: Build SpaceshipCell, SpaceshipOverlay, SpaceshipSyncButton, hooks. Add column to table + card. Update filters.
