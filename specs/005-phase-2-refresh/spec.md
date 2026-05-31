# Feature Specification: Phase 2 Refresh — CSV Import, Manual Entry & Domain Management

**Feature Branch**: `005-phase-2-refresh`

**Created**: 2026-05-24

**Status**: Draft

**Input**: "Update existing codebase to match Phase 2 v2 master plan. Missing stories
US-009b, US-009c, US-030, US-031 must be added. US-007 and US-009 need targeted
updates. Plus bug fix: dialog/slide-over transparency (z-index issue)."

**Tags legend**:
- **[DONE]** — Don't touch. Fully implemented, stable, no changes needed.
- **[NEW]** — Build from scratch. Not yet implemented.
- **[UPDATED]** — Modify as described. Exists but needs change.
- **[DELETED]** — Remove from codebase. No longer needed.

## Clarifications

### Session 2026-05-24

- Q: Should the "Add Domain" form open as a modal dialog, inline form, or separate page? → A: Per master plan US-010 — slide-over panel from the Domains page; US-030 — inline tab on the Import page. Two distinct entry points.
- Q: Slide-over panel vs centered modal dialog for "Add Domain"? → A: Centered modal dialog — full overlay, sidebar hidden, form centered on page with backdrop. Replaces the slide-over approach.
- Q: What's the scope of this spec? → A: All Phase 2 stories defined in the master plan.md that are NOT yet complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — CSV Preview Table: Add Registrar Column (Priority: P1) [UPDATED]

The CSV preview table shown after parsing but before import currently displays
columns: Domain, Expiration Date, Price, Status. Per US-007 in the master plan,
it must also include the **Registrar** column so users can verify registrar data
before importing.

**Why this priority**: The master plan explicitly changes US-007 from v1 to add the
Registrar column. Without it, users can't verify registrar data in the preview.

**Independent Test**: Upload a CSV with Registrar column filled. Verify Registrar
appears in the preview table alongside Domain and Price. Upload a CSV without
Registrar — column shows empty/blank in preview. No regressions to the existing
preview flow.

**Acceptance Scenarios**:

1. **Given** a CSV file with Domain, Price, and Registrar columns, **When** the
   preview table renders, **Then** Registrar values appear in a dedicated column.
2. **Given** a CSV file without a Registrar column, **When** the preview renders,
   **Then** the Registrar column shows empty cells without errors.

---

### User Story 2 — Domain List: Add Registrar Column & Enter-Key Search (Priority: P1) [UPDATED]

Per US-009 in the master plan, the domain list table must include a **Registrar**
column between TLD and Expiration Date. Additionally, the search input must trigger
only on **Enter key press or search button click** — not on every keystroke
(as it currently does via debounce). Pagination options must include 25, 50, and
100 per page. An "Export to CSV" button must be available.

**Why this priority**: Registrar is a core data point for portfolio management.
Real-time search on every keystroke generates excessive queries. Export enables
users to move data out of the app.

**Independent Test**: Navigate to Domains page. Verify Registrar column appears.
Type a search term and press Enter — search triggers. Type without pressing Enter —
search does NOT trigger. Change page size to 25/100 — pagination adjusts. Click
Export CSV — file downloads with current filtered/sorted view.

**Acceptance Scenarios**:

1. **Given** the domain list table, **When** rendered, **Then** columns include:
   Domain, TLD, Registrar, Expiration Date, Days Until Expiry, Price, Status, Actions.
2. **Given** a user typing in the search input, **When** they type characters
   without pressing Enter, **Then** the list does NOT re-filter on each keystroke.
3. **Given** a user typing in the search input, **When** they press Enter or click
   the search button, **Then** the list filters to matching domains.
4. **Given** the pagination control, **When** the user selects 25, 50, or 100 per
   page, **Then** the page size updates and the list re-fetches.
5. **Given** the domain list with current filters/sort applied, **When** the user
   clicks "Export CSV", **Then** a CSV file downloads containing only the
   currently visible columns and filtered domains.

---

### User Story 3 — Multi-Domain Search (Priority: P2) [NEW]

Per US-009b in the master plan, the search input supports comma-separated domain
names. Each token is trimmed and matched independently against the domain column.
Results show all domains matching ANY of the tokens. Placeholder text:
"Search domains (comma-separate multiple)".

**Why this priority**: Users often need to look up specific domains by name.
Pasting a list of domain names (e.g., from a spreadsheet column) and finding
matches is a key productivity feature.

**Independent Test**: Enter "google.com, example.org, github.io" in the search bar
and press Enter. All three domains (or subsets if not all exist) appear. Enter a
single domain without commas — works as before. Enter commas with extra spaces —
tokens are trimmed.

**Acceptance Scenarios**:

1. **Given** a user enters "example.com, test.org" and presses Enter, **When** the
   search triggers, **Then** all domains matching "example.com" OR "test.org" appear
   (case-insensitive OR-match across tokens).
2. **Given** a user enters "  example.com  ,   test.org  " with irregular spacing,
   **When** the search triggers, **Then** leading/trailing whitespace on each token
   is trimmed before matching.
3. **Given** a user enters a single domain without commas, **When** the search
   triggers, **Then** exact-match behavior is preserved (no regression).

---

### User Story 4 — Improved Filters (Priority: P2) [NEW]

Per US-009c in the master plan, the filter bar is upgraded with:
1. **Expiry window** — segmented control: `All` · `≤1 month` · `≤3 months` ·
   `≤6 months` · `≤9 months`. Selecting immediately filters without Enter key.
2. **Registrar** — dropdown populated dynamically from distinct registrar values
   in the user's portfolio. Multi-select supported. Shows domain count per registrar.
3. **Status** — multi-select: Active / Expired / Sold / Pending.
4. **Clear all** link resets all filters.

Filter state is serialized to URL query params so filtered views are shareable
and deep-linkable (used by dashboard chart navigation).

**Why this priority**: These filters are required by the dashboard's click-to-navigate
behavior (chart segments → `/domains?expiry=1m`, etc.). Without URL-synced filters,
the dashboard navigation is broken.

**Independent Test**: Select expiry window "≤3 months" — list filters immediately.
Add registrar "GoDaddy" — list narrows further. Select status "Active" — list narrows.
Click "Clear all" — all filters reset. Refresh page — filters persist via URL params.
Navigate from dashboard chart click to `/domains?expiry=1m` — filter auto-applied.

**Acceptance Scenarios**:

1. **Given** the expiry window filter set to "≤3 months", **When** selected,
   **Then** only domains expiring within 3 months appear (immediate, no Enter).
2. **Given** the registrar dropdown, **When** opened, **Then** it shows distinct
   registrar names with domain counts, supports multi-select, and filters on select.
3. **Given** the status multi-select with "Active" and "Sold" selected,
   **When** applied, **Then** only domains with those statuses appear.
4. **Given** multiple filters active, **When** the user clicks "Clear all",
   **Then** all filters reset, URL params cleared, full list restored.
5. **Given** the URL `/domains?expiry=3m&registrar=GoDaddy`, **When** loaded,
   **Then** the expiry window and registrar filters are auto-applied.

---

### User Story 5 — Add / Edit Domain: Centered Modal Dialog (Priority: P1) [UPDATED]

Per US-010 in the master plan, the domain add/edit form must be a **centered modal
dialog** (overlay on the domains list page, sidebar hidden). Fields: Domain*,
Expiration Date*, Purchase Price, **Status** (dropdown), Registrar (text input with
**autocomplete** from existing registrar values), Tags (**chip input** — add/remove
individual tags), Notes. Domain name is validated on blur. Edit mode pre-populates all
fields. Optimistic UI update on save. Modal has entrance/exit animation.

Additionally, fix the z-index/transparency issue: the modal dialog must render
above the domain list with a visible, opaque backdrop. The sidebar must be hidden
while the modal is open to give the form full attention.

**Why this priority**: The previous slide-over approach left the sidebar visible and
was inconsistent with user expectations. A centered modal dialog provides better
focus, matches the application's existing Dialog pattern, and hides distractions.

**Independent Test**: Click "Add Domain" — modal dialog appears centered with opaque
backdrop, sidebar hidden. Fill in Status dropdown — options: Active/Expired/Sold/
Pending. Type in Registrar — autocomplete suggestions appear. Add tags via chip
input — tags appear as removable chips. Edit an existing domain — all fields
pre-populated except Domain (read-only). Save — modal closes, list updates.

**Acceptance Scenarios**:

1. **Given** a user clicks "Add Domain", **When** the modal opens, **Then** a
   centered modal dialog appears with an opaque backdrop, the sidebar is hidden,
   and the form is focused (no transparency issue).
2. **Given** the add-domain modal, **When** the user types in the Registrar field,
   **Then** autocomplete suggestions appear showing existing registrar values from
   their portfolio (dropdown below the input).
3. **Given** the add-domain modal, **When** the user types tags and presses Enter
   or comma, **Then** a chip appears for each tag with an X to remove it.
4. **Given** the edit-domain modal, **When** opened for an existing domain,
   **Then** all fields are pre-populated and the Domain field is read-only.
5. **Given** the add-domain modal, **When** the user tabs or clicks away from the
   Domain field, **Then** validation happens on blur — invalid domain shows inline
   error; existing domain shows "Domain already exists" error.

---

### User Story 6 — Manual Domain Entry on Import Page (Priority: P2) [NEW]

Per US-030 in the master plan, the Import page (`/import`) has two tabs:
**"CSV Upload"** and **"Add Manually"**. The Add Manually tab contains an inline
form: Domain name* (validated on blur), Expiration Date* (date picker), Purchase
Price (number input), Registrar (text input with autocomplete), Notes (textarea),
Tags (chip input). Submit button: "Add Domain". On submit: insert domain, show
success inline, reset form for next entry. No redirect — user can add multiple
domains sequentially. Error shows inline.

**Why this priority**: Provides an alternative manual entry flow on the Import page
for users who prefer bulk single-entry. Complements the slide-over panel on the
Domains page (US-010).

**Independent Test**: Navigate to `/import`. See "CSV Upload" tab (default) and
"Add Manually" tab. Switch to "Add Manually". Fill in domain, date, submit.
Success message appears, form resets, domain appears in domain list. Fill in invalid
domain — inline error, form not reset.

**Acceptance Scenarios**:

1. **Given** a user on the Import page, **When** they click the "Add Manually"
   tab, **Then** a form appears with: Domain*, Expiration Date*, Purchase Price,
   Registrar, Notes (textarea), Tags (chip input), and a "Add Domain" button.
2. **Given** a valid domain submitted via the Add Manually tab, **When** the
   insert succeeds, **Then** a success message appears inline below the form,
   the form resets to empty, and the domain appears in the portfolio.
3. **Given** an invalid domain (no dot), **When** submitted, **Then** an inline
   error appears, and the form retains the entered data (not reset).
4. **Given** the Add Manually form, **When** the user submits multiple domains
   sequentially, **Then** each is added without page redirect or tab switch.

---

### User Story 7 — CSV Column Reference Banner (Priority: P3) [NEW]

Per US-031 in the master plan, the CSV Upload tab displays a styled info banner
at the top showing the expected CSV format. A copy-to-clipboard button copies a
header row. A downloadable sample CSV file is available.

**Why this priority**: Reduces support friction for new users unfamiliar with the
expected CSV format. Downloadable sample lets them test the import flow immediately.

**Independent Test**: Navigate to `/import` → CSV Upload tab. Banner shows expected
columns. Click copy button → header row copied to clipboard. Click sample download
→ CSV file downloads with header row + 2 example rows.

**Acceptance Scenarios**:

1. **Given** the CSV Upload tab, **When** loaded, **Then** an info banner displays
   "Required: Domain, Expiration Date / Optional: Price, Registrar, Notes, Tags".
2. **Given** the copy button on the banner, **When** clicked, **Then** the text
   `Domain,Expiration Date,Price,Registrar,Notes,Tags` is copied to clipboard.
3. **Given** the download sample link on the banner, **When** clicked, **Then** a
   CSV file downloads with a header row and 2 example data rows.

---

### Already Complete — No Changes Required

These features are classified **[DONE]** and MUST NOT be modified:

| Feature | Status | Justification |
|---|---|---|
| CSV file upload (drag-and-drop + file picker) | **[DONE]** | Fully functional; PapaParse integration; 10 MB limit enforced |
| CSV parsing (case-insensitive dedup, header trimming) | **[DONE]** | `csvRowSchema` Zod validation; case-insensitive domain matching |
| Import mode toggle (Skip vs Update existing) | **[DONE]** | `csv-option-toggle.tsx`; defaults to "Skip" |
| Import progress indicator | **[DONE]** | `csv-progress.tsx` shows parsing/importing/done phases |
| Import summary (imported, skipped, errors) | **[DONE]** | `csv-summary.tsx` with per-row error detail |
| Import log record creation | **[DONE]** | `createImportLog()` writes filename, counts, errors JSONB |
| Domain status badge (active/expired/sold/pending) | **[DONE]** | Color-mapped per constitution |
| Domain expiry badge (countdown + color) | **[DONE]** | 30/90/180 day thresholds per constitution |
| Domain detail page (full record view) | **[DONE]** | `app/(dashboard)/domains/[id]/page.tsx` |
| Single domain delete (with confirmation) | **[DONE]** | `domain-delete-dialog.tsx`; optimistic removal |
| Bulk domain delete (max 50, with confirmation) | **[DONE]** | Checkbox selection + bulk-delete button |
| Import history list (filename, date, counts) | **[DONE]** | `import-log-list.tsx`; 50 most recent |
| Import history error detail (expandable per log) | **[DONE]** | `import-log-detail.tsx` renders JSONB errors |
| Responsive domain table (card <480px, scroll 480-767px, table ≥768px) | **[DONE]** | per constitution breakpoints |
| Skeleton loaders (domain list, detail, import history) | **[DONE]** | Shimmer placeholders on all async fetches |
| TanStack Query cache (centralized keys, optimistic mutations) | **[DONE]** | `lib/query-keys.ts`; all mutations optimistic |
| Zod validation (csvRowSchema, domainEditSchema, domainFiltersSchema) | **[DONE]** | `lib/validations/domain.ts` |
| Typed database helpers (domains.ts, domains-client.ts, import-logs.ts) | **[DONE]** | Split server/client pattern per constitution v1.1.0 |
| Per-user data isolation (RLS) | **[DONE]** | Enforced by Supabase; domains and import_logs scoped |
| Insert domain function (`insertSingleDomain`) | **[DONE]** | `domains-client.ts`; case-insensitive dedup |

### No Longer Needed

| Item | Status | Justification |
|---|---|---|
| `domain-add-dialog.tsx` (original modal) | **[DELETED]** | Superseded in previous iteration |
| `domain-add-slideover.tsx` (slide-over) | **[DELETED]** | Per Q2 clarification — replaced by centered modal dialog (`domain-add-dialog.tsx`) |

## Requirements *(mandatory)*

### Functional Requirements

#### CSV Preview — Registrar Column [UPDATED]

- **FR-001**: [UPDATED] CSV preview table MUST include a Registrar column between
  Price and Status columns.

#### Domain List — Registrar, Search, Pagination, Export [UPDATED]

- **FR-002**: [UPDATED] Domain list table MUST include a Registrar column after TLD.
- **FR-003**: [UPDATED] Domain search MUST trigger only on Enter key press or search
  button click, NOT on keystroke.
- **FR-004**: [NEW] Domain search MUST support comma-separated multi-domain tokens
  (US-009b). Each token is trimmed and matched independently via OR-logic.
- **FR-005**: [NEW] Pagination MUST support 25, 50, and 100 items per page options.
- **FR-006**: [NEW] Domain list MUST include an "Export CSV" button that downloads a
  CSV file of the currently filtered/sorted domains.

#### Improved Filters [NEW]

- **FR-007**: [NEW] Filter bar MUST include an expiry window segmented control:
  All, ≤1 month, ≤3 months, ≤6 months, ≤9 months. Selecting applies filter immediately.
- **FR-008**: [NEW] Filter bar MUST include a registrar dropdown populated dynamically
  from distinct registrar values in the user's portfolio, with count per registrar and
  multi-select support.
- **FR-009**: [NEW] Filter bar MUST include a status multi-select: Active, Expired,
  Sold, Pending.
- **FR-010**: [NEW] Filter bar MUST include a "Clear all" link that resets all
  filters to defaults.
- **FR-011**: [NEW] Filter state MUST be serialized to URL query params so filtered
  views are shareable. Loading a URL with params auto-applies the filters.

#### Add / Edit Domain — Centered Modal Dialog [UPDATED]

- **FR-012**: [NEW] "Add Domain" MUST open a centered modal dialog (overlay) on the
  domains list page with the sidebar hidden. The modal uses a visible opaque backdrop.
- **FR-013**: [UPDATED] Domain add form MUST include a Status field (dropdown:
  Active, Expired, Sold, Pending) in addition to existing fields.
- **FR-014**: [NEW] Registrar field MUST include autocomplete, suggesting matching
  registrar values from the user's existing portfolio as the user types.
- **FR-015**: [NEW] Tags field MUST use a chip input pattern — typing + Enter
  creates a removable chip per tag; individual chips have an X to remove.
- **FR-016**: [UPDATED] Domain name MUST be validated on blur (client-side regex
  + server-side duplicate check), showing inline error if invalid.
- **FR-017**: [NEW] The modal dialog MUST correct the z-index/transparency issue —
  the modal and backdrop must render fully opaque above the page content, and the
  sidebar must be hidden while the modal is open.

#### Manual Entry on Import Page [NEW]

- **FR-018**: [NEW] Import page MUST have two tabs: "CSV Upload" (default) and
  "Add Manually".
- **FR-019**: [NEW] "Add Manually" tab MUST contain an inline form with: Domain name*
  (validated on blur), Expiration Date* (date picker), Purchase Price (number),
  Registrar (autocomplete), Notes (textarea), Tags (chip input), and "Add Domain"
  submit button.
- **FR-020**: [NEW] On successful add via the inline form, a success message MUST
  appear inline and the form MUST reset for the next entry. No page redirect.
- **FR-021**: [NEW] On error (validation or duplicate), the error MUST appear inline
  and the form MUST retain entered data (not reset).

#### CSV Column Reference Banner [NEW]

- **FR-022**: [NEW] CSV Upload tab MUST display an info banner showing required and
  optional CSV columns.
- **FR-023**: [NEW] Banner MUST include a copy-to-clipboard button that copies the
  header row: `Domain,Expiration Date,Price,Registrar,Notes,Tags`.
- **FR-024**: [NEW] Banner MUST include a downloadable sample CSV file with header
  row and example data rows.

### Key Entities

- **Domain** (existing): No schema changes. New UI fields surfaced: Registrar (already
  in DB), Status (already in DB with check constraint). Tags field now uses chip input
  pattern instead of comma-separated text input.
- **Import Log** (existing): No changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The CSV preview table renders the Registrar column for all rows within
  the same parse performance (<2s for 1000 rows).
- **SC-002**: Domain search triggers within 500ms of Enter key press; no queries occur
  during typing.
- **SC-003**: Comma-separated search with 5 domain tokens returns correct OR-matched
  results within 2 seconds.
- **SC-004**: Filter state survives page refresh via URL params and auto-applies on
  load within 1 second.
- **SC-005**: Export CSV downloads a complete file for 1000 domains within 3 seconds.
- **SC-006**: Centered modal dialog opens with full opacity (no transparency), sidebar
  hidden, and animates within 300ms.
- **SC-007**: Registrar autocomplete shows suggestions within 300ms of typing in the
  input field.
- **SC-008**: The manual entry inline form on Import page supports adding 5 domains
  sequentially in under 60 seconds without page navigation.
- **SC-009**: The copy-to-clipboard button copies the header row with a visible
  feedback (toast or icon change) within 200ms.
- **SC-010**: The sample CSV downloads as a valid `.csv` file with 1 header + 2 data
  rows when clicked.
- **SC-011**: All existing Phase 2 features listed in [DONE] continue to function
  without regression after all changes are applied.
- **SC-012**: The application builds with zero TypeScript errors and zero ESLint
  warnings after all changes are applied.
- **SC-013**: Pasted CSV text with valid rows imports successfully with zero errors on
  first attempt.
- **SC-014**: The BIN column migration applies idempotently and the column appears in
  the CSV import, export, table, and edit form.
- **SC-015**: Sorting by Added date toggles between ascending and descending in under
  500ms for up to 1000 domains.

## Assumptions

- The modal dialog uses shadcn/ui Dialog component (already installed) or can be built
  with existing primitives. Entrance/exit animation uses the Dialog's built-in
  transition.
- Registrar autocomplete uses an existing query function that fetches distinct
  registrar values (already used by domain filters).
- The chip input for tags can be built with controlled input + state array; no
  external library needed.
- Tabs on the Import page use a simple tab pattern (e.g., shadcn/ui Tabs or
  custom state-toggle component).
- The CSV column reference banner is a static UI element with hardcoded column names.
- The sample CSV file is a static asset or generated client-side as a Blob download.
- URL query param serialization uses the existing URL search params pattern already
  implemented for status/TLD/sort filters.
- The export CSV feature uses a client-side Blob download approach (no server endpoint
  needed) — same pattern as error-rows download in CSV import.

## US-032: Paste CSV Text Import

**Status**: [NEW]

As a user, I want to paste raw CSV rows directly into the upload page so I can quickly import a few domains without creating a file.

### Acceptance Criteria

- **AC-032-01**: The CsvUploader component is split into two side-by-side panels: "Paste CSV text" (left) and "Upload CSV file" (right), separated by a vertical "or" divider.
- **AC-032-02**: The left panel has a `<textarea>` with placeholder example rows matching the accepted column format.
- **AC-032-03**: A format hint above the textarea shows accepted columns: `domain, expiration_date, purchase_price, bin, registrar, notes, tags` with required columns highlighted.
- **AC-032-04**: An "Import" button below the textarea is enabled only when content is non-empty.
- **AC-032-05**: On click, the textarea value has the expected header row prepended, then `onContentReady(content, "pasted-data.csv")` is called.
- **AC-032-06**: Each non-empty line is validated to contain at least one comma; otherwise a `toast.error` is shown.
- **AC-032-07**: The right panel keeps the original drag-and-drop / click-to-browse behavior unchanged.
- **AC-032-08**: Layout uses `grid-cols-[1fr_auto_1fr]` with equal-height sections (`items-stretch`).

## US-033: BIN (Asking Price) Column

**Status**: [NEW]

As a domain investor, I want to store the asking (BIN) price for each domain separately from the purchase price, so I can track my desired sale price during the listing phase.

### Acceptance Criteria

- **AC-033-01**: A new `bin DECIMAL(10,2)` column exists on the `domains` table (migration `004_bin_column.sql`).
- **AC-033-02**: CSV import supports the `bin` column (optional, strips `$`/`€`/`£` before parsing, non-negative number validation).
- **AC-033-03**: The domain table displays a "BIN" column next to "Purchase" (renamed from "Price").
- **AC-033-04**: The domain edit form includes a "BIN ($)" number input field.
- **AC-033-05**: CSV export includes the BIN column.
- **AC-033-06**: The paste-text format hint and placeholder include the `bin` column.

## US-034: Sort by Added Date

**Status**: [NEW]

As a user, I want to sort my domains by when they were added (created_at date), so I can see my most recently imported domains first.

### Acceptance Criteria

- **AC-034-01**: A sortable "Added" column header exists in the domain table, toggling asc/desc on `created_at`.
- **AC-034-02**: The column displays the formatted date from `created_at` for each row.
- **AC-034-03**: Sort state is serialized in URL query params consistent with other sort columns.

## Bug Fix — CSV purchase_price Currency Symbols

**Fix**: `$`/`€`/`£` characters in `purchase_price` column values (e.g. `16.00$`, `$26.00`) caused validation failures — ~388 of 480 rows silently rejected. Added `.transform()` to strip currency symbols before `Number()` parsing in `csvRowSchema`.
