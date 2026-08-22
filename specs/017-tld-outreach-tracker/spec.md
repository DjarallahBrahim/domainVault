# Feature Specification: Promoting (TLD Outreach Tracker)

**Feature Branch**: `017-tld-outreach-tracker`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "read @plan.md phase # Phase 23 · Promoting (TLD Outreach Tracker) and generate the detailed technical specifications and user stories for this phase"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track Outreach for Reserved TLDs (Priority: P1)

A domain investor who owns `word.com` wants to acquire the same word under other extensions (e.g., `word.io`, `word.ai`, `word.co`) that are already registered by someone else. They open the Promoting page, select their domain, and see a table of every reserved TLD variant. For each variant they record whether they have contacted the current owner and what the outcome of the reply was (Pending / Positive / Negative). The page is purely a manual tracking log — no outreach is sent from the platform itself.

**Why this priority**: This is the entire value of the feature. Every other element (domain picker, summary cards, empty-state actions) exists to support this single tracking workflow. Delivering this story alone gives users a working MVP: a place to manage outreach against reserved TLDs computed by the earlier TLD Reservation Checker phases.

**Independent Test**: Select a domain that already has reserved TLD data. Verify a table lists each reserved TLD. Check the "Contacted" box for one row, set its reply to "Positive", reload the page, and confirm both values persist.

**Acceptance Scenarios**:

1. **Given** a domain has reserved TLD variants, **When** the user selects it on the Promoting page, **Then** a table lists every reserved variant with three columns: the full domain (e.g., `word.io`), a "Contacted" checkbox, and a "Reply" status (Pending / Positive / Negative).
2. **Given** a user checks the "Contacted" checkbox for a TLD row, **When** the checkbox is toggled, **Then** the state updates immediately without a page reload, and the change persists after the page is refreshed.
3. **Given** a TLD row is marked as contacted, **When** the user changes the Reply status, **Then** the status updates immediately and persists. A hover tooltip on the Contacted checkbox shows when the contact was made.
4. **Given** a TLD row is **not** contacted, **When** the user attempts to set a Reply status, **Then** the Reply control is disabled with a tooltip explaining to mark the domain as contacted first.
5. **Given** the user clicks the full-domain link in the TLD column, **When** the link is clicked, **Then** the corresponding domain (e.g., `word.io`) opens in a new browser tab.

---

### User Story 2 - Select a Domain to Promote (Priority: P1)

A user with a large portfolio wants to work on outreach for a specific domain. They use a searchable domain picker to find it, see how many reserved TLDs each candidate has, and select it. The selected domain is reflected in the page URL so a specific domain's outreach view can be bookmarked or shared.

**Why this priority**: The page is domain-scoped — nothing can be tracked until a domain is chosen. This story is the gate that every other story depends on, so it shares P1 with the core tracking flow. It also establishes the deep-linkable pattern the app already uses for filtered views.

**Independent Test**: Open `/promoting` with no selection, search for and select a domain. Verify the domain is selected and the URL reflects the choice. Reload the page and verify the same domain remains selected.

**Acceptance Scenarios**:

1. **Given** the user opens the Promoting page, **When** no domain has been selected, **Then** a searchable picker is shown and the rest of the page prompts the user to select a domain.
2. **Given** the user types into the picker, **When** matches are found, **Then** results show each domain name and a small badge indicating its reserved-TLD count (or "not checked" when it has never been checked).
3. **Given** the user selects a domain from the picker, **When** the selection is confirmed, **Then** the page URL updates to include the selected domain and the summary cards and TLD table render for it.
4. **Given** a user navigates to a Promoting URL that includes a domain, **When** the page loads, **Then** that domain is pre-selected and its outreach data is shown without any additional action.
5. **Given** the user has no domains in their portfolio, **When** they open the picker, **Then** a placeholder explains there are no domains yet and directs them to add one from Import.

---

### User Story 3 - See Outreach Summary at a Glance (Priority: P2)

For the selected domain, a user wants a quick read on how much outreach progress has been made without scanning the whole table. Three summary cards show: total reserved TLDs, how many have been contacted, and how many got a positive reply (with the count of negative replies shown as supporting text).

**Why this priority**: This is a high-value convenience for portfolio-scale users but not required for the core tracking flow. It uses the same KPI-card visual language already established in the dashboard, so it is low-risk to build and gives the page a professional, scannable feel.

**Independent Test**: Mark one TLD as contacted and positive on a domain with several reserved TLDs. Verify the three cards show the correct totals and update immediately as values change.

**Acceptance Scenarios**:

1. **Given** a domain is selected, **When** the page loads, **Then** three summary cards render: Reserved TLDs (total), Contacted (count of checked rows), and Positive Replies (count of positive responses, with the number of negative replies shown as muted subtext).
2. **Given** the user checks a "Contacted" box, **When** the toggle is confirmed, **Then** the Contacted card count updates immediately without a page reload.
3. **Given** the user changes a Reply status, **When** the change is confirmed, **Then** the Positive Replies card (and its negative-reply subtext) updates immediately.
4. **Given** no TLD rows exist yet (e.g., the domain was just checked and has reserved TLDs but no outreach activity), **When** the cards render, **Then** all three show zero counts without errors.

---

### User Story 4 - Choose a Reply Outcome (Priority: P2)

After reaching out to a TLD owner, a user records the outcome of the reply. They change the Reply control from Pending to Positive or Negative. The control renders as a colored status pill so the overall table reads like a pipeline — pending, positive, and negative rows are visually distinct.

**Why this priority**: Reply outcome is the second half of the tracking record (after "Contacted"). It is what makes the data actionable — a user can quickly spot which targets are warm vs. cold. It is P2 because the MVP is still complete without it (users can track contacts only), but it substantially increases the feature's usefulness.

**Independent Test**: Contact a TLD, set its reply to Positive, verify the row's pill turns green and persists after reload. Verify the Reply control is disabled for a TLD that has not been contacted.

**Acceptance Scenarios**:

1. **Given** a TLD row is marked as contacted, **When** the user changes its Reply status, **Then** the value updates immediately and persists after reload.
2. **Given** a Reply status is Pending, **When** it is rendered, **Then** it appears as a neutral-styled pill; Positive rows appear with a success-tinted pill; Negative rows appear with a danger-tinted pill — all distinguishable at a glance.
3. **Given** a TLD row is not contacted, **When** the user views its Reply control, **Then** the control is disabled and shows a tooltip: "Mark as contacted first".
4. **Given** the user sorts the table by Reply, **When** sorting is applied, **Then** positive-reply rows sort ahead of pending and negative rows.

---

### User Story 5 - Run a TLD Check from the Promoting Page (Priority: P2)

A user selects a domain that has never been checked (or was checked and found zero reserved TLDs). Instead of a dead end, they see a friendly empty state with a single "Run TLD Check" button that triggers the existing TLD check for that one domain. When it completes, the table appears with the results — no navigating to another tool.

**Why this priority**: This story makes the page self-sufficient — a user can go from "new domain" to "outreach tracking" entirely within the Promoting page. It is P2 because it only matters when the reserved-TLD data is missing, and it reuses an existing capability rather than introducing new logic.

**Independent Test**: Select a domain that has never been checked. Verify the empty state appears with a "Run TLD Check" button. Click it, wait for completion, and verify the reserved-TLD table replaces the empty state.

**Acceptance Scenarios**:

1. **Given** a selected domain has never been checked, **When** the Promoting page renders, **Then** a friendly empty state appears explaining no TLD data exists yet, with a "Run TLD Check" button.
2. **Given** the user clicks "Run TLD Check", **When** the check is in progress, **Then** the button shows a spinner and is disabled until the check completes.
3. **Given** the check completes with reserved TLDs found, **When** results are ready, **Then** the empty state is replaced by the reserved-TLD table automatically.
4. **Given** a selected domain was checked but has zero reserved TLDs, **When** the empty state renders, **Then** the copy explains "No reserved TLDs found" (with the count of extensions checked) and offers a "Re-check" button instead.
5. **Given** no TLD reference list has been configured yet, **When** the user views the empty state, **Then** the "Run TLD Check" button is disabled with a tooltip: "No TLD list configured yet."

---

### Edge Cases

- What happens when a domain has never been checked (no TLD data at all)? → The page shows the "Run TLD Check" empty state with a one-click action; the table is not shown until data exists.
- What happens when a domain was checked but has zero reserved TLDs? → The empty state explains "No reserved TLDs found — checked X extensions" and offers a "Re-check" button. No table is shown, no crash, no dead end.
- What happens when the global TLD reference list is empty? → The "Run TLD Check" button is disabled with the tooltip "No TLD list configured yet" so the action silently does nothing.
- What happens when a user selects a domain that has reserved TLDs but no outreach rows yet? → The table treats each TLD as `Contacted: false` and `Reply: Pending`; a row is only created once the user actually toggles a checkbox or changes a reply.
- What happens when the user unchecks the "Contacted" box? → The contact is recorded as not made (and the contact timestamp is cleared); any Reply status reverts to disabled until the row is contacted again.
- What happens when the user rapidly toggles checkboxes or reply values? → Each change updates optimistically; if a write fails, the UI rolls back to the last saved state and shows an error notification.
- What happens when the user switches domains while a previous toggle is still saving? → The in-flight update targets the previously selected domain; the new selection's data loads independently and is not corrupted by the earlier write.
- What happens when the user has no domains in their portfolio? → The picker shows a placeholder directing them to add a domain via Import; no table or cards render.
- What happens when outreach data is very large (many TLDs for one domain)? → The table supports sorting; the data set is bounded by the number of reserved TLDs the check found for a single domain, so no pagination is required in v1.
- What happens if the check is re-run after outreach rows exist? → Reserved-TLD results refresh; existing outreach rows for TLDs that remain reserved are kept, and rows for TLDs no longer reserved become invisible but are not deleted.

## Requirements *(mandatory)*

### Functional Requirements

**Page & Navigation**

- **FR-001**: The system MUST provide a dedicated "Promoting" page accessible from the desktop sidebar and the mobile bottom navigation.
- **FR-002**: The page MUST be deep-linkable — a selected domain MUST be encoded in the page URL so the view can be bookmarked, shared, and restored on reload.
- **FR-003**: When a user selects a different domain, the page URL MUST update in place without a full page reload.
- **FR-004**: The system MUST scope all page content to a single selected domain. Before a domain is selected, the system MUST show a prompt to select one and MUST NOT render summary cards or the TLD table.

**Domain Selection**

- **FR-005**: The domain picker MUST be searchable by domain name and MUST list the user's active domains.
- **FR-006**: Each picker option MUST display the domain name and a small badge showing its reserved-TLD count, or "not checked" when the domain has never been checked.
- **FR-007**: When the user has no domains, the picker MUST display a placeholder directing them to add a domain via the Import feature.

**Reserved TLD Tracking Table**

- **FR-008**: For the selected domain, the system MUST display a table of its reserved TLD variants with three columns: the full domain (e.g., `word.io`), a "Contacted" checkbox, and a "Reply" status.
- **FR-009**: The TLD column MUST render the full domain as a clickable link that opens the domain in a new browser tab, and MUST include a small indicator showing whether that variant is currently live (has DNS) or not.
- **FR-010**: Checking the "Contacted" checkbox MUST update the row immediately (optimistic), persist the change, record the contact time, and show a hover tooltip with that time.
- **FR-011**: Unchecking "Contacted" MUST clear the contact state (including the recorded time) and MUST disable the row's Reply control again.
- **FR-012**: TLDs with no outreach record yet MUST be treated as "not contacted, pending reply" — no visible placeholder rows, no empty-state errors.
- **FR-013**: The table MUST support sorting by TLD (default) and by Reply status (positive first) via column headers.
- **FR-014**: On screens narrower than the desktop breakpoint, the system MUST render the same data as stacked cards (one per TLD) instead of a table, preserving all three data points and interactions.
- **FR-015**: While data is loading, the system MUST show skeleton placeholders and MUST keep the previously loaded data visible during refetches to avoid flicker.

**Reply Status**

- **FR-016**: The Reply control MUST offer three values: Pending, Positive, Negative.
- **FR-017**: The Reply control MUST be disabled until the row is marked as contacted, with a tooltip: "Mark as contacted first".
- **FR-018**: Changing a Reply value MUST update the row immediately, persist the change, and record the reply time. The control MUST render with distinct styling per status (neutral / success-tinted / danger-tinted) with a smooth transition between states.

**Summary Cards**

- **FR-019**: When a domain is selected, the system MUST display three summary cards: Reserved TLDs (total), Contacted (count of rows marked contacted), and Positive Replies (count of positive replies, with the count of negative replies shown as subtext).
- **FR-020**: The summary card counts MUST update immediately when a Contacted or Reply value changes, without a page reload.

**Empty States & Run Check**

- **FR-021**: When the selected domain has never been checked, the system MUST show an empty state explaining that no TLD data exists yet and MUST offer a "Run TLD Check" action.
- **FR-022**: When a "Run TLD Check" action is triggered, the system MUST show progress on the action button and MUST disable it until the check finishes.
- **FR-023**: When the check completes and reserved TLDs are found, the table MUST replace the empty state automatically.
- **FR-024**: When the selected domain was checked but has zero reserved TLDs, the system MUST explain "No reserved TLDs found" (including how many extensions were checked) and MUST offer a "Re-check" action instead.
- **FR-025**: When no TLD reference list has been configured, the "Run TLD Check" / "Re-check" action MUST be disabled with the tooltip "No TLD list configured yet."

**Persistence & Data Integrity**

- **FR-026**: All outreach changes (contacted state, reply status) MUST persist such that a page reload restores the exact same values.
- **FR-027**: Outreach records MUST be created only when the user first interacts with a TLD row (lazy creation) — never pre-seeded for every reserved TLD.
- **FR-028**: A user MUST only ever see and modify outreach records for domains they own; changes MUST be restricted to the current user's data.
- **FR-029**: When an optimistic update fails to persist, the system MUST roll the UI back to the last saved state and show an error notification.
- **FR-030**: This phase MUST NOT introduce any new third-party network calls — all data reads reuse the reserved-TLD results already computed by the existing TLD Reservation Checker, and all writes are to the outreach tracking log only.

### Key Entities

- **Outreach Tracking Record**: One record per (domain, TLD) pair that the user has interacted with. Captures whether the owner was contacted, when, the reply outcome (pending / positive / negative), when the reply happened, and optional notes. Created lazily on first interaction; scoped to the owning user.
- **Reserved TLD Variant**: A domain name formed from the base domain plus an extension that is already registered (e.g., `word.io` for base `word.com`). Read-only data produced by the TLD Reservation Checker; includes a live/not-live indicator from the DNS check.
- **Domain Selection**: The currently chosen domain on the Promoting page, persisted to the page URL. Drives which reserved TLDs and outreach records are shown.
- **Outreach Summary**: Aggregate counts for the selected domain — total reserved TLDs, contacted count, and positive-reply count (with negative-reply subtext). Recalculated whenever the tracking table changes.
- **Run-Check Prompt**: The empty-state panel shown when a selected domain has no reserved-TLD data. Has three variants: never checked, checked-but-zero, and no TLD list configured.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the Promoting page, select a domain, and see its reserved TLDs within 3 seconds of the selection.
- **SC-002**: Checking a "Contacted" box or changing a Reply status reflects on screen instantly (under 1 second perceived latency) and survives a full page reload with 100% accuracy.
- **SC-003**: A user can mark a TLD as contacted and record a reply outcome in under 15 seconds total, without any page reload.
- **SC-004**: At least 95% of users can find and select a specific domain from the picker on the first attempt (search + selection completes without error).
- **SC-005**: The summary cards match the underlying table state exactly at all times — no divergence between card counts and row-level data after any change.
- **SC-006**: The "Run TLD Check" empty state resolves to a populated table automatically after the check completes, with no manual refresh, for 100% of successful checks.
- **SC-007**: The page remains fully usable on a 375px-wide screen (stacked card layout) and a 1920px-wide screen (table layout) with no horizontal scrolling or clipped controls.
- **SC-008**: The feature works in both dark and light themes with no hardcoded colors, no contrast regressions, and no layout shift while data loads.

## Assumptions

- Phases 14–22 (TLD Reservation Checker) are complete: each domain's reserved TLD variants and counts are computed, the summary columns on the domain record exist, and a single-domain check capability is available to reuse.
- The selected domain's reserved TLD list and the existing single-domain check action are reused as-is — no new DNS or network logic is built in this phase.
- Outreach records are stored per (domain, TLD) pair, scoped to the owning user, and protected by the same row-level access rules as the rest of the user's portfolio data.
- The page URL's domain parameter is the only navigation state that needs to be persisted; no other filter or sort state is shared or bookmarked in v1.
- Sorting is applied client-side; the expected data volume (reserved TLDs for a single domain) is small enough that server-side pagination is unnecessary in v1.
- Reply "Positive" and "Negative" are the only reply outcomes tracked in v1; an open-text reply detail or notes field is out of scope for this phase.
- Re-running a check after outreach rows exist keeps outreach records for TLDs that remain reserved and hides (without deleting) records for TLDs no longer reserved.
- The dashboard's promotion widget (Phase 3, US-017) is unrelated to this feature and is not modified by it, even though both involve the word "promotion".