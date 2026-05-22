# Feature Specification: Phase 3 — Dashboard & Analytics

**Feature Branch**: `003-dashboard-analytics`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "read plan.md and create specification for the PHASE PHASE 3 · Dashboard & Analytics"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Portfolio Overview Dashboard (Priority: P1)

A domain investor logs into DomainVault and lands on the dashboard. They immediately see a high-level snapshot of their portfolio: total domains, active count, expiring-soon count (≤30 days), and the estimated portfolio value (sum of purchase prices). Below the snapshot, a chart shows the domain count broken down by TLD, giving them an at-a-glance understanding of their portfolio composition. The dashboard loads quickly and all numbers are up-to-date, reflecting the latest imports and edits.

**Why this priority**: The dashboard is the landing page after login — it is the first thing users see every session. Without it, the dashboard route is a blank page, making the product feel incomplete. It is the entry point that summarizes portfolio health.

**Independent Test**: Can be fully tested by importing 50+ domains with varied TLDs and statuses, navigating to the dashboard, and verifying that total counts, active/expiring counts, portfolio value, and TLD distribution chart all match the data in the domains table. Delivers a meaningful landing page.

**Acceptance Scenarios**:

1. **Given** a user with 50 domains (30 active, 10 expired, 5 sold, 5 pending), **When** they view the dashboard, **Then** summary cards show "50 Total Domains", "30 Active", with accurate counts, and all numbers match the domain list.
2. **Given** a user with 10 domains, 3 of which expire within 30 days, **When** they view the dashboard, **Then** an "Expiring Soon" card shows "3" and lists the expiring domain names.
3. **Given** a user with domains purchased for a total of $5,000, **When** they view the dashboard, **Then** a "Portfolio Value" card displays "$5,000".
4. **Given** a user whose domains span 5 different TLDs (.com, .net, .io, .org, .dev), **When** they view the dashboard, **Then** a chart displays the count of domains per TLD.
5. **Given** a user with no domains, **When** they view the dashboard, **Then** summary cards show zeros and a CTA directs them to import their first domain.

---

### User Story 2 — Expiration Timeline & Alerts (Priority: P1)

A domain investor wants to know which domains are at risk of expiring so they can renew them before they lapse. The dashboard shows an expiration timeline chart — a bar or line chart grouping domains by their expiration month for the next 12 months. Below the chart, a table lists all domains expiring within 90 days, sorted by expiration date (soonest first), with their domain name, expiration date, and days remaining. Domains already expired are shown in a separate section with a danger highlight.

**Why this priority**: Expiration management is the core operational concern for domain investors — missing a renewal means losing the domain. This story provides the actionable intelligence to prevent that.

**Independent Test**: Can be fully tested by importing domains with expiration dates spread across the next 12 months (some expired, some near-expiry), verifying the timeline chart groups correctly by month, and confirming the expiring-soon table lists domains sorted by date with accurate days-remaining counts. Delivers renewal intelligence.

**Acceptance Scenarios**:

1. **Given** a user with domains expiring in January, March, June, and December, **When** they view the expiration timeline, **Then** a chart shows domain counts grouped by month for each of those months.
2. **Given** a user with 5 domains expiring within 90 days (some within 30 days), **When** they view the expiring domains table, **Then** all 5 are listed sorted by expiration date ascending, showing domain name, expiration date, and days remaining.
3. **Given** a user with 3 expired domains, **When** they view the dashboard, **Then** the expired domains are listed in a separate section with a danger-color indicator and the number of days past expiration.
4. **Given** a user with no domains expiring within 90 days, **When** they view the dashboard, **Then** the expiring-soon section shows an empty state: "No domains expiring soon — your portfolio is in good shape."

---

### User Story 3 — Portfolio Value & TLD Distribution Charts (Priority: P2)

A domain investor wants to understand the financial composition of their portfolio. The dashboard shows a value distribution chart — a pie or donut chart breaking down total portfolio value by status (active value, sold value) or by TLD. This helps them see which TLDs represent the largest investment and how much value is tied up in sold vs active domains.

**Why this priority**: Financial intelligence is valuable but secondary to basic counts and expiration alerts. Users can manage their portfolio without value charts, but investors tracking ROI benefit from this data.

**Independent Test**: Can be fully tested by importing domains with varied purchase prices across TLDs, verifying that the value chart segments match the sum of purchase prices grouped by TLD. Delivers financial insight.

**Acceptance Scenarios**:

1. **Given** a user with domains across .com ($2,000), .io ($1,500), and .org ($500), **When** they view the value distribution chart, **Then** each TLD segment shows the correct total value and percentage of the portfolio.
2. **Given** a user with domains where some have no purchase price, **When** they view the value chart, **Then** domains with null purchase prices are excluded from value calculations and the chart only reflects priced domains.
3. **Given** a user whose domains are all priced at $0 or null, **When** they view the value distribution, **Then** the chart area shows "No pricing data available" rather than an empty or broken chart.

---

### User Story 4 — Domain Status Auto-Transition (Priority: P2)

When a domain's expiration date passes, its status should automatically transition from "active" to "expired" without requiring the user to manually update it. This transition happens when the user views the dashboard or domain list — the system detects past-due active domains and updates their status. The user sees a badge or indicator that the domain is now expired without taking any action.

**Why this priority**: Auto-transition was explicitly deferred from Phase 2. It closes the loop on domain lifecycle management, ensuring the dashboard counts and statuses stay accurate without manual work. It is lower priority than the visualization features because users can manually update statuses in Phase 2.

**Independent Test**: Can be fully tested by setting a domain's expiration date to yesterday and status to "active", refreshing the dashboard, and verifying the status changes to "expired". Delivers automatic lifecycle management.

**Acceptance Scenarios**:

1. **Given** a user with an active domain whose expiration date is in the past, **When** they view the dashboard, **Then** the domain's status is updated to "expired" and it no longer appears in the "Active" count.
2. **Given** a user with an expired domain whose expiration date is still in the past, **When** they view the dashboard, **Then** the domain remains "expired" and is not re-processed.
3. **Given** a user with an active domain whose expiration date is in the future, **When** they view the dashboard, **Then** the domain status remains "active" and is not changed.

---

### Edge Cases

- What happens when a user has thousands of domains and the TLD distribution chart has dozens of TLDs — how are small TLDs grouped (e.g., "Other" category)?
- What happens when the dashboard data fails to load partially (e.g., counts succeed but chart data fails)?
- How does the expiration timeline handle domains expiring more than 12 months in the future?
- What happens when a user has exactly 0 active domains but has domains in other statuses?
- How does the portfolio value handle extremely large numbers (e.g., $10M+ portfolio)?
- What happens when auto-transition runs on a domain that was manually set to "sold" but also has a past expiration date?
- How does the dashboard behave when viewed on mobile — do charts resize or switch to simplified views?
- What happens when the user changes the domain list (e.g., deletes a domain) while viewing the dashboard — do the charts update?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dashboard page at `/dashboard` as the default landing page for authenticated users.
- **FR-002**: System MUST display summary cards showing: Total Domains, Active Domains, Expiring Soon (≤30 days), and Portfolio Value (sum of purchase prices for domains with prices).
- **FR-003**: System MUST display an expiring-soon table listing all domains expiring within 90 days, sorted by expiration date ascending, with columns: domain name, expiration date, days remaining, and status badge.
- **FR-004**: System MUST display a separate expired domains section listing domains with past expiration dates, with a visual danger indicator.
- **FR-005**: System MUST display a TLD distribution chart (bar chart) showing the count of domains grouped by TLD.
- **FR-006**: System MUST display an expiration timeline chart (bar chart) showing domain counts grouped by expiration month for the next 12 months.
- **FR-007**: System MUST display a portfolio value distribution chart (bar chart) showing total purchase price grouped by TLD, excluding domains with null or zero purchase prices.
- **FR-008**: System MUST automatically transition domains with status "active" and an expiration date in the past to status "expired" when the dashboard loads.
- **FR-009**: System MUST NOT modify the status of domains that are already "expired", "sold", or "pending" during auto-transition — only "active" domains with past expiration dates are affected.
- **FR-010**: System MUST display zero-state messages for all dashboard sections when no data is available (e.g., "No domains yet — import your first CSV").
- **FR-011**: System MUST display empty-state messages for sections where the user has domains but none match the criteria (e.g., "No domains expiring soon" when all expirations are >90 days out).
- **FR-012**: System MUST ensure all dashboard data (counts, charts, tables) is scoped to the authenticated user via RLS.
- **FR-013**: System MUST display skeleton loaders for all dashboard sections while data is fetching.
- **FR-014**: System MUST be responsive, adapting chart and table layouts per the constitution: 2-column grid ≥1024px, single column 768–1023px, stacked cards <768px.
- **FR-015**: System MUST group TLDs with fewer than 3 domains into an "Other" category in the TLD distribution chart.

### Key Entities

- **Dashboard Summary**: A computed view derived from the user's domains. Includes: total domain count, active count, expiring-soon count (≤30 days), portfolio value sum. Not stored — computed on demand.
- **Expiration Timeline**: A computed view aggregating domain counts by expiration month for the next 12 months. Derived from the domains table.
- **TLD Distribution**: A computed view aggregating domain counts and purchase price totals by TLD. Derived from the domains table.
- **Domain** (from Phase 1/2): Status field is now auto-managed for the active→expired transition. No schema changes needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dashboard page loads and displays all sections (summary cards, charts, expiration table) in under 2 seconds.
- **SC-002**: Summary card counts are 100% accurate — they match a direct query of the user's domains table at the time of load.
- **SC-003**: The expiration timeline chart correctly groups all domains with future expiration dates into their respective months with zero omissions.
- **SC-004**: Auto-transition correctly updates the status of 100% of active domains with past expiration dates on dashboard load, with zero false positives (no future-dated domains incorrectly marked expired).
- **SC-005**: All dashboard charts render correctly at viewport widths of 375px, 768px, 1024px, and 1920px without overflow or truncation.
- **SC-006**: The expiring-soon table correctly identifies 100% of domains expiring within 90 days, sorted by expiration date ascending.
- **SC-007**: Portfolio value calculation excludes domains with null or zero purchase prices and produces a sum matching manual calculation.

## Assumptions

- The domains table already contains all portfolio data from Phase 1/2 — no new database tables are required for Phase 3.
- Charts use the Recharts library as mandated by the constitution.
- The TLD distribution chart uses a vertical bar chart grouped by TLD, with an "Other" category collapsing TLDs with fewer than 3 domains.
- The expiration timeline uses a bar chart grouped by calendar month (Jan–Dec) showing the count of domains expiring in each month.
- Auto-transition from active→expired runs as a database query (UPDATE) triggered when the dashboard page loads — not a background job or cron.
- Dashboard data fetching uses server components for initial render (SSR) with TanStack Query for client-side interactivity where needed, consistent with the Phase 2 architecture.
- The portfolio value chart only includes domains with purchase_price > 0 — domains with null or zero prices are excluded from value calculations but still counted.
- Mobile dashboard (≤768px) uses stacked cards with simplified chart variants as per the constitution design system rules.
- The dashboard summary section is above-the-fold — users see the key metrics without scrolling.
- No notification/alert system for expiring domains — Phase 3 is visualization only. Email alerts remain out of scope per the constitution non-goals.
- Domain status auto-transition is idempotent — running it multiple times produces the same result.
