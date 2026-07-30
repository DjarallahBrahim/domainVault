# Feature Specification: TLD Reservation Checker

**Feature Branch**: `013-tld-reservation-checker`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "# DNS Checker → TLD Reservation Checker Phase 14 & 15 (in the same spec)"

## Clarifications

### Session 2026-07-30

- Q: What happens when the user changes the word input or TLD selection while a lookup is in progress — does it invalidate the current batch? → A: Block input/TLD changes entirely during an active lookup (same behavior as the DNS Checker's resolver selector being disabled during resolution).
- Q: What should the concurrent lookup limit be for availability checks? → A: 20 concurrent lookups, matching the DNS Checker's established concurrency limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check Domain Availability Across TLDs (Priority: P1)

A user has one or more brand name candidates and wants to know which TLD extensions are available for registration. They paste their base words, select the TLDs they care about, and receive immediate availability results without leaving the app.

**Why this priority**: This is the core value proposition — answering "is this domain available?" across many TLDs in seconds. Without this, the tool has no purpose. Every other feature (export, stats, nav) depends on the core check working first.

**Independent Test**: Enter the word "acmecorp" and select .com, .io, .ai from the TLD picker. Click Check. Verify a results table appears showing acmecorp.com → Registered, acmecorp.io → Available, acmecorp.ai → Registered (or similar real-world results). The table is populated within 30 seconds.

**Acceptance Scenarios**:

1. **Given** the TLD Checker page is open, **When** a user types one or more base words (e.g., "acmecorp, mybrand") into the text input, **Then** each word is parsed and displayed as a chip/tag below the input confirming it was recognized.
2. **Given** base words are entered, **When** the user selects TLDs (.com, .io, .ai) from the TLD picker and clicks "Check Availability", **Then** the system queries each combination (word + TLD) and displays results in a table with columns: Domain, Status, and any available additional info.
3. **Given** a batch check completes, **When** results are displayed, **Then** each row shows one of these statuses: Available (the domain is not registered), Registered (the domain is taken), Reserved (withheld by the registry), or Error (lookup failed).
4. **Given** a domain is listed as Registered, **When** the user clicks the domain name, **Then** the registered domain opens in a new browser tab to inspect it.
5. **Given** a lookup is in progress, **When** the user clicks Cancel or navigates away, **Then** all pending requests are aborted and the UI returns to its idle state.

---

### User Story 2 - Configure TLD Selection and Batch Size (Priority: P2)

A user wants control over which TLDs are checked and in what order. They should see popular TLDs available by default, with the ability to add custom TLDs not in the default list.

**Why this priority**: TLD selection directly impacts the value of results — a user checking .com only gets 1/10th the signal of someone checking their full target set. However, reasonable defaults mean even P1 users get useful results.

**Independent Test**: Open the TLD picker, verify .com, .net, .org, .io, .ai, .co, .app, .dev are pre-selected by default. Deselect all except .com and .io. Check a word — verify only those two TLDs are queried. Type a custom TLD (.xyz) into the "add custom" field and verify it joins the selection.

**Acceptance Scenarios**:

1. **Given** the TLD Checker page loads for the first time, **When** a user views the TLD picker, **Then** a curated set of popular TLDs (.com, .net, .org, .io, .ai, .co, .app, .dev) is displayed as selectable chips — all pre-selected by default.
2. **Given** the TLD picker is visible, **When** the user toggles individual TLD chips on/off, **Then** the selection updates visually (e.g., filled chip = selected, outline = deselected) and only selected TLDs are queried on the next check.
3. **Given** the TLD picker, **When** a user types a TLD extension (with or without the dot prefix) into a free-text "add custom TLD" field and presses Enter, **Then** that TLD is added to the selected set and appears as a chip alongside the defaults.
4. **Given** custom TLDs have been added, **When** the user returns to the tool later (same browser session), **Then** the previous TLD selection (including custom TLDs) is remembered.
5. **Given** more than 50 word+TLD combinations are queried in a single batch, **When** the check runs, **Then** the system limits concurrent lookups to prevent rate-limiting and displays a progress counter (e.g., "45/120 checked").

---

### User Story 3 - Filter, Export, and Analyze Results (Priority: P1)

After running a TLD availability check, a user needs to make decisions. They want to filter by status to see only available domains, export results for sharing with their team, and see aggregate statistics at a glance.

**Why this priority**: Without the ability to filter and export, the tool is a curiosity. Export enables the tool to feed into purchasing decisions and team workflows. Stats give at-a-glance understanding.

**Independent Test**: Run a check for "acmecorp" across 10 TLDs. Verify stat cards show: 3 Available, 6 Registered, 1 Error. Click the "Available" pill to filter the table to only available TLDs. Click "Copy CSV" and verify a CSV file with columns word, tld, domain, status copies to clipboard.

**Acceptance Scenarios**:

1. **Given** results are displayed, **When** a user views the stats area, **Then** summary cards show: Total checked, Available count (green), Registered count (amber), Reserved count (blue), and Error count (red).
2. **Given** results are displayed, **When** a user clicks a status pill (e.g., "Available 3"), **Then** the results table is filtered to show only rows matching that status. Clicking "All" clears the filter.
3. **Given** filtered results are displayed, **When** the user clicks "Copy CSV", **Then** only the currently visible (filtered) rows are included in the exported CSV — not the full unfiltered dataset.
4. **Given** results are displayed, **When** a user clicks "Copy CSV", **Then** a CSV string with columns `word, tld, domain, status` is copied to the clipboard. If the clipboard is unavailable, a `.csv` file download is triggered.
5. **Given** a domain shows as Available, **When** the user clicks a "Register" or action link next to it, **Then** they are redirected to the TLD's typical registrar or a configurable registration URL (with the domain name pre-filled if possible).

---

### User Story 4 - Integrate with App Navigation and Help (Priority: P2)

Users should find the TLD Reservation Checker through the application's normal navigation, and they should understand how to use it via in-app help content — without needing a tutorial.

**Why this priority**: Discovery and comprehension are necessary for adoption but don't add new checking capabilities. The tool is only useful if users can find it and understand its limitations.

**Independent Test**: From any page in the app, locate "TLD Checker" (or equivalent) in the sidebar. Click it and verify the tool loads. Scroll to the bottom and verify the collapsible help section explains: how to enter words, how TLD selection works, what each status means, and a brief FAQ.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they view the main sidebar and mobile bottom tab bar, **Then** a link to the TLD Reservation Checker is visible, positioned near the existing DNS Checker link.
2. **Given** the TLD Checker page is open, **When** the user scrolls to the bottom, **Then** a collapsible help section is present explaining: how to enter words (any format — comma, newline, space-separated), how TLD selection works (defaults + custom), what each status means (Available vs Registered vs Reserved vs Error), and FAQ items (privacy, rate limits, why some lookups fail).
3. **Given** the help section is collapsed, **When** the user clicks "// how to use this tool", **Then** the help content expands with a smooth animation.
4. **Given** a lookup is initiated, **When** it completes, **Then** a client-side analytics event (`tld_check_run`) is triggered with aggregate data only: word count, TLD count, total combinations checked. No domain names are transmitted.

---

### User Story 5 - Visual Polish: Terminal/Code-Editor Aesthetic (Priority: P3)

The TLD Checker should match the terminal/code-editor visual style established by the restyled DNS Checker: traffic-light title bar, monospace font, comment-style section labels, theme-aware semantic colors, and the editor-window container.

**Why this priority**: Visual consistency is important for the app's brand and user trust, but it's the least critical from a functionality standpoint. The tool works without it.

**Independent Test**: Load the TLD Checker page. Verify: title bar with red/yellow/green dots and `query.tld` label, `// WORDS` comment-style label above the input, `// TLDS` label above the TLD picker, `// STATS` label above stat cards, `// RESULTS` label above the table, monospace font on textarea and section labels, and theme tokens used for all colors (no hardcoded values). Toggle dark/light mode and verify all elements adapt.

**Acceptance Scenarios**:

1. **Given** the TLD Checker page loads in light mode, **When** viewed, **Then** the container is `rounded-xl border border-border bg-bg-surface`, with a title bar showing traffic-light dots and a file-like label.
2. **Given** the page is viewed in dark mode, **When** the user toggles theme, **Then** all colors transition to the dark palette using CSS variables (`--bg-surface`, `--border`, `--text-muted-foreground`, `--accent-success`, `--accent-danger`, `--accent-primary`). No hardcoded color values (emerald-500, amber-500, black, etc.) are present.
3. **Given** stat cards display counts, **When** viewed, **Then** Available uses a success accent ring, Registered uses a warning accent ring, Reserved uses a blue/info accent ring, and Error uses a danger accent ring.
4. **Given** the TLD picker, **When** viewed, **Then** each TLD chip uses the project's pill/badge styling with selected state matching the accent-primary token and deselected state using muted border.
5. **Given** the "Check Availability" button, **When** inactive, **Then** it displays as a monospace-styled button matching the resolver button from the DNS Checker. During lookup, it shows a progress counter.

---

### Edge Cases

- What happens when a user enters a word with special characters or unicode — are they sanitized to valid domain characters before lookup?
- How does the system handle TLDs that don't support the chosen availability-check method — does it show "Unsupported" vs "Error"?
- What happens when a user enters the same base word twice (deduplication)?
- How does the system handle premium/aftermarket domains that show as "Registered" but are actually for sale?
- What happens when a lookup is in progress and the user changes the word input or TLD selection — does it invalidate the current batch? → The word input and TLD picker are disabled during an active lookup, preventing changes until the batch completes or is cancelled.
- How does the system handle internationalized domain names (IDNs) — words with non-ASCII characters?
- What happens when a TLD registry rate-limits or blocks the availability check requests? → The system shows an "Error" status for those individual lookups with a brief reason (e.g., "Rate limited") while other lookups in the batch continue unaffected.

## Requirements *(mandatory)*

### Functional Requirements

**Core Engine & Input (Phase 14)**

- **FR-001**: The system MUST accept one or more base words/names via a text input, parsing them from any common separator format (commas, newlines, spaces, or pasted URLs).
- **FR-002**: The system MUST deduplicate base words — entering the same word multiple times MUST result in a single lookup per TLD.
- **FR-003**: The system MUST validate and sanitize base words to valid domain characters (letters, digits, hyphens), stripping leading/trailing whitespace and invalid characters.
- **FR-004**: The system MUST provide a TLD picker with a curated default set of popular TLDs (.com, .net, .org, .io, .ai, .co, .app, .dev), all pre-selected on first visit.
- **FR-005**: The system MUST allow users to toggle individual TLDs on/off from the default set and add custom TLD extensions via a free-text input.
- **FR-006**: The system MUST persist the user's TLD selection across page reloads within the same browser session.
- **FR-007**: The system MUST check availability for each combination of (base word × selected TLD) and return a status of Available, Registered, Reserved, or Error for each.
- **FR-008**: The system MUST limit concurrent availability queries to a maximum of 20 at a time and display a progress counter (e.g., "n/total checked") during batch lookups.
- **FR-009**: The system MUST allow cancellation of an in-progress batch check, aborting all pending requests and returning the UI to its idle state.
- **FR-009a**: The system MUST disable the word input and TLD picker during an active lookup, preventing changes until the batch completes or is cancelled. The Check button MUST also be disabled during an active lookup.
- **FR-010**: The system MUST display results in a table with columns: Domain (word.tld), Status (with icon), and any available contextual information (e.g., expiry date, registrar name if discoverable).

**Filter, Export & Stats (Phase 15)**

- **FR-011**: The system MUST display summary stat cards showing Total combinations checked, Available count, Registered count, Reserved count, and Error count.
- **FR-012**: The system MUST allow filtering the results table by status. Clicking a stat card or status pill applies that filter; clicking "All" clears all filters.
- **FR-013**: The system MUST provide a "Copy CSV" action that exports the current (filtered) results to the system clipboard in CSV format with columns: `word, tld, domain, status`.
- **FR-014**: When the clipboard API is unavailable, the system MUST fall back to triggering a browser file download of the CSV.
- **FR-015**: For domains with "Available" status, the system SHOULD provide a clickable action link that redirects the user to a registrar or registration URL with the domain pre-filled.
- **FR-016**: The system MUST trigger a client-side analytics event (`tld_check_run`) when a lookup batch is initiated, containing only aggregate metadata (word count, TLD count, total combinations) — no domain names.
- **FR-017**: The analytics event MUST be non-blocking — tool functionality MUST NOT be degraded if the analytics service is unavailable.

**App Integration & Help (Phase 15)**

- **FR-018**: The TLD Reservation Checker MUST be accessible from the application's primary sidebar navigation and mobile bottom tab bar.
- **FR-019**: The tool MUST render within the application's standard layout and theme (light/dark mode via CSS variables).
- **FR-020**: The tool page MUST include a collapsible in-app help section explaining: how to enter words, supported input formats, how TLD selection works, what each status means, privacy notes, and a short FAQ.

**Visual Polish (Phase 15)**

- **FR-021**: The tool MUST use the terminal/code-editor visual style: `rounded-xl border border-border bg-bg-surface` container, traffic-light title bar, `//` comment-style section labels, and monospace font for inputs and labels.
- **FR-022**: All colors MUST use theme CSS variables (`--accent-success`, `--accent-danger`, `--accent-primary`, `--bg-surface`, `--border`, `--text-muted-foreground`, etc.). Hardcoded color values (hex codes, named Tailwind colors) MUST NOT be used.
- **FR-023**: Stat cards MUST use semantic accent colors: Available (success/green ring), Registered (warning/amber ring), Reserved (info/blue ring), Error (danger/red ring).
- **FR-024**: TLD chips in the picker MUST use the project's existing pill/badge component styling, with filled style for selected TLDs and outline style for deselected TLDs.

**Quality Gates**

- **FR-025**: All source files related to the TLD Reservation Checker MUST pass automated formatting, linting, and type checking with zero errors.

### Key Entities

- **Base Word**: A user-entered string representing a potential brand/domain name (e.g., "acmecorp"). Sanitized to valid domain characters. Deduplicated across the batch.
- **TLD Selection**: The set of TLD extensions a user wants to check against. Includes curated defaults (.com, .net, .org, .io, .ai, .co, .app, .dev) plus any user-defined custom TLDs. Persisted to session storage.
- **TLD Check Result**: The outcome of a single availability query for a domain (word.tld). Contains: the domain string, status (Available / Registered / Reserved / Error), and optional metadata (expiry date, registrar name, error reason).
- **Batch Check**: A collection of TLD Check Results for all (base word × selected TLD) combinations. Tracks progress (checked/total) and supports cancellation.
- **Status Filter**: A UI state that restricts the visible results table to a single status type (e.g., "show only Available"). Applied locally, does not affect the underlying data.
- **Export Data**: A CSV string representation of (filtered) results with columns: `word, tld, domain, status`. Built client-side and never persisted to a server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enter 5 base words, select 10 TLDs (50 combinations), and see all results within 30 seconds under normal network conditions.
- **SC-002**: Filtering the results table by status (e.g., "Available only") updates the visible rows in under 200ms for batches up to 200 results.
- **SC-003**: Copying CSV results to clipboard completes in under 100ms for batches up to 200 combinations.
- **SC-004**: CSV output pasted into Excel or Google Sheets is correctly parsed into columns (word, tld, domain, status) without manual formatting.
- **SC-005**: A first-time user can complete a basic availability check (enter 1 word, default TLDs, click Check) without reading documentation in under 60 seconds.
- **SC-006**: The TLD Checker link is discoverable from the sidebar without scrolling.
- **SC-007**: All automated quality checks (format, lint, typecheck) pass with zero errors.
- **SC-008**: Cancelling an in-progress batch terminates all pending requests within 2 seconds and returns the UI to its idle state.
- **SC-009**: The tool page is fully usable on a 375px mobile viewport — text input, TLD picker, results table, and export controls are all accessible without horizontal overflow on non-table elements.

## Assumptions

- The existing DNS Checker tool (Phases 7, 8, 9, 10, 13) serves as the UX pattern and code architecture reference. The TLD Reservation Checker reuses the same component structure (input, selector, results table, stats, export, help).
- Domain availability lookups use a publicly accessible HTTP-based protocol (e.g., WHOIS proxy, RDAP, or a domain availability API). Browser-based direct WHOIS (TCP port 43) is not possible, so a service or API layer is assumed.
- The availability check data source provides at minimum: whether a domain is registered and optionally the expiry date and registrar name. Reserved/premium status detection depends on the data source's capabilities.
- The application's existing shadcn/ui design system is reused for all UI components (buttons, pills, chips, checkboxes, tables). No new UI component libraries are introduced.
- The "Register" action link for Available domains points to a configurable/fixed registrar URL with domain pre-fill support. A single default registrar is acceptable for the initial release.
- Persisted TLD selection uses browser session storage — it resets when the browser session ends. No server-side persistence is required.
- The application does not have an i18n/locale system, so English-only strings are acceptable. i18n is explicitly deferred.
- IDN (internationalized domain names) support is out of scope for the initial release. Only ASCII domain names are supported.
- "Reserved" status detection is a best-effort feature dependent on the data source's capabilities. If the data source cannot distinguish Reserved from Registered, both may appear as Registered.
- The existing sidebar/nav component is extensible — adding the TLD Checker link requires a minor edit to an existing file, as was done for the DNS Checker.
