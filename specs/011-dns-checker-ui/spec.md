# Feature Specification: DNS Checker UI

**Feature Branch**: `011-dns-checker-ui`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "DNS Checker Tool — Build Plan -> Phase 8 — UI: Input, Controls, Results Table"

## Clarifications

### Session 2026-07-28

- Q: How should the UI respond when the user triggers resolution while a batch is already in progress? → A: Block the trigger — disable the resolve button and keyboard shortcut until the current batch completes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paste and Resolve a Single Domain (Priority: P1)

A user wants to check the DNS status of a single domain. They navigate to the DNS Checker page, type or paste a domain into the input area, optionally select which resolver to use (Cloudflare or Google), and trigger resolution. The results appear showing the domain's status, resolved IP addresses, and latency.

**Why this priority**: This is the simplest end-to-end flow — the core proof that the tool works. Without this, no other UI feature has value.

**Independent Test**: Navigate to the DNS Checker page, type `"google.com"` into the input, click the resolve button, and verify the results table shows at least one IPv4 address with status "DNS OK".

**Acceptance Scenarios**:

1. **Given** the DNS Checker page is open, **When** a user enters `"google.com"` and triggers resolution, **Then** the results table displays a row with status "DNS OK", one or more IPv4 addresses displayed as clickable chips, the resolver used, and latency in milliseconds.
2. **Given** the DNS Checker page is open, **When** a user enters a non-existent domain (e.g. `"this-domain-does-not-exist-12345.com"`), **Then** the results table shows status "No DNS" with an appropriate empty-IP indicator.
3. **Given** a resolver is selected (Cloudflare or Google), **When** the user triggers resolution, **Then** results reflect the selected resolver.
4. **Given** the input area is empty, **When** the user attempts to trigger resolution, **Then** the resolve action is disabled or shows a validation message indicating input is required.

---

### User Story 2 - Paste and Resolve Multiple Domains in Bulk (Priority: P2)

A user wants to check many domains at once. They paste a list of domains (from a spreadsheet, CSV, or plain text) into the input area. The system parses the input, shows a live count of how many valid domains were detected, and resolves them all. Results appear incrementally as each domain resolves, rather than waiting for the entire batch.

**Why this priority**: Bulk resolution is the primary use case for domain investors and portfolio managers. It builds directly on the single-domain flow.

**Independent Test**: Paste a list of 10 domains (mix of resolvable and non-resolvable) into the input area, verify the live count shows the correct number of parsed domains, trigger resolution, and confirm the table populates row-by-row as results arrive (not all at once at the end).

**Acceptance Scenarios**:

1. **Given** raw text containing 10 domain names separated by newlines and commas, **When** pasted into the input area, **Then** a live counter displays `"10 domains detected"` and any validation warnings are shown.
2. **Given** a batch resolution is triggered for 20 domains, **When** results start arriving, **Then** rows appear incrementally in the table (the first result is visible before the last domain resolves) and the summary bar filter counts update live as results stream in.
3. **Given** a batch of mixed valid and invalid input, **When** pasted, **Then** invalid entries are discarded silently and the live count only reflects valid, parsed domains.
4. **Given** the parsing exceeds the maximum domain limit (200), **When** pasted, **Then** an error message is displayed and resolution is blocked.

---

### User Story 3 - Filter and Navigate Results (Priority: P3)

A user has resolved a batch of domains and wants to quickly find which domains have DNS records and which don't. They use the summary filter bar (All / DNS OK / No DNS) to toggle which rows are visible. Each filter tab shows a live count of how many results match. Domain names in the table are clickable links that open the domain in a new tab. IP addresses are click-to-copy.

**Why this priority**: Filtering and navigation add productivity to the core resolution flow but are not essential for the tool to provide value — raw results alone are useful.

**Independent Test**: After resolving a mixed batch of domains, click the "DNS OK" filter tab and verify only rows with `status: "ok"` are visible. Click a domain link and verify it opens in a new browser tab. Click an IP chip and verify the IP is copied to the clipboard.

**Acceptance Scenarios**:

1. **Given** resolution results are displayed, **When** a user clicks the "DNS OK" filter tab, **Then** only rows with resolved IPs are visible and the "No DNS" rows are hidden. The tab shows the count (e.g. "DNS OK (12)").
2. **Given** resolution results are displayed, **When** a user clicks a domain name in the table, **Then** the domain opens as a new browser tab (`https://{domain}`).
3. **Given** a result row has one or more IPs displayed as chips, **When** a user clicks an IP chip, **Then** the IP address is copied to the system clipboard and a visual confirmation (e.g. brief highlight or tooltip) is shown.
4. **Given** no results match the selected filter (e.g. no "DNS OK" results exist), **When** the filter is active, **Then** the table shows an appropriate empty state message.
5. **Given** the "All" filter is selected, **When** results are present, **Then** all rows are visible regardless of status.

---

### Edge Cases

- What happens when the user triggers resolution while a previous batch is still resolving? → The resolve action is blocked: the trigger button is disabled and the keyboard shortcut is ignored until the current batch completes.
- What happens when the page is navigated away from during an active resolution (memory leak / in-flight requests)?
- How does the UI handle very long domain names that exceed the table column width?
- How does the UI handle domains with many IP addresses (e.g. 10+ A records)?
- What happens when the clipboard API (`navigator.clipboard`) is unavailable (e.g. HTTP context, older browser)?
- What happens when a domain in the input area contains only whitespace/empty entries?
- How does the UI respond when the user changes the resolver selection mid-resolution?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a text input area that accepts raw domain text in any format (URLs, newlines, commas, spaces).
- **FR-002**: The system MUST display a live count of valid, parsed domains from the input area, updating as the user types.
- **FR-003**: The system MUST show validation warnings when input cannot be parsed or exceeds the domain limit (200 domains).
- **FR-004**: The system MUST provide a resolver selector allowing the user to choose between Cloudflare and Google DNS-over-HTTPS providers.
- **FR-005**: The system MUST provide a trigger action (button or keyboard shortcut `Ctrl+Enter` / `Cmd+Enter`) to start DNS resolution.
- **FR-006**: The system MUST disable the resolve trigger (both button and keyboard shortcut) while a resolution batch is in progress, preventing concurrent resolution attempts.
- **FR-007**: The system MUST display resolution results in a table where each row shows: status indicator (icon/badge), domain name, resolved IP addresses, resolver used, and latency.
- **FR-008**: Domain names in the results table MUST be rendered as clickable links that open the domain (`https://{domain}`) in a new browser tab.
- **FR-009**: IP addresses MUST be displayed as clickable chips that copy the IP to the system clipboard on click, with a visual confirmation.
- **FR-010**: The system MUST provide a summary filter bar with three tabs: "All", "DNS OK", and "No DNS" — each displaying a live count of matching results.
- **FR-011**: Selecting a filter tab MUST show only rows matching that status and hide others, without re-resolving or re-fetching data.
- **FR-012**: Results MUST appear incrementally in the table as each domain resolves, rather than waiting for the entire batch to complete.
- **FR-013**: The system MUST show a loading/progress indicator while resolution is in progress.
- **FR-014**: The system MUST show appropriate empty states when no domains are entered and when no results match the active filter.
- **FR-015**: The system MUST handle errors from the DNS resolution engine gracefully, displaying error details in the results table (e.g. timeout, network error).
- **FR-016**: The user interface MUST be fully functional on mobile viewports — the input area, controls, and results table must be usable on screens as narrow as 375px.
- **FR-017**: The system MUST cancel in-flight DNS requests if the user navigates away from the page mid-resolution.

### Key Entities

- **Input State**: Raw text entered by the user, plus the parsed/validated domain count. Transient — not persisted.
- **Resolver Selection**: The currently selected DNS provider (Cloudflare or Google). Defaults to Cloudflare on page load.
- **Result Entry**: A single domain's resolution outcome, matching the engine's `DnsResult` structure (domain, status, IPs, resolver, error, latency). Displayed as a table row.
- **Filter State**: The currently active result filter ("All", "DNS OK", or "No DNS"). Defaults to "All". Purely client-side — toggles row visibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can paste a list of 50 domains, trigger resolution, and see the first result appear in under 3 seconds under normal network conditions.
- **SC-002**: The results table updates incrementally — at least one new row appears every 2 seconds during a batch resolution of 50 domains.
- **SC-003**: Filter tab toggling (All ↔ DNS OK ↔ No DNS) produces instant visual feedback (under 50ms perceived delay).
- **SC-004**: Copying an IP address to clipboard via chip click succeeds on first attempt for 100% of users with clipboard API support.
- **SC-005**: The page loads and renders the input area within 2 seconds on a standard 3G connection.
- **SC-006**: The tool is fully functional and legible on a 375px-wide mobile viewport without horizontal scrolling on the input area or controls.
- **SC-007**: 100% of in-flight DNS requests are cancelled when the user navigates away from the page — no console errors from aborted requests.

## Assumptions

- The DNS resolution engine (`lib/dns/`) from Phase 7 is complete and available. This phase builds on it as a dependency.
- The tool is a client-side-only page (`"use client"`) — no server rendering, no database interactions.
- The page route follows the application's existing routing convention for tools/dashboards (e.g. under `app/(dashboard)/dns-checker/` or similar).
- No user authentication is required to use the DNS Checker — it works for both signed-in and anonymous users.
- The application's existing design system (colors, typography, components from shadcn/ui) is reused for this tool's UI to maintain visual consistency.
- The keyboard shortcut `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac) is the sole keyboard shortcut for triggering resolution.
- The 200-domain input cap from Phase 7's parser is enforced in the UI — the parser engine handles the cap, the UI displays the error.
- Internationalization (i18n) is out of scope for this phase — English-only labels and messages.
- The tool does not persist or transmit any lookup data to the application's backend — all resolution happens client-side via DoH.
