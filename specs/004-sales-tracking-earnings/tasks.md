# Tasks: Phase 4 — Sales Tracking & Earnings

**Input**: Design documents from `/specs/004-sales-tracking-earnings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per spec — no automated test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- `components/sales/` — Sales feature components
- `lib/supabase/queries/` — Typed query helpers
- `lib/validations/` — Zod schemas
- `app/(dashboard)/sales/` — Sales route page

---

## Phase 1: Setup

**Purpose**: Create directories for sales feature

- [x] T001 [P] Create feature component directory: `components/sales/`

**Checkpoint**: Directory ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and query helpers that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create sale form Zod validation schema in `lib/validations/sales.ts` — export `saleFormSchema` (domain_name: required string, sale_price: positive number, sold_at: required string not in future, buyer/platform/notes: optional strings) and inferred type `SaleFormInput`
- [x] T003 Create typed sales server queries in `lib/supabase/queries/sales.ts` — export: `fetchSales(filters)` (paginated, sortable, filterable by date range), `fetchSaleById(id)`, `lookupDomain(name)` (case-insensitive domain lookup returning id + status), `countSalesForDomain(domainId)`
- [x] T004 [P] Create typed sales client mutations in `lib/supabase/queries/sales-client.ts` — export: `createSale(data)` (insert sale + update domain status to sold), `updateSale(id, data)` (update sale + re-associate domain if name changed), `deleteSale(id)` (delete sale + revert domain status if last sale)

**Checkpoint**: Schemas and queries ready — user story implementation can begin

---

## Phase 3: User Story 1 — Log a Domain Sale (Priority: P1) 🎯 MVP

**Goal**: Users can log a domain sale from the domain detail page (pre-filled domain name) or the Sales page (empty form). Form validates with Zod. Domain lookup auto-associates. Sale appears in list after creation.

**Independent Test**: Navigate to a domain detail page, click "Log Sale", fill in sale price and date, submit, verify sale appears in sales list and domain status changes to "sold."

### Implementation for User Story 1

- [x] T005 [P] [US1] Create sale log/edit form in `components/sales/sales-log-form.tsx` — uses React Hook Form with `saleFormSchema` Zod resolver; fields: domain_name (Input, readOnly when pre-filled from domain detail), sale_price (Input/number), sold_at (Input/date), buyer (Input), platform (Input), notes (Textarea); submit triggers `createSale` or `updateSale` mutation; inline validation errors; toast on success/error
- [x] T006 [P] [US1] Create sales empty state in `components/sales/sales-empty-state.tsx` — message "No sales logged yet — log your first sale to start tracking earnings" with "Log Sale" button
- [x] T007 [US1] Add "Log Sale" button to domain detail page in `app/(dashboard)/domains/[id]/page.tsx` — button navigates to `/sales?domain=<name>` or opens inline form; passes current domain name to form as pre-filled read-only value (depends on T005)
- [x] T008 [US1] Implement Sales page base in `app/(dashboard)/sales/page.tsx` — renders `sales-log-form` (initially collapsed, expandable with "Log Sale" button), `sales-empty-state` (when no sales); page structure ready for US2 list integration

**Checkpoint**: Sale logging functional — form works, sales created in database

---

## Phase 4: User Story 2 — Sales List & Earnings Summary (Priority: P1) 🎯 MVP

**Goal**: Users see a paginated sales list with earnings summary (total count, revenue, average, highest). Sort by date or price. Filter by date range.

**Independent Test**: Log 3-5 sales with varied prices and dates, verify earnings summary matches manual calculation, apply sort/filter options.

### Implementation for User Story 2

- [x] T009 [P] [US2] Create earnings summary cards in `components/sales/sales-summary-cards.tsx` — 4 cards: Total Sales (count), Total Revenue ($ sum), Average Sale ($ avg), Highest Sale ($ max); responsive grid (2-col mobile, 4-col desktop); props accept `{ count, revenue, average, highest }` numbers
- [x] T010 [P] [US2] Create sales list table in `components/sales/sales-list.tsx` — shadcn/ui Table; columns: domain name (link to domain detail if associated), sale price (formatted $), sale date (formatted), buyer, platform; supports sort by sold_at (default DESC) and sale_price; pagination (50/page); date range filter inputs (start/end date); empty state for filtered results: "No sales in this date range"
- [x] T011 [US2] Add sales list and earnings summary to Sales page in `app/(dashboard)/sales/page.tsx` — server component fetches sales via `fetchSales()`; computes earnings summary (total revenue, count, average, highest) client-side; renders `sales-summary-cards`, `sales-list`, and `sales-empty-state`; earnings summary updates when filters change; responsive layout (depends on T008, T009, T010)

**Checkpoint**: Sales list and earnings summary functional

---

## Phase 5: User Story 3 — Edit & Delete Sales (Priority: P2)

**Goal**: Users can edit a sale (correct price, date, etc.) or delete a sale. Deleting the last sale for a domain reverts its status to "active."

**Independent Test**: Edit a sale's price, verify earnings summary updates; delete a sale, verify removal from list and domain status revert if last sale.

### Implementation for User Story 3

- [x] T012 [P] [US3] Create delete confirmation dialog in `components/sales/sales-delete-dialog.tsx` — shadcn/ui Dialog; message "Delete this sale? This action cannot be undone."; Cancel + Delete buttons; triggers delete on confirm
- [x] T013 [US3] Add edit action to sales list in `components/sales/sales-list.tsx` — edit button per row opens `sales-log-form` in edit mode with pre-filled data; on save, calls `updateSale` and invalidates cache (depends on T005, T010)
- [x] T014 [US3] Add delete action to sales list in `components/sales/sales-list.tsx` — delete button per row opens `sales-delete-dialog`; on confirm, calls `deleteSale` (which also reverts domain status if last sale) and invalidates cache; toast on success (depends on T012, T010)

**Checkpoint**: Edit and delete functional — sales list keeps up to date

---

## Phase 6: User Story 4 — Sales Auto-Association with Domains (Priority: P2)

**Goal**: Sales auto-associate with domain records via case-insensitive name matching. Expired domains warn before allowing sale. Domain status updates to "sold" on association.

**Independent Test**: Log a sale for an existing active domain — verify domain status changes to "sold." Log a sale for a domain not in portfolio — verify external sale recorded. Log a sale for an expired domain — verify warning appears and sale proceeds after confirmation.

### Implementation for User Story 4

- [x] T015 [US4] Implement domain lookup and auto-association in `lib/supabase/queries/sales-client.ts` — `createSale()`: after form validation, call `lookupDomain(name)` (case-insensitive); if found: set domain_id; if domain status is 'expired': return warning flag (FR-007 clarification); if domain status is 'sold': return "already sold" warning (FR-008); always proceed with sale creation; update domain status to "sold" via Supabase `.update()` after insert (depends on T004)
- [x] T016 [US4] Add expired domain warning UI to `components/sales/sales-log-form.tsx` — when `createSale` returns expired warning, show inline warning "This domain is expired" with a "Log Sale Anyway" confirm button before proceeding (depends on T005, T015)
- [x] T017 [US4] Implement domain re-association on sale edit in `lib/supabase/queries/sales-client.ts` — `updateSale()`: if domain_name changed, re-run `lookupDomain()`; revert old domain status if it was the last sale for that domain; associate with new domain and set new domain status to "sold" (depends on T004)
- [x] T018 [US4] Implement status revert on sale delete in `lib/supabase/queries/sales-client.ts` — `deleteSale()`: after deletion, call `countSalesForDomain(domainId)`; if count = 0 AND domain is "sold": `.update()` domain status to "active" (depends on T004)

**Checkpoint**: Auto-association and status management fully functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual polish and build verification

- [x] T019 [P] Add skeleton loaders to `components/sales/sales-summary-cards.tsx` — show Skeleton cards while data loads
- [x] T020 [P] Add skeleton loader to `components/sales/sales-list.tsx` — show 5 Skeleton rows while data loads
- [x] T021 Run TypeScript strict check: `npx tsc --noEmit` — ensure zero errors
- [x] T022 Run production build: `npm run build` — ensure clean Vercel build
- [x] T023 Run quickstart.md verification checklist — confirm all 10 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational — can start in parallel with US1
- **US3 (Phase 5)**: Depends on US1 (form) + US2 (list)
- **US4 (Phase 6)**: Depends on Foundational — can start in parallel with US1
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 2 — needs US1 page scaffold for integration
- **US3 (P2)**: Depends on US1 (form) and US2 (list)
- **US4 (P2)**: Can start after Phase 2 — builds on query helpers

---

## Parallel Opportunities

- T002-T004 can run in parallel within Phase 2
- T005-T006 can run in parallel within US1
- T009-T010 can run in parallel within US2
- US1 + US2 + US4 can begin in parallel after Phase 2
- T019-T020 can run in parallel within Polish

---

## Parallel Example: User Story 1 + 2

```bash
# Launch foundational tasks:
Task: "Create sale form Zod schema in lib/validations/sales.ts"
Task: "Create sales server queries in lib/supabase/queries/sales.ts"
Task: "Create sales client mutations in lib/supabase/queries/sales-client.ts"

# Then launch US1 + US2 in parallel:
Task: "Create sale log/edit form in components/sales/sales-log-form.tsx"
Task: "Create sales empty state in components/sales/sales-empty-state.tsx"
Task: "Create earnings summary cards in components/sales/sales-summary-cards.tsx"
Task: "Create sales list table in components/sales/sales-list.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Log Sale)
4. Complete Phase 4: US2 (Sales List + Earnings)
5. **STOP and VALIDATE**: Log sales → verify list and earnings summary
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Log Sale) + US2 (List) → **MVP Deploy**
3. US3 (Edit/Delete) → Deploy
4. US4 (Auto-Association) → Deploy
5. Polish → **Full Phase 4 Release**

---

## Notes

- [P] tasks = different files, no dependencies
- No new npm dependencies needed (all already installed)
- Sales table already exists from Phase 1 migration
- Domain auto-association uses same case-insensitive pattern as Phase 2
- Total: 23 tasks across 7 phases
- MVP scope (US1 + US2): 13 tasks through Phase 4
