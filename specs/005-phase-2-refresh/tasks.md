# Tasks: Phase 2 Refresh — Full v2 Alignment

**Input**: Design documents from `/specs/005-phase-2-refresh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual E2E verification per quickstart.md — no automated test tasks.

**Organization**: Tasks grouped by user story per spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies needed. All required libraries already installed.

*Skipped — no setup tasks.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared components and query functions that multiple stories depend on.

- [x] T001 [P] Add `fetchRegistrarList()` function to `lib/supabase/queries/domains-client.ts` — query distinct non-null registrar values from the domains table, return sorted `string[]`; used by autocomplete (US5), registrar filter (US4), and manual entry tab (US6)
- [x] T002 [P] Create `components/domains/tag-input.tsx` — reusable chip input component; renders `<Input>` with `onKeyDown` for Enter/comma to create chips; chips displayed as removable badges with X icon below the input; exposes `value: string[]` and `onChange: (tags: string[]) => void` props; used by slide-over (US5) and manual entry tab (US6)
- [x] T003 Update `DomainFilters` interface and `fetchDomains()` in `lib/supabase/queries/domains-client.ts` — add `expiry?: string`, `registrars?: string`, `pageSize?: number` to the filters interface; implement expiry window filter logic (1m/3m/6m/9m → `.lte("expiration_date", ...)`), registrar multi-select (`.in("registrar", ...)`), comma-separated multi-domain search (split by comma, trim, `.or()` with `.ilike()` per token), and `pageSize` override (defaults to 50)

**Checkpoint**: Shared components and query logic ready. User stories can now be implemented.

---

## Phase 3: User Story 1 — CSV Preview Registrar Column (Priority: P1)

**Goal**: CSV preview table shows Registrar column between Price and Status.

**Independent Test**: Upload CSV with registrar data → column visible. Upload CSV without → column empty.

- [x] T004 [US1] Update `components/import/csv-summary.tsx` — add "Registrar" column to the preview table between Price and Status columns; read `registrar` field from each parsed row; display value or empty cell

---

## Phase 4: User Story 2 — Domain List Updates (Priority: P1)

**Goal**: Domain table has Registrar column. Search triggers on Enter key only. Pagination supports 25/50/100. Export CSV button downloads filtered list.

**Independent Test**: View domain list — Registrar column visible. Type search → no auto-filter; press Enter → filters. Select page size 100 → 100 rows. Click Export → CSV downloads.

- [x] T005 [US2] Update `components/domains/domain-table.tsx` — add "Registrar" column between TLD and Expiration Date columns; make column sortable (click header); render `domain.registrar` value or `—` if null
- [x] T006 [US2] Update `components/domains/domain-search.tsx` — change search input from debounced `onChange` to `onKeyDown` Enter-only trigger; maintain local `searchValue` state separate from URL param; only update URL search param on Enter key or search button click; add "Search" button (magnifying glass icon) next to the input as explicit trigger; add pageSize selector (25/50/100) as a styled Select or segmented control
- [x] T007 [US2] Update `components/domains/domain-list-client.tsx` — add "Export CSV" button; on click, fetch all filtered domains (large page), build CSV string with columns: Domain, TLD, Registrar, Expiration Date, Price, Status, trigger download via Blob + URL.createObjectURL; pass pageSize to `fetchDomains`; wire up updated search behavior

---

## Phase 5: User Story 5 — Slide-Over Panel (Priority: P1)

**Goal**: "Add Domain" opens slide-over panel (not dialog). Fields include Status, Registrar with autocomplete, Tags as chip input. Edit mode pre-populates. Fix z-index transparency bug.

**Independent Test**: Click Add Domain → slide-over from right. Type registrar → autocomplete. Add tags → chips. Blur invalid domain → inline error. Submit → toast, panel closes, domain in list.

**Prerequisite**: T001, T002

- [x] T008 [US5] Delete `components/domains/domain-add-dialog.tsx` — remove the old modal dialog component
- [x] T009 [US5] Create `components/domains/domain-add-slideover.tsx` — client component using shadcn/ui `<Sheet>` with `side="right"`; form built with RHF + Zod `manualEntrySchema` (add mode) or `domainEditSchema` (edit mode); fields: Domain (Input, validated on blur + server duplicate check), Expiration Date (Input type="date"), Purchase Price (Input type="number" step="0.01"), Status (Select: Active/Expired/Sold/Pending), Registrar (Input with autocomplete — fetch registrar list via `fetchRegistrarList()`, filter client-side, show dropdown as user types), Tags (`<TagInput>` component), Notes (Input); onSubmit calls `insertSingleDomain` or `updateDomain` via `useMutation`; on success toast + invalidate `queryKeys.domains.all` + close sheet; on domain duplicate error show inline; edit mode (domain prop provided) pre-populates all fields except Domain (read-only); ensure `z-50` on Sheet overlay to fix transparency bug (depends on T001, T002)
- [x] T010 [US5] Update `components/domains/domain-list-client.tsx` — replace `DomainAddDialog` import and usage with `DomainAddSlideover`; remove `showAddDialog` state, add `showSlideover` and `editDomain` states; "Add Domain" button sets `editDomain = null` and opens slide-over; pass `domain` prop for edit mode (wired from domain table/card edit actions); update "edit" click handlers in table/cards to set `editDomain` and open slide-over
- [x] T011 [US5] Update `components/domains/domain-empty-state.tsx` — change `onAddDomain` prop from dialog trigger to slide-over trigger (rename to `onAddDomain` — no signature change needed if parent passes the same callback)

---

## Phase 6: User Story 3 — Multi-Domain Search (Priority: P2)

**Goal**: Search input accepts comma-separated domain names; each token matched independently via OR-logic.

**Independent Test**: Enter "example.com, test.org" press Enter → both appear. Irregular spacing trimmed. Single domain without commas still works.

**Prerequisite**: T003 (multi-domain search logic in fetchDomains)

- [x] T012 [US3] Update `components/domains/domain-search.tsx` — update search input placeholder to `"Search domains (comma-separate multiple)"`; pass search string as-is to URL params (comma-separated tokens handled by `fetchDomains`); ensure trimming of individual tokens happens in the query layer (already done in T003)

---

## Phase 7: User Story 4 — Improved Filters (Priority: P2)

**Goal**: Expiry window segmented control, registrar multi-select dropdown, status multi-select, "Clear all" link. Filter state in URL params.

**Independent Test**: Select expiry ≤3m → filters immediately. Select registrar + status → narrows. "Clear all" resets. URL params persist on reload.

**Prerequisite**: T001 (registrar list), T003 (filter query logic), T006 (search bar already updated)

- [x] T013 [US4] Update `components/domains/domain-search.tsx` — add expiry window segmented control (buttons or styled Select: All, ≤1m, ≤3m, ≤6m, ≤9m) that sets `expiry` URL param immediately on change (no Enter); add registrar multi-select dropdown populated via `fetchRegistrarList()` with count badges per registrar, setting `registrar` URL param as comma-separated values; change existing status select from single to multi-select (comma-separated `status` URL param); add "Clear all" button/link that resets all filter URL params to defaults; ensure the filter bar reads and auto-applies all filter values from URL search params on mount (deep-link support) (depends on T001)
- [x] T014 [US4] Update `app/(dashboard)/domains/page.tsx` — add `expiry` and `registrar` to the filter extraction logic from search params (ensure server-side hydration includes new filter params)

---

## Phase 8: User Story 6 — Import Page Manual Entry Tab (Priority: P2)

**Goal**: Import page has two tabs: "CSV Upload" and "Add Manually". Add Manually tab contains an inline form that resets after each successful add.

**Independent Test**: Navigate to /import → see two tabs. Click Add Manually → form visible. Add domain → inline success, form resets. Add invalid → inline error, form retains data. Add 3 sequentially → all succeed, no redirect.

**Prerequisite**: T002

- [x] T015 [US6] Create `components/import/manual-entry-tab.tsx` — client component with RHF + Zod `manualEntrySchema`; fields: Domain (Input, validated on blur), Expiration Date (Input type="date"), Purchase Price (Input type="number" step="0.01"), Registrar (Input with autocomplete using `fetchRegistrarList()`), Notes (Textarea component from shadcn/ui), Tags (`<TagInput>` component); "Add Domain" submit button; onSubmit calls `insertSingleDomain` via `useMutation`; on success: inline green success message "Domain added — add another", form resets via `reset()`; on duplicate error: inline red error, form retains data; on validation error: standard RHF inline errors; no redirect (depends on T002)
- [x] T016 [US6] Update `app/(dashboard)/import/page.tsx` — wrap existing CSV import UI + new manual entry tab in a tab UI; add state `activeTab: "csv" | "manual"` defaulting to "csv"; render two tab buttons styled with active/inactive visual states; conditionally render CsvUploader + CsvOptionToggle + CsvProgress + CsvSummary (activeTab === "csv") or ManualEntryTab (activeTab === "manual"); tab state survives within page session only (no URL serialization needed for tabs)

---

## Phase 9: User Story 7 — CSV Column Reference Banner (Priority: P3)

**Goal**: CSV Upload tab shows info banner with expected columns, copy-to-clipboard button, and downloadable sample CSV.

**Independent Test**: Banner visible on CSV Upload tab. Copy button copies header row. Sample CSV downloads with header + 2 rows.

- [x] T017 [US7] Update `components/import/csv-uploader.tsx` — add a styled info banner rendered above the drop-zone (only when `activeTab === "csv"` or unconditionally if rendered within the CSV tab context); banner shows: "Required: Domain, Expiration Date / Optional: Price, Registrar, Notes, Tags"; include a copy-to-clipboard button (clipboard icon) that copies `Domain,Expiration Date,Price,Registrar,Notes,Tags` via `navigator.clipboard.writeText()` with toast confirmation; include a "Download sample CSV" link/button that generates a Blob with header row + 2 example rows (e.g., `example.com,2026-12-31,1000,GoDaddy` and `test.org,2027-06-15,500,Namecheap`) and triggers download via `<a>` click with Blob URL

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, cleanup, and manual E2E testing.

- [x] T018 Run build verification: `npm run typecheck && npm run lint && npm run build` — fix any errors; ensure zero TypeScript errors, zero ESLint warnings, clean Vercel build
- [x] T019 Delete `components/domains/domain-add-dialog.tsx` if not already removed (confirm T008)
- [x] T020 Run quickstart.md verification checklist — confirm all 12 sections pass (preview registrar, domain list updates, Enter-key search, multi-domain search, pagination, CSV export, improved filters, slide-over panel, import manual entry, CSV banner, no regressions, build & lint)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — no new dependencies
- **Foundational (Phase 2)**: No prior dependencies — start immediately
- **US1 (Phase 3)**: After Phase 2 — independent of other stories
- **US2 (Phase 4)**: After Phase 2 — independent of other stories
- **US5 (Phase 5)**: After Phase 2 (needs T001 + T002) — independent of US1/US2
- **US3 (Phase 6)**: After Phase 2 + US2 (search component already updated in US2)
- **US4 (Phase 7)**: After Phase 2 + US2 (search component already updated in US2, needs T001)
- **US6 (Phase 8)**: After Phase 2 (needs T002)
- **US7 (Phase 9)**: After Phase 2 — independent of other stories
- **Polish (Phase 10)**: After all stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — only touches csv-summary.tsx
- **US2 (P1)**: Independent of other stories (can run parallel with US1, US5)
- **US5 (P1)**: Independent of other stories (needs only foundational T001+T002)
- **US3 (P2)**: Depends on US2 (domain-search.tsx already updated)
- **US4 (P2)**: Depends on US2 + T001 (domain-search.tsx + registrar list)
- **US6 (P2)**: Independent (needs only T002)
- **US7 (P3)**: Independent

### Within Each Phase

- Phase 2: T001, T002, T003 are [P] — can run in parallel
- All other phases: sequential within phase, parallel with other phases where [P] marked

---

## Parallel Opportunities

```bash
# Phase 2: All 3 foundational tasks in parallel
Task: "Add fetchRegistrarList() to domains-client.ts"
Task: "Create tag-input.tsx reusable chip component"
Task: "Update fetchDomains() with expiry/registrar/multi-search/pageSize"

# Phase 3-9: P1 stories can run in parallel after Phase 2
Task: "US1 — Update csv-summary.tsx (registrar column)"
Task: "US2 — Update domain-table.tsx + domain-search.tsx + domain-list-client.tsx"
Task: "US5 — Create slide-over + update list-client + empty-state"
Task: "US6 — Create manual-entry-tab + update import page"
Task: "US7 — Update csv-uploader.tsx (banner)"

# P2 stories run after US2
Task: "US3 — Update domain-search.tsx (multi-domain)"
Task: "US4 — Update domain-search.tsx + domains page (filters)"
```

---

## Implementation Strategy

### MVP First (P1 Stories)

1. Phase 2: Foundational (T001 + T002 + T003 parallel)
2. Phase 3: US1 — CSV Preview Registrar (T004)
3. Phase 4: US2 — Domain List Updates (T005 + T006 + T007)
4. Phase 5: US5 — Slide-Over Panel (T008 + T009 + T010 + T011)
5. **STOP and VALIDATE**: All P1 features functional
6. Continue to P2 stories

### Incremental Delivery

1. Foundational → shared queries + components ready
2. US1 + US2 + US5 (P1) → Core domain management upgraded
3. US3 + US4 (P2) → Multi-search + improved filters
4. US6 (P2) → Import page manual entry
5. US7 (P3) → CSV banner
6. US-032 (P3) → Paste CSV text import
7. US-033 (P3) → BIN (asking price) column
8. US-034 (P3) → Sort by added date
9. Polish → Build + E2E verification

---

## Phase 8: US-032 — Paste CSV Text Import

**Purpose**: Split CsvUploader into paste-text + upload file panels.

- [x] T012 [US-032] Update `components/import/csv-uploader.tsx` — split into two-panel grid layout with "or" divider, add textarea, format hint, examples, Import button, paste validation, header prepend, `onContentReady("pasted-data.csv")` call.

---

## Phase 9: US-033 — BIN (Asking Price) Column

**Purpose**: Add `bin` column to domains for tracking asking/sale price.

- [x] T013 [US-033] Create `supabase/migrations/004_bin_column.sql` — add `bin DECIMAL(10,2)` column (idempotent).
- [x] T014 [US-033] Update `lib/validations/domain.ts` — add `bin` to `csvRowSchema` (optional, strips $/€/£) and `domainEditSchema` (nullable number).
- [x] T015 [US-033] Update `lib/supabase/queries/domains-client.ts` — add `bin` to `UpsertRow` interface and upsert payload.
- [x] T016 [US-033] Update `app/(dashboard)/import/page.tsx` — parse `bin` in `handleContentReady`.
- [x] T017 [US-033] Update `components/domains/domain-table.tsx` — rename "Price" to "Purchase", add "BIN" column with `formatPrice`.
- [x] T018 [US-033] Update `components/domains/domain-detail-form.tsx` — add "BIN ($)" number input field and default value.
- [x] T019 [US-033] Update `components/domains/domain-list-client.tsx` — add BIN to CSV export header and rows.
- [x] T020 [US-033] Update `components/import/csv-uploader.tsx` — add `bin` to `CSV_HEADER`, format hint, placeholder, examples.

---

## Phase 10: US-034 — Sort by Added Date

**Purpose**: Add sortable "Added" column (created_at) to domain table.

- [x] T021 [US-034] Update `components/domains/domain-table.tsx` — add "Added" column header with sort toggle on `created_at`, display formatted date in row cells.

---

## Phase 11: Bug Fix — purchase_price Currency Symbols

- [x] T022 Update `lib/validations/domain.ts` — add `.transform()` to strip `$`/`€`/`£` from `purchase_price` before `Number()` parsing in `csvRowSchema`.

---

## Notes

- Total: 22 tasks across 11 phases
- [P] tasks can run in parallel
- [Story] label maps task to specific user story
- Each user story independently testable
- All existing [DONE] features not listed must remain untouched
- Commit after each phase
- Run `npm run typecheck && npm run lint` after each phase that introduces new code
