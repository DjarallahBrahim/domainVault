# Feature Specification: TLD Domain Columns & Sync UI

**Feature Branch**: `016-tld-domain-columns`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "# DNS Checker → TLD Reservation Checker Phase 19 & 20 (in the same spec)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View TLD Reservation Status in Domains Table (Priority: P1)

A domain investor views their domains table and wants to see, at a glance, which domains have competing TLD registrations. A new "TLDs Reserved" column shows the count of reserved TLDs for each domain. Domains with zero or unknown counts show a refresh button. Domains with registered competitors show the count as a clickable badge that expands to reveal which TLDs are taken.

**Why this priority**: The domains table is the primary portfolio view. Without a TLD status column, all the backend infrastructure (Phases 14–18) is invisible to the user. This column makes TLD data actionable — showing threats (competing registrations) and opportunities (available TLDs) inline.

**Independent Test**: Load the domains table with domains that have TLD check data. Verify the "TLDs Reserved" column appears before the Actions column. Verify domains with counts > 0 show the count in a badge. Verify domains with NULL/0 counts show a refresh icon button.

**Acceptance Scenarios**:

1. **Given** a domain has `reserved_tlds_count = 0` or `NULL`, **When** the user views the domains table, **Then** the TLD column for that row shows a small refresh icon button instead of a count. Clicking it triggers a single-domain check and updates the count inline once complete.
2. **Given** a domain has `reserved_tlds_count > 0`, **When** the user views the domains table, **Then** the TLD column shows the count in a pill/badge with a small chevron-down icon, inviting the user to expand it.
3. **Given** the user clicks the count badge for a domain with 5 reserved TLDs, **When** the popover opens, **Then** a dropdown list appears showing each reserved TLD extension (e.g., ".io", ".ai") with a live/not-live indicator. Each row is clickable and opens `https://{word}.{tld}` in a new tab.
4. **Given** the dropdown is loading its data, **When** the user opens it, **Then** skeleton rows appear while the extension data is fetched, then populate with the actual TLDs.
5. **Given** a domain has `reserved_tlds_count > 0` but the dropdown fetch returns zero results (defensive edge case), **When** the dropdown opens, **Then** a message states "No reserved TLDs" without errors.

---

### User Story 2 - Trigger Single-Domain Refresh from the Table (Priority: P1)

A user adds a new domain to their portfolio and wants to immediately check its TLD status without leaving the domains table. They click the refresh icon in the TLD column for that row, see a brief spinner, and the count updates inline once the check completes.

**Why this priority**: Pairing the column display with inline refresh closes the loop — users can both see and update TLD data without navigating to a separate tool. This is the primary daily workflow for domain investors checking new acquisitions.

**Independent Test**: Click the refresh icon on a domain row with no TLD check data. Verify a spinner appears, the API is called, and the count badge replaces the icon once results are returned. Verify the database row is updated.

**Acceptance Scenarios**:

1. **Given** the user clicks the refresh icon on a domain row, **When** the check is in progress, **Then** a small spinner replaces the icon, indicating activity. The rest of the row remains interactive.
2. **Given** a single-domain refresh completes successfully, **When** the response arrives, **Then** the column updates inline — the spinner is replaced by the new count badge, and no page reload is required. The count reflects the actual number of reserved TLDs.
3. **Given** a single-domain refresh fails (network error, timeout), **When** the error occurs, **Then** the spinner is replaced by the original icon or an error indicator, and the user can retry by clicking again.

---

### User Story 3 - Sync All Domains with Scope Selection (Priority: P2)

A user wants to check TLD status for their entire portfolio or just the domains visible on the current page. They click a "Sync TLDs" button near the table controls, choose their scope, confirm, and watch progress update as the job processes. When the sync completes, the table counts update automatically.

**Why this priority**: Batch sync is essential for portfolio-scale users, but the column view (US1) and single-row refresh (US2) are sufficient for ad-hoc workflows. This story completes the self-service experience — users don't need to understand API routes or job infrastructure.

**Independent Test**: Click "Sync TLDs", select "Current page" scope, confirm start. Verify a progress indicator appears, the job processes, and upon completion the table row counts update to reflect the new data.

**Acceptance Scenarios**:

1. **Given** the domains table is displayed, **When** the user clicks the "Sync TLDs" button, **Then** a small modal or popover opens with two scope options: "All domains" (shows total domain count) and "Current page" (shows count of visible domains).
2. **Given** the user selects a scope and confirms, **When** the sync job starts, **Then** the Sync button is disabled and shows live progress (e.g., "Syncing... 45/150 (30%)"). The progress updates without page reload.
3. **Given** a sync job is running, **When** per-domain results are persisted, **Then** the domains table row counts update live (via the same real-time subscription or by refetching the visible page when the job completes).
4. **Given** a sync job completes, **When** the final pair is processed, **Then** a notification appears with a summary (e.g., "Checked 50 domains — 340 reserved TLDs found"). The Sync button re-enables for another run.
5. **Given** a sync job fails, **When** the error occurs, **Then** the job's error message is surfaced in the UI alongside a "Retry" option. The Sync button re-enables.

---

### Edge Cases

- What happens when a user opens the TLD dropdown for a domain that hasn't been checked yet (count is 0 but they somehow still trigger the dropdown)? → The popover shows "No data — click refresh to check."
- How does the system handle very large TLD counts (e.g., 500+ reserved TLDs for a short/common word)? → The dropdown limits to 100 items with a "View all" option or virtualizes the list.
- What happens when the user rapidly clicks refresh on multiple domain rows? → Each click triggers an independent API call. Rows update independently as their results return — no queue or lockout needed since single-domain refresh is lightweight.
- How does the domains table handle the case where `domain_extension_checks` has rows but `domains.reserved_tlds_count` is NULL (inconsistent state)? → The column shows the refresh icon. Clicking refresh recomputes the count and fixes the inconsistency.
- What happens when the "Current page" scope is selected but the user has paginated to a different page between opening the modal and confirming? → The scope snapshot is taken at confirm time, using the domain IDs currently rendered on screen.
- How does the progress bar behave if the user closes the modal while a sync is running? → Progress is shown inline on the Sync button itself (not in the modal). The modal is only for scope selection and closes after confirmation.

## Requirements *(mandatory)*

### Functional Requirements

**Domains Table Column (Phase 19)**

- **FR-001**: The domains table MUST display a new "TLDs Reserved" column positioned before the Actions column. On mobile, the column MUST be visible in the card layout.
- **FR-002**: For domains with `reserved_tlds_count` of NULL or 0, the column MUST render a small refresh icon button. Clicking it MUST trigger a single-domain TLD check and update the column inline on completion without page reload.
- **FR-003**: For domains with `reserved_tlds_count > 0`, the column MUST render the count as a clickable pill/badge with a small chevron-down icon indicating it can be expanded.
- **FR-004**: Clicking the count badge MUST open a popover/dropdown listing every reserved TLD for that domain. Each TLD row MUST show the extension (e.g., ".io") and a live/not-live indicator. Rows MUST be clickable, opening `https://{word}.{tld}` in a new browser tab.
- **FR-005**: The dropdown MUST show skeleton rows while its data is being fetched from the API. Once loaded, it MUST populate with the actual TLD list sorted with reserved items first.
- **FR-006**: The dropdown MUST handle the empty state — if the count is positive but the API returns zero results, it MUST display "No reserved TLDs" without errors.
- **FR-007**: The refresh icon button MUST show a spinner while the single-domain check is in progress. The rest of the table row MUST remain interactive.
- **FR-008**: If a single-domain refresh fails, the spinner MUST be replaced by the original icon (or an error indicator), and the button MUST remain clickable for retry.

**Sync Button & Scope Selection (Phase 20)**

- **FR-009**: A "Sync TLDs" button MUST be placed near the domains table's controls (adjacent to pagination or filter controls). It MUST be visually distinct from the per-row refresh icon.
- **FR-010**: Clicking "Sync TLDs" MUST open a modal or popover with two scope options: "All domains" (displays the total domain count for the user) and "Current page" (displays the count of domains on the current visible page).
- **FR-011**: Confirming a scope MUST trigger the sync job API endpoint with the resolved scope and domain IDs. The modal MUST close after confirmation.
- **FR-012**: While a sync job is running, the Sync button MUST be disabled and display live progress as a percentage and pair count (e.g., "Syncing... 45/150 (30%)"). Progress MUST update without page reload.
- **FR-013**: When a sync job completes, the system MUST display a notification summarizing the results (e.g., "Checked 50 domains — 340 reserved TLDs found"). The Sync button MUST re-enable.
- **FR-014**: When a sync job fails, the system MUST display the job's error message alongside a "Retry" option. The Sync button MUST re-enable.
- **FR-015**: After a sync completes, the domains table row counts MUST update to reflect the new data — either via real-time updates as results land, or by refetching the visible page when the job finishes.

### Key Entities

- **TLD Column Cell**: The rendered content for one domain row in the "TLDs Reserved" column. Has three states: refresh icon (no data), count badge (has reserved TLDs), and spinner (check in progress). State transitions based on `reserved_tlds_count` and local UI state.
- **TLD Dropdown**: A popover listing each reserved TLD for a single domain. Contains rows of `{ extension, isLive, fullDomain }` loaded from the extensions API. Supports loading, populated, and empty states.
- **Sync Scope Modal**: A modal/popover for selecting which domains to sync. Presents two options: "All domains" (scope = "all") and "Current page" (scope = "page" with currently rendered domain IDs). Closes after confirmation.
- **Sync Progress State**: The Sync button's state machine: `idle` → `running` (shows progress) → `completed` (shows summary notification) or `failed` (shows error + retry) → `idle`.
- **Single-Domain Refresh State**: The per-row refresh button's state machine: `idle` (shows icon) → `loading` (shows spinner) → `updated` (replaces with count badge) or `error` (reverts to icon).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see the TLD reservation count for every domain in the portfolio table without scrolling horizontally on desktop (≥ 1024px) — the column fits within the visible table width.
- **SC-002**: Opening the TLD dropdown for a domain with 50 reserved extensions loads and displays results in under 2 seconds from the click.
- **SC-003**: A single-domain refresh from the table row icon completes and updates the inline count within 20 seconds (inherited from the API's synchronous constraint).
- **SC-004**: The Sync TLDs button is discoverable within 5 seconds of scanning the domains table controls area — it does not require a manual search.
- **SC-005**: After a sync job completes, 100% of the domains on the current page show updated `reserved_tlds_count` values without requiring a page refresh.
- **SC-006**: The Sync button progress percentage stays within 5% of the actual server-side progress (e.g., if 50% processed server-side, the button shows 47–53%).
- **SC-007**: The entire domains table with the TLD column renders as fast as the table did before the column was added — no perceivable slowdown for tables up to 200 domains.
- **SC-008**: On mobile (< 768px), the TLD status is visible in the card layout for each domain — either as a badge or a refresh icon.

## Assumptions

- Phases 17–18 (API routes and batch sync engine) are complete and provide: `POST /api/tld-checker/jobs`, `GET /api/tld-checker/jobs/:id`, `POST /api/tld-checker/domains/:id/refresh`, `GET /api/tld-checker/domains/:id/extensions`.
- Phase 16 (TLD enrichment engine) and Phase 14 (data model) are complete and the `domains.reserved_tlds_count` column is populated by prior sync operations.
- The existing domains table component supports adding new columns and has an established pattern for badges, dropdowns, and icon buttons.
- The Supabase Realtime subscription from Phase 17 is available for live sync progress updates on the Sync button.
- Domain names in the portfolio include the TLD (e.g., "acmecorp.com"), so constructing `https://{root}.{tld}` for dropdown links uses the same `extractRootWord` utility from Phase 16.
- The domains table already fetches `reserved_tlds_count` as part of its standard query — either the column was added to the SELECT or the API response includes it.
- Mobile card layout for domains already exists and can accommodate an additional inline element (badge or icon button) without layout rework.
- Single-domain refresh (Phase 18) completes within 20 seconds for up to 10 active TLDs, which is the expected default list size.
- The TLD dropdown data is fetched on-demand (lazy-loaded) when the user clicks the count badge, not preloaded for all rows.
