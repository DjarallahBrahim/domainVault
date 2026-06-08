# Tasks: Sedo Integration

**Input**: Design documents from `specs/008-sedo-integration/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router at repository root (`app/`, `components/`, `lib/`, `types/`)
- Source paths shown below match the existing DomainVault project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migration history files, dependency installation, shared types

- [x] T001 [P] Add migration SQL file 004 — `bin` column on `domains` in `supabase/migrations/004_bin_column.sql`
- [x] T002 [P] Add migration SQL file 005 — `user_settings` table + RLS in `supabase/migrations/005_user_settings.sql`
- [x] T003 [P] Add migration SQL file 006 — `sedo_listings` table + RLS in `supabase/migrations/006_sedo_listings.sql`
- [x] T004 Install `@xmldom/xmldom` and `@types/xmldom` via npm
- [x] T005 Create shared Sedo TypeScript types in `types/sedo.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Build Sedo API client `callSedo(fn, params)` with XML fetch + parse in `lib/sedo/client.ts`
- [x] T007 [P] Build pricing utilities — `computeSedoPricing`, `askingPriceSuggestions`, `minPriceSuggestions` in `lib/sedo/pricing.ts`
- [x] T008 [P] Add `['sedo-listings']` and `['user-settings']` query keys to `lib/query-keys.ts`
- [x] T009 [P] Create server-safe queries for `user_settings` in `lib/supabase/queries/settings.ts`
- [x] T010 [P] Create client-safe mutations for `user_settings` in `lib/supabase/queries/settings-client.ts`
- [x] T011 [P] Create server-safe queries for `sedo_listings` in `lib/supabase/queries/sedo-listings.ts`
- [x] T012 [P] Create client-safe mutations for `sedo_listings` in `lib/supabase/queries/sedo-listings-client.ts`
- [x] T013 Build API route `GET /api/sedo/check` in `app/api/sedo/check/route.ts`
- [x] T014 Build API route `GET /api/sedo/list` (paginated, 100/request) in `app/api/sedo/list/route.ts`
- [x] T015 Build API route `POST /api/sedo/insert` in `app/api/sedo/insert/route.ts`
- [x] T016 Build API route `POST /api/sedo/edit` in `app/api/sedo/edit/route.ts`
- [x] T017 Build API route `POST /api/sedo/delete` in `app/api/sedo/delete/route.ts`
- [x] T018 [P] Build `useSedoListings` hook — TanStack Query, returns `Map<domain_id, SedoListing>` in `lib/hooks/useSedoListings.ts`
- [x] T019 [P] Build `useSedoSync` hook — TanStack Query mutation, sync + stale cleanup in `lib/hooks/useSedoSync.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 7 — Account Settings Page (Priority: P1) 🎯 MVP

**Goal**: Users can view their account info (email, member since) and change their password from the Settings page.

**Independent Test**: Navigate to `/settings`, verify email and member-since display, change password successfully.

### Implementation for User Story 7

- [x] T020 [US7] Create Settings page layout component with Account and Sedo sections in `components/settings/SettingsPage.tsx`
- [x] T021 [US7] Build Account section with read-only email, member-since date display, and Change Password sub-form in `components/settings/SettingsPage.tsx`
- [x] T022 [US7] Implement Change Password sub-form with inline validation (min 8 chars, 1 number, confirm match) in `components/settings/SettingsPage.tsx`
- [x] T023 [US7] Wire password save to `supabase.auth.updateUser({ password })` with success/error toast in `components/settings/SettingsPage.tsx`
- [x] T024 [US7] Update Settings page route to render `SettingsPage` component in `app/(dashboard)/settings/page.tsx`
- [x] T025 [US1] Build Sedo Credentials form component with 4 fields (Partner ID, Sign Key, Username max 25 chars, Password max 16 chars) in `components/settings/SedoCredentialsForm.tsx`
- [x] T026 [US1] Implement password show/hide toggle with masked placeholder (`••••••••`) on pre-fill — never expose actual value in `components/settings/SedoCredentialsForm.tsx`
- [x] T027 [US1] Wire "Test Connection" button to `GET /api/sedo/check` and display inline `✅ Connected` / `❌ Invalid credentials` badge in `components/settings/SedoCredentialsForm.tsx`
- [x] T028 [US1] Wire "Save Credentials" button to upsert `user_settings` via Supabase client, validate all 4 fields required + length constraints, show success toast in `components/settings/SedoCredentialsForm.tsx`
- [x] T029 [US1] Pre-fill credentials on page load by fetching `user_settings` for current user in `components/settings/SedoCredentialsForm.tsx`
- [x] T030 [US1] Add helper text below form with link to Sedo partner program in `components/settings/SedoCredentialsForm.tsx`
- [x] T031 [US1] Render `SedoCredentialsForm` inside `SettingsPage` component in `components/settings/SettingsPage.tsx`

**Checkpoint**: Settings page fully functional — Account section + Sedo credentials with test and save

---

## Phase 5: User Story 2 — View Sedo Listing Status on Domains Page (Priority: P1)

**Goal**: Domains page shows a BIN column and a Sedo column with cached listing status — displays "Not Listed" or the Sedo price in green with an edit icon.

**Independent Test**: View Domains page with various domains — verify BIN column visible, Sedo column shows "Not Listed" for unlisted domains and `$price ✏️` for listed domains (after cache populated via sync or manual listing).

### Implementation for User Story 2

- [ ] T032 [US2] Add `BIN` column cell to desktop domains table in `components/domains/DomainTable.tsx`
- [ ] T033 [US2] Add `Sedo` column cell (desktop) — State A ("Not Listed") and State B (`$price ✏️`) in `components/domains/SedoCell.tsx`
- [ ] T034 [US2] Integrate `SedoCell` into `DomainTable.tsx` as column immediately after BIN in `components/domains/DomainTable.tsx`
- [ ] T035 [US2] Add Sedo column header with `RefreshCw` icon and "Last synced" tooltip in `components/domains/DomainTable.tsx`
- [ ] T036 [US2] Add `BIN` row to mobile domain cards in `components/domains/DomainMobileCard.tsx`
- [ ] T037 [US2] Add `Sedo` row to mobile domain cards — separated by `border-t`, State A ("Not Listed") and State B (`$price ✏️`) in `components/domains/SedoCardRow.tsx`
- [ ] T038 [US2] Integrate `SedoCardRow` into `DomainMobileCard.tsx` as row after BIN in `components/domains/DomainMobileCard.tsx`
- [ ] T039 [US2] Wire `useSedoListings` hook into DomainTable and DomainMobileCard — provide `Map<domain_id, SedoListing>` for O(1) lookup per row in `app/(dashboard)/domains/page.tsx`

**Checkpoint**: Domains page shows BIN + Sedo columns. Cache reads work. Manual sync needed to populate (handled in US6).

---

## Phase 6: User Story 3 — List a Domain on Sedo (Priority: P1)

**Goal**: Users can list a domain on Sedo via a unified overlay form with asking price, min offer, fixed/negotiable toggle, and pricing suggestion chips.

**Independent Test**: From a domain row Actions menu, open "List on Sedo" overlay, fill pricing, submit — verify domain appears as listed on Sedo and cell switches to State B.

### Implementation for User Story 3

- [ ] T040 [US3] Build `SedoOverlay` base component with read-only domain info fields (domain, registrar, expiry) and shared form structure in `components/domains/SedoOverlay.tsx`
- [ ] T041 [US3] Implement Asking Price field with suggestion chips (BIN, BIN−20%, BIN−30%) — chips hidden when `bin` is null in `components/domains/SedoOverlay.tsx`
- [ ] T042 [US3] Implement Min Offer field with live recalculating suggestion chips (20%, 30%, 40%, 50%) based on current Asking Price in `components/domains/SedoOverlay.tsx`
- [ ] T043 [US3] Implement Fixed/Negotiable toggle switch — defaults to Fixed in `components/domains/SedoOverlay.tsx`
- [ ] T044 [US3] Implement create mode — "List on Sedo" trigger from domain row Actions menu in `components/domains/DomainTable.tsx` and `components/domains/DomainMobileCard.tsx`
- [ ] T045 [US3] Implement create mode submit: POST `/api/sedo/insert` → upsert `sedo_listings` cache → save `domains.bin` if null → invalidate queries → close overlay + toast in `components/domains/SedoOverlay.tsx`
- [ ] T046 [US3] Add loading state: CTA spinner + inputs disabled during API call in `components/domains/SedoOverlay.tsx`
- [ ] T047 [US3] Add inline error display for Sedo API faults (above footer, not toast) in `components/domains/SedoOverlay.tsx`
- [ ] T048 [US3] Add inline validation errors for empty required fields (Asking Price, Min Offer) in `components/domains/SedoOverlay.tsx`
- [ ] T049 [US3] Block overlay and show "Add Sedo credentials in Settings first" when no credentials saved in `components/domains/SedoOverlay.tsx`

**Checkpoint**: Create flow works end-to-end — domain listed on Sedo, cache updated, cell shows price.

---

## Phase 7: User Story 4 — Edit an Existing Sedo Listing (Priority: P2)

**Goal**: Users can change the price or minimum offer on a domain already listed on Sedo via the same overlay in edit mode.

**Independent Test**: Click ✏️ on a listed domain, change price in overlay, click "Update" — verify price updates on Sedo and cache refreshes.

### Implementation for User Story 4

- [ ] T050 [US4] Implement edit mode — pre-fill Asking Price and Min Offer from cached `sedo_listings` values in `components/domains/SedoOverlay.tsx`
- [ ] T051 [US4] Implement edit mode trigger — clicking ✏️ in SedoCell and SedoCardRow opens overlay in edit mode in `components/domains/SedoCell.tsx` and `components/domains/SedoCardRow.tsx`
- [ ] T052 [US4] Implement edit mode footer with "Update" CTA + "Remove from Sedo" button in `components/domains/SedoOverlay.tsx`
- [ ] T053 [US4] Implement edit mode submit: POST `/api/sedo/edit` → upsert `sedo_listings` cache → save `domains.bin` if null → invalidate queries → close overlay + toast in `components/domains/SedoOverlay.tsx`

**Checkpoint**: Edit flow works — price updated, cache refreshed, cell re-renders with new price.

---

## Phase 8: User Story 5 — Remove a Domain from Sedo (Priority: P2)

**Goal**: Users can delist a domain from Sedo with an inline confirmation in the overlay.

**Independent Test**: Open overlay in edit mode, click "Remove from Sedo", confirm — verify domain delisted, cache row deleted, cell reverts to "Not Listed".

### Implementation for User Story 5

- [ ] T054 [US5] Implement inline confirmation bar — "Remove from Sedo? [Yes] [Cancel]" — shown on "Remove from Sedo" click in `components/domains/SedoOverlay.tsx`
- [ ] T055 [US5] Implement remove flow: POST `/api/sedo/delete` → delete `sedo_listings` cache row → invalidate queries → close overlay + toast in `components/domains/SedoOverlay.tsx`
- [ ] T056 [US5] Implement cancel behavior — collapses confirmation bar, returns form to normal edit state in `components/domains/SedoOverlay.tsx`

**Checkpoint**: Remove flow works — domain delisted from Sedo, cache row deleted, cell shows "Not Listed".

---

## Phase 9: User Story 6 — Sync All Sedo Listings (Priority: P2)

**Goal**: Users can click a "Sync Sedo" button to refresh all cached listings at once, catching changes made directly on Sedo's website.

**Independent Test**: Click "Sync Sedo" — verify spinner during sync, success toast after, cache populated/updated, stale rows removed.

### Implementation for User Story 6

- [ ] T057 [US6] Build `SedoSyncButton` component with `RefreshCw` icon and "Last synced: X min ago" display in `components/domains/SedoSyncButton.tsx`
- [ ] T058 [US6] Implement sync logic: GET `/api/sedo/list` → upsert returned domains → delete stale cache rows not returned by Sedo → invalidate `['sedo-listings']` in `components/domains/SedoSyncButton.tsx`
- [ ] T059 [US6] Implement syncing state — spinning icon, button disabled during sync in `components/domains/SedoSyncButton.tsx`
- [ ] T060 [US6] Implement success state — toast "Sedo listings synced" + update last-synced timestamp in `components/domains/SedoSyncButton.tsx`
- [ ] T061 [US6] Implement error state — toast with Sedo `faultstring` on API fault in `components/domains/SedoSyncButton.tsx`
- [ ] T062 [US6] Implement disabled state — when no credentials saved, button disabled with tooltip "Add Sedo credentials in Settings" in `components/domains/SedoSyncButton.tsx`
- [ ] T063 [US6] Render `SedoSyncButton` in Domains page toolbar, right of existing controls in `app/(dashboard)/domains/page.tsx`

**Checkpoint**: Sync works — fetches all listings, upserts cache, removes stale rows, updates UI.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsive overlay, mobile bottom sheet, final integration, type safety

- [ ] T064 [P] Implement mobile rendering — SedoOverlay as full-width bottom sheet (`fixed bottom-0 w-full rounded-t-2xl`) at 375px in `components/domains/SedoOverlay.tsx`
- [ ] T065 [P] Implement "List on Sedo" action in domain row Actions menu (triggers overlay in create mode) in `components/domains/DomainTable.tsx`
- [ ] T066 TypeScript strict mode — verify zero `any` types and zero unused imports across all new files
- [ ] T067 ESLint + Prettier pass with zero warnings
- [ ] T068 Verify dark/light theme support on SedoOverlay, SedoCell, SedoSyncButton
- [ ] T069 End-to-end manual smoke test per quickstart.md checklist in `specs/008-sedo-integration/quickstart.md`
- [ ] T070 Vercel preview deploy with zero TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (types from T005) — BLOCKS all user stories
- **US7 (Phase 3)**: Depends on Foundational — Settings page needs Supabase queries
- **US1 (Phase 4)**: Depends on US7 (same page) + T013 (check route)
- **US2 (Phase 5)**: Depends on Foundational (hooks, queries)
- **US3 (Phase 6)**: Depends on US2 (SedoCell triggers overlay) + T015 (insert route)
- **US4 (Phase 7)**: Depends on US3 (extends overlay with edit mode) + T016 (edit route)
- **US5 (Phase 8)**: Depends on US3 (extends overlay with remove) + T017 (delete route)
- **US6 (Phase 9)**: Depends on Foundational (useSedoSync hook) + T014 (list route)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US7 (P1)**: Can start after Foundational — no dependencies on other stories
- **US1 (P1)**: Depends on US7 (Settings page) — cannot start before
- **US2 (P1)**: Can start after Foundational — independent of Settings stories
- **US3 (P1)**: Depends on US2 (SedoCell is the trigger)
- **US4 (P2)**: Depends on US3 (extends overlay)
- **US5 (P2)**: Depends on US3 (extends overlay)
- **US6 (P2)**: Can start after Foundational — independent of other stories

### Within Each User Story

- Simple components before complex form logic
- Read-only fields before editable fields
- Submit logic before error handling
- Desktop before mobile
- Core flow before edge cases

### Parallel Opportunities

- T001, T002, T003 (migrations) can run in parallel
- T006, T007 (lib/sedo utilities) can run in parallel
- T008 through T012 (query infrastructure) can run in parallel
- T013 through T017 (API routes) can run in parallel after T006+T007
- T018, T019 (hooks) can run in parallel after T011+T012
- T020 through T024 (US7) — sequential within the story
- T025 through T031 (US1) — can start after T024
- T032, T036 (BIN column desktop + mobile) can run in parallel within US2
- T064, T065 (mobile overlay + actions menu) can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch lib utilities in parallel:
Task: "Build Sedo API client in lib/sedo/client.ts (T006)"
Task: "Build pricing utilities in lib/sedo/pricing.ts (T007)"

# Launch query infrastructure in parallel:
Task: "Add query keys to lib/query-keys.ts (T008)"
Task: "Create server-safe settings queries (T009)"
Task: "Create client-safe settings mutations (T010)"
Task: "Create server-safe sedo-listings queries (T011)"
Task: "Create client-safe sedo-listings mutations (T012)"

# Launch all 5 API routes in parallel (after T006+T007):
Task: "API route check (T013)"
Task: "API route list (T014)"
Task: "API route insert (T015)"
Task: "API route edit (T016)"
Task: "API route delete (T017)"

# Launch hooks in parallel:
Task: "useSedoListings hook (T018)"
Task: "useSedoSync hook (T019)"
```

---

## Implementation Strategy

### MVP First (US7 + US1 + US2 + US3 — all P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US7 — Account Settings Page
4. Complete Phase 4: US1 — Sedo Credentials
5. Complete Phase 5: US2 — Sedo Column + BIN Column
6. Complete Phase 6: US3 — List a Domain on Sedo
7. **STOP and VALIDATE**: User can configure credentials AND list a domain end-to-end
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US7 + US1 → Settings page functional → Test independently
3. Add US2 → Domains page shows Sedo column → Test independently
4. Add US3 → Can list domains on Sedo → Test independently (MVP!)
5. Add US4 → Can edit listings → Test independently
6. Add US5 → Can remove listings → Test independently
7. Add US6 → Can sync all listings → Test independently
8. Polish → Responsive, dark mode, type safety → Final deploy

### Sequential Strategy (Single Developer)

1. Phases 1-2: Setup + Foundational (all blocking tasks)
2. Phase 3-4: Settings page (Account + Sedo credentials)
3. Phase 5: Sedo column + BIN column
4. Phase 6: SedoOverlay create mode
5. Phases 7-8: SedoOverlay edit + remove modes (extension of Phase 6)
6. Phase 9: Sedo sync button
7. Phase 10: Polish

---

## Notes

- Tasks assume tables (`user_settings`, `sedo_listings`) and `domains.bin` already exist in Supabase — migration files are for history only (T001-T003)
- No automated test tasks — project uses manual QA + TypeScript compiler
- `@xmldom/xmldom` XML parsing is server-side only — never imported in client components
- Query file split pattern enforced: `settings.ts` (server) + `settings-client.ts` (client), `sedo-listings.ts` (server) + `sedo-listings-client.ts` (client)
- TanStack Query invalidation: overlay mutations invalidate `['sedo-listings']` + `['domains']`, sync invalidates `['sedo-listings']`
- Sedo credentials are plain text behind RLS — acceptable per constitution v1.3.0
- `sedo_price` displayed in Sedo column is from cache, NOT from `domains.bin`
