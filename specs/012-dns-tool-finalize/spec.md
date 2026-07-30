# Feature Specification: DNS Tool Finalize

**Feature Branch**: `012-dns-tool-finalize`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "DNS Checker Tool — Build Plan -> Phase 9 & 10 & 13"

## Clarifications

### Session 2026-07-28

- Q: How does the user activate Compare Providers mode? → A: A "Compare Providers" toggle/checkbox next to the ResolverSelector. When enabled, both resolvers are used and the table switches to side-by-side view.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Results and Compare Providers (Priority: P1)

A user has resolved a batch of domains and needs to export the results for record-keeping or analysis. They also want to compare results between Cloudflare and Google resolvers to detect DNS propagation differences or inconsistencies.

**Why this priority**: Export and cross-verification are the primary enhancements that make the tool useful beyond ad-hoc lookups. CSV export enables integration with spreadsheets and other tools. Provider comparison catches DNS issues that single-resolver lookups miss.

**Independent Test**: Resolve a batch of 5 domains, click "Copy CSV" and paste into a spreadsheet — verify columns are domain, status, and IP. Switch to "Compare Providers" mode, resolve the same batch against both Cloudflare and Google, and verify side-by-side results with mismatches highlighted.

**Acceptance Scenarios**:

1. **Given** resolution results are displayed, **When** a user clicks "Copy CSV", **Then** a CSV string with columns `domain,status,ip` (one row per domain, multiple IPs comma-separated within the cell) is copied to the clipboard. If the clipboard is unavailable, a `.csv` file is downloaded.
2. **Given** the CSV is pasted into Excel, Google Sheets, or a text editor, **When** opened, **Then** the data is correctly parsed into columns and rows.
3. **Given** the DNS Checker page is open, **When** a user enables the "Compare Providers" toggle next to the resolver selector, **Then** the ResolverSelector is disabled and the input batch is resolved against both Cloudflare and Google simultaneously. Results are displayed in a side-by-side table with columns: Domain, Cloudflare Status, Cloudflare IPs, Google Status, Google IPs.
4. **Given** "Compare Providers" mode results are displayed, **When** a domain has different IPs between Cloudflare and Google, **Then** the mismatched IPs are visually highlighted (e.g., amber badge or warning icon) to draw attention.
5. **Given** "Compare Providers" mode is active, **When** a user exports CSV, **Then** the CSV includes columns for both providers: `domain,cloudflare_status,cloudflare_ips,google_status,google_ips`.
6. **Given** individual domains fail during a batch resolution, **When** the batch completes, **Then** failed domains show their error status inline while successful domains display normally — no crash or blockage.

---

### User Story 2 - Integrate the Tool into the Application (Priority: P2)

A user should be able to discover and access the DNS Checker from the application's normal navigation, without needing to know the URL. The tool should match the app's visual language and feel like a natural part of the platform.

**Why this priority**: If users can't find the tool, it doesn't matter how good it is. Navigation integration is essential for adoption but doesn't change the tool's core functionality.

**Independent Test**: From any page in the application, locate the DNS Checker link in the main navigation or tools index. Click it and verify the DNS Checker page loads with full functionality.

**Acceptance Scenarios**:

1. **Given** a user is signed in or browsing anonymously, **When** they view the main navigation (sidebar or header), **Then** a link to the DNS Checker tool is visible.
2. **Given** the user clicks the DNS Checker navigation link, **When** the page loads, **Then** the tool is rendered within the app's standard layout (sidebar, header, theme) and matches the app's visual design.
3. **Given** the tool is functional, **When** a user runs a DNS lookup, **Then** an analytics event (e.g. "dns_lookup_run") is triggered client-side — no domain names or resolved IPs are sent to the analytics service, only aggregate usage metrics.

---

### User Story 3 - Polish, Documentation, and Ship Readiness (Priority: P3)

The tool needs final quality assurance, in-app documentation, and release readiness. Users should be able to understand how the tool works from within the app itself, and the codebase must pass all quality gates.

**Why this priority**: Polish and documentation make the difference between a functional tool and a production-ready feature. These are required for a release but don't add new user-facing capabilities.

**Independent Test**: Open the DNS Checker page, verify there is accessible help text explaining how to use the tool. Verify the page passes all automated quality checks (formatting, linting, type checking). Verify the page works correctly on both desktop and mobile viewports.

**Acceptance Scenarios**:

1. **Given** the DNS Checker page is open, **When** a user views the page, **Then** brief in-app help copy is visible explaining: how to paste domains, supported formats, resolver options, and a short FAQ (privacy, why results differ between resolvers, concurrency limits).
2. **Given** the app is deployed, **When** the project's changelog is viewed, **Then** the DNS Checker Tool is listed with its key capabilities.
3. **Given** the codebase is checked, **When** formatting (`format:check`), linting (`lint`), and type checking (`typecheck`) are run, **Then** all pass with zero errors on files related to the DNS Checker Tool.
4. **Given** a mobile viewport (375px–480px), **When** the DNS Checker page is loaded, **Then** the textarea is usable (touch-friendly), the table scrolls horizontally, export/comparison controls remain accessible, and no content overflows or is clipped.

---

### Edge Cases

- What happens when the clipboard API (`navigator.clipboard`) is unavailable (e.g. HTTP context) and CSV export is attempted?
- How does the UI handle "Compare Providers" mode when one provider fails (timeout) but the other succeeds for the same domain?
- What happens when the user toggles "Compare Providers" mode on or off mid-resolution? → The toggle is disabled during active resolution (same blocking behavior as the resolver selector and the resolve button per Phase 8 clarification).
- How does the CSV export handle domains with no A records (empty IPs)?
- What happens if the analytics service is blocked or unavailable — does the tool still function?

## Requirements *(mandatory)*

### Functional Requirements

**Export & Cross-Verification (Phase 9)**

- **FR-001**: The system MUST provide a "Copy CSV" action that builds a CSV string from the current results and writes it to the system clipboard.
- **FR-002**: When the clipboard API is unavailable, the system MUST fall back to triggering a file download of the CSV via a browser download prompt.
- **FR-003**: The CSV export MUST include, at minimum, columns for domain, status, and IP addresses (comma-separated within the IP cell for multiple records).
- **FR-004**: The system MUST provide a "Compare Providers" toggle control adjacent to the resolver selector. When enabled, the resolver selector is disabled and resolution uses both Cloudflare and Google simultaneously, displaying results side-by-side.
- **FR-005**: In "Compare Providers" mode, the system MUST visually highlight rows where Cloudflare and Google return different IP addresses for the same domain.
- **FR-006**: CSV export in "Compare Providers" mode MUST include columns for both providers' statuses and IPs.
- **FR-007**: The system MUST display a progress indicator showing resolved count and total count during batch resolution (e.g. "12/50 resolved").
- **FR-008**: The system MUST gracefully handle partial batch failures — individual domain failures must not block resolution of remaining domains, and failed domains must show inline error details.

**App Integration (Phase 10)**

- **FR-009**: The DNS Checker tool MUST be accessible from the application's primary navigation (sidebar or equivalent).
- **FR-010**: The tool MUST render within the application's standard layout, including the sidebar, header, and theme support (dark/light).
- **FR-011**: The tool MUST trigger a client-side analytics event when a DNS lookup is initiated, containing aggregate usage data only (no domain names or resolved IPs).
- **FR-012**: The analytics event tracking MUST be non-blocking — tool functionality MUST NOT be degraded if the analytics service is unavailable.

**Polish & Ship (Phase 13)**

- **FR-013**: The tool page MUST display in-app help copy explaining usage steps, supported input formats, resolver options, and a brief FAQ section.
- **FR-014**: All source files related to the DNS Checker Tool MUST pass automated formatting checks with zero errors.
- **FR-015**: All source files related to the DNS Checker Tool MUST pass automated linting checks with zero errors.
- **FR-016**: All source files related to the DNS Checker Tool MUST pass automated type checking with zero errors.
- **FR-017**: The tool MUST be included in the project's changelog or release notes for the current version.

### Key Entities

- **Export Format**: A CSV string representation of resolution results. Columns vary by mode (single provider: domain, status, ip; comparison: domain, cloudflare_status, cloudflare_ips, google_status, google_ips). Built client-side, never persisted.
- **Comparison Result**: A pair of `DnsResult` objects (one per provider) for the same domain, with a derived "mismatch" flag when IPs differ.
- **Analytics Event**: A lightweight client-side event (`dns_lookup_run`) triggered on resolution start. Contains only: resolver selected, domain count, and timestamp. No domain names or IPs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Copying CSV results to clipboard succeeds within 100ms for batches up to 200 domains.
- **SC-002**: CSV output pasted into Excel or Google Sheets is correctly parsed into rows and columns without manual formatting.
- **SC-003**: "Compare Providers" mode resolves 50 domains against both providers and displays results within 40 seconds under normal network conditions.
- **SC-004**: Provider mismatches are visually identifiable within 2 seconds of scanning the results table.
- **SC-005**: The DNS Checker link is discoverable from the main navigation without scrolling or searching.
- **SC-006**: All automated quality checks (format, lint, typecheck) pass with zero errors on the first run after implementation.
- **SC-007**: The tool page is fully usable on 375px mobile viewport — textarea, table, export controls, and help copy are all accessible without horizontal overflow on non-table elements.

## Assumptions

- Phases 7 (DNS resolution engine) and 8 (DNS Checker UI) are complete and available as dependencies.
- The application's existing shadcn/ui design system is reused for the export buttons, help section, and comparison table — no new UI component libraries are introduced.
- The Clipboard API (`navigator.clipboard`) is available in all target browsers (HTTPS context on Vercel). The file download fallback for CSV is a safety net, not a primary UX path.
- The application does not currently have an i18n/locale system, so English-only strings are acceptable per the build plan. i18n is explicitly deferred.
- Analytics integration is lightweight — a single client-side event call. No analytics SDK is required beyond what the app may already use (e.g., a simple `window.gtag` or custom event dispatch).
- The application's existing sidebar/nav component is extensible — adding a new navigation item requires a minor edit to an existing file.
- The changelog is a markdown file (`CHANGELOG.md`) or similar in the repository root — adding an entry is a documentation task, not a code change.
- "Shared UI kit" reuse from Phase 10 is already satisfied by Phase 8's implementation (shadcn/ui components); this phase only needs to verify compliance, not rebuild components.
