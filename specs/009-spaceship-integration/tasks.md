# Tasks: Spaceship SellerHub Integration

**Input**: Design documents from `specs/009-spaceship-integration/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router at repository root (`app/`, `components/`, `lib/`, `types/`)
- Source paths match the existing DomainVault project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migration history, shared types, query keys

- [ ] T001 [P] Add migration SQL file 007 — `spaceship_listings` table + `user_settings` columns in `supabase/migrations/007_spaceship_listings.sql`
- [ ] T002 [P] Create shared Spaceship TypeScript types in `types/spaceship.ts`
- [ ] T003 [P] Add `spaceship_listings` table type and new `user_settings` columns to `types/supabase.ts`
- [ ] T004 Add `['spaceship-listings']` query key to `lib/query-keys.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Build Spaceship REST client with header auth, 401/429/5xx handling in `lib/spaceship/client.ts`
- [ ] T006 [P] Create server-safe queries for `spaceship_listings` in `lib/supabase/queries/spaceship-listings.ts`
- [ ] T007 [P] Create client-safe mutations for `spaceship_listings` (upsert, delete, stale cleanup) in `lib/supabase/queries/spaceship-listings-client.ts`
- [ ] T008 Build API route `GET /api/spaceship/list` (paginated listing fetch) in `app/api/spaceship/list/route.ts`
- [ ] T009 Build API route `GET /api/spaceship/get` (single domain lookup) in `app/api/spaceship/get/route.ts`
- [ ] T010 Build API route `POST /api/spaceship/create` (create listing) in `app/api/spaceship/create/route.ts`
- [ ] T011 Build API route `POST /api/spaceship/update` (update price) in `app/api/spaceship/update/route.ts`
- [ ] T012 Build API route `POST /api/spaceship/delete` (remove listing) in `app/api/spaceship/delete/route.ts`
- [ ] T013 Build `useSpaceshipListings` hook — TanStack Query, returns `Map<domain_id, SpaceshipListing>` in `lib/hooks/useSpaceshipListings.ts`
- [ ] T014 Build `useSpaceshipSync` hook — full sync mutation with stale-row cleanup in `lib/hooks/useSpaceshipSync.ts`
- [ ] T015 Build `useSpaceshipRefreshOne` hook — per-domain sync with direct `setQueryData` cache update in `lib/hooks/useSpaceshipRefreshOne.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Configure Spaceship Credentials (Priority: P1) 🎯 MVP

**Goal**: Users can enter, test, and save Spaceship API Key + Secret from Settings.

**Independent Test**: Navigate to Settings → enter API Key + Secret → test connection → save → revisit to verify pre-fill.

### Implementation for User Story 1

- [ ] T016 [US1] Add Spaceship credentials form component (API Key + Secret fields, show/hide toggle, masked pre-fill) in `components/settings/SpaceshipCredentialsForm.tsx`
- [ ] T017 [US1] Wire "Test Connection" button to `GET /api/spaceship/list?take=1` and display inline `✅ Connected` / `❌ Invalid credentials` badge in `components/settings/SpaceshipCredentialsForm.tsx`
- [ ] T018 [US1] Wire "Save Credentials" button to upsert `user_settings` (validate both fields required), show success toast in `components/settings/SpaceshipCredentialsForm.tsx`
- [ ] T019 [US1] Pre-fill credentials on page load from `user_settings` in `components/settings/SpaceshipCredentialsForm.tsx`
- [ ] T020 [US1] Add helper text with link to Spaceship API Manager in `components/settings/SpaceshipCredentialsForm.tsx`
- [ ] T021 [US1] Render `SpaceshipCredentialsForm` in `SettingsPage` component in `components/settings/SettingsPage.tsx`

**Checkpoint**: Settings page has Spaceship section — test connection and save work

---

## Phase 4: User Story 2 — View SellerHub Listing Status (Priority: P1)

**Goal**: Domains table shows a Spaceship column with cached listing status alongside Sedo.

**Independent Test**: View Domains page — verify Spaceship column shows "Not Listed" for all domains (empty cache) until sync populates it.

### Implementation for User Story 2

- [ ] T022 [US2] Build `SpaceshipCell` component — State A ("Not Listed" + ↻ + + icons) and State B (`$price` + ↻ + ✏️ icons) in `components/domains/SpaceshipCell.tsx`
- [ ] T023 [US2] Add `Spaceship` column header to desktop table in `components/domains/domain-table.tsx`
- [ ] T024 [US2] Integrate `SpaceshipCell` into table as column after Sedo, wire useSpaceshipListings Map in `components/domains/domain-table.tsx`
- [ ] T025 [US2] Add `Spaceship` row (separated by border-t) to mobile domain cards — reuse SpaceshipCell logic inline in `components/domains/domain-card.tsx`
- [ ] T026 [US2] Wire `useSpaceshipListings` hook into `domain-list-client.tsx` and pass listings/refreshing states to table and card components in `components/domains/domain-list-client.tsx`

**Checkpoint**: Spaceship column renders. All rows show "Not Listed" until sync (US6).

---

## Phase 5: User Story 3 — List a Domain on SellerHub (Priority: P1)

**Goal**: Users can list a domain on Spaceship via overlay with asking price and suggestion chips.

**Independent Test**: From a domain row, click + → fill price → submit → verify domain listed and column shows price.

### Implementation for User Story 3

- [ ] T027 [US3] Build `SpaceshipOverlay` base component — read-only domain info (domain, registrar, expiry), Asking Price field in `components/domains/SpaceshipOverlay.tsx`
- [ ] T028 [US3] Implement Asking Price suggestion chips (BIN, BIN−20%, BIN−30%) — hidden when `bin` is null in `components/domains/SpaceshipOverlay.tsx`
- [ ] T029 [US3] Implement create mode — + icon trigger from SpaceshipCell in `components/domains/SpaceshipOverlay.tsx`
- [ ] T030 [US3] Implement create submit: POST `/api/spaceship/create` → upsert cache → save `bin` if null → invalidate + toast + close in `components/domains/SpaceshipOverlay.tsx`
- [ ] T031 [US3] Add loading spinner on CTA + inputs disabled during API call in `components/domains/SpaceshipOverlay.tsx`
- [ ] T032 [US3] Add inline error display for Spaceship API faults (above footer, not toast) in `components/domains/SpaceshipOverlay.tsx`
- [ ] T033 [US3] Add inline validation for empty required fields + block when no credentials in `components/domains/SpaceshipOverlay.tsx`

**Checkpoint**: Create flow works end-to-end — domain listed, cache updated, column shows price.

---

## Phase 6: User Story 4 — Edit an Existing SellerHub Listing (Priority: P2)

**Goal**: Users can change the price on a domain already listed on Spaceship.

**Independent Test**: Click ✏️ on listed domain → change price → submit → verify cache updates.

### Implementation for User Story 4

- [ ] T034 [US4] Implement edit mode — pre-fill Asking Price from cached value, ✏️ trigger in `components/domains/SpaceshipOverlay.tsx`
- [ ] T035 [US4] Implement edit mode footer with "Update" CTA + "Remove from Spaceship" button in `components/domains/SpaceshipOverlay.tsx`
- [ ] T036 [US4] Implement edit submit: POST `/api/spaceship/update` → upsert cache → save `bin` if null → invalidate + toast + close in `components/domains/SpaceshipOverlay.tsx`

**Checkpoint**: Edit flow works — price updated, cache refreshed, cell re-renders.

---

## Phase 7: User Story 5 — Remove a Domain from SellerHub (Priority: P2)

**Goal**: Users can delist a domain with inline confirmation.

**Independent Test**: Open overlay in edit mode → "Remove from Spaceship" → confirm → verify domain delisted and cell reverts.

### Implementation for User Story 5

- [ ] T037 [US5] Implement inline confirmation bar — "Remove from Spaceship? [Yes] [Cancel]" in `components/domains/SpaceshipOverlay.tsx`
- [ ] T038 [US5] Implement remove flow: POST `/api/spaceship/delete` → delete cache row → invalidate + toast + close in `components/domains/SpaceshipOverlay.tsx`
- [ ] T039 [US5] Implement cancel behavior — collapses confirmation bar, returns to edit state in `components/domains/SpaceshipOverlay.tsx`

**Checkpoint**: Remove flow works — delisted from Spaceship, cache row deleted, "Not Listed".

---

## Phase 8: User Story 6 — Sync All SellerHub Listings (Priority: P2)

**Goal**: Users can click a "Sync Spaceship" button to refresh all cached listings.

**Independent Test**: Click Sync → spinner → success toast → cache populated, stale rows removed.

### Implementation for User Story 6

- [ ] T040 [US6] Build `SpaceshipSyncButton` with refresh icon and "Last synced: X min ago" in `components/domains/SpaceshipSyncButton.tsx`
- [ ] T041 [US6] Implement sync logic: GET `/api/spaceship/list` → upsert returned domains → delete stale cache rows in `components/domains/SpaceshipSyncButton.tsx`
- [ ] T042 [US6] Implement syncing/disabled/error states + success/error toasts in `components/domains/SpaceshipSyncButton.tsx`
- [ ] T043 [US6] Render `SpaceshipSyncButton` in Domains page toolbar, right of Sedo sync button in `components/domains/domain-list-client.tsx`

**Checkpoint**: Sync works — fetches all listings, upserts cache, removes stale rows.

---

## Phase 9: User Story 7 — Per-Domain Sync via SellerHub API (Priority: P2)

**Goal**: Users can click ↻ on any domain row to sync just that one domain with Spaceship.

**Independent Test**: Click ↻ on a domain → verify Spaceship status checked → cache updated directly (no Supabase refetch).

### Implementation for User Story 7

- [ ] T044 [US7] Wire ↻ icon in SpaceshipCell to call per-domain sync mutation from `useSpaceshipRefreshOne` in `components/domains/SpaceshipCell.tsx`
- [ ] T045 [US7] Verify direct `setQueryData` cache update (no `invalidateQueries`) in `lib/hooks/useSpaceshipRefreshOne.ts`

**Checkpoint**: Per-domain sync works — checks Spaceship, updates cache, no unnecessary refetch.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsive overlay, filters, dark mode, type safety

- [ ] T046 [P] Implement mobile rendering — overlay as full-width bottom sheet (`fixed bottom-0 rounded-t-2xl`, `z-[60]`, `pb-20`) in `components/domains/SpaceshipOverlay.tsx`
- [ ] T047 [P] Add "Not listed on Spaceship" option to "Not Listed On" filter dropdown in `components/domains/domain-search.tsx`
- [ ] T048 [P] Register `spaceship` in `PLATFORM_LISTINGS_TABLE` mapping in `lib/supabase/queries/domains.ts` and `domains-client.ts`
- [ ] T049 [P] Add "List on Spaceship" action in domain row Actions menu (alternative trigger alongside + icon) in `components/domains/domain-table.tsx`
- [ ] T050 TypeScript strict — zero `any` types, zero unused imports across all new files
- [ ] T051 Verify dark/light theme on SpaceshipOverlay, SpaceshipCell, SpaceshipSyncButton
- [ ] T052 End-to-end manual smoke test per quickstart.md checklist
- [ ] T053 Vercel preview deploy with zero TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup (types) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (needs list endpoint for test connection)
- **US2 (Phase 4)**: Depends on Foundational (hooks)
- **US3 (Phase 5)**: Depends on US2 (SpaceshipCell triggers overlay) + Phase 2 (create route)
- **US4 (Phase 6)**: Depends on US3 (extends overlay) + Phase 2 (update route)
- **US5 (Phase 7)**: Depends on US3 (extends overlay) + Phase 2 (delete route)
- **US6 (Phase 8)**: Depends on Foundational (sync hook) + Phase 2 (list route)
- **US7 (Phase 9)**: Depends on Foundational (refresh hook) + Phase 2 (get route)
- **Polish (Phase 10)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: After Foundational — independent
- **US2 (P1)**: After Foundational — independent
- **US3 (P1)**: Depends on US2 (cell component)
- **US4 (P2)**: Depends on US3 (extends overlay)
- **US5 (P2)**: Depends on US3 (extends overlay)
- **US6 (P2)**: After Foundational — independent
- **US7 (P2)**: After Foundational — independent

### Parallel Opportunities

- T001-T003 (setup) — parallel
- T005-T007 (lib + queries) — parallel
- T008-T012 (API routes) — parallel after T005
- T013-T015 (hooks) — parallel after T006-T007
- T022, T023, T025 (cell + column + card) — parallel within US2
- US6 + US7 — parallel after foundational
- US4 + US5 — parallel after US3

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 — all P1)

1. Complete Phases 1-2: Setup + Foundational
2. Complete Phase 3: US1 — Spaceship credentials
3. Complete Phase 4: US2 — Spaceship column
4. Complete Phase 5: US3 — List a domain
5. **STOP and VALIDATE**: Configure credentials AND list a domain end-to-end
6. Deploy/demo

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Credentials form works → Test
3. Add US2 → Spaceship column renders → Test
4. Add US3 → Can list domains → Test (MVP!)
5. Add US4 → Can edit → Test
6. Add US5 → Can remove → Test
7. Add US6 → Global sync → Test
8. Add US7 → Per-domain sync → Test
9. Polish → Responsive, filters, themes → Deploy

## Notes

- No new npm dependencies needed (REST/JSON uses native `fetch`)
- Follows the exact same architecture as Phase 5 (Sedo) — copy-and-adapt pattern
- `spaceship_listings` cache table is a write-through cache, NOT the source of truth
- `domains.bin` is shared across all marketplace integrations
- `user_settings` table extended with columns (no new table)
- Spaceship uses `X-Api-Key` + `X-Api-Secret` headers (not query params like Sedo)
