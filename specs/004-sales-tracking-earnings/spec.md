# Feature Specification: Phase 4 — Sales Tracking & Earnings

**Feature Branch**: `004-sales-tracking-earnings`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "read plan.md and create specification for the PHASE 4 · Sales Tracking & Earnings"

## Clarifications

### Session 2026-05-22

- Q: When a user logs a sale for a domain that is expired, should the sale auto-associate and change the domain status to "sold"? → A: Warn but allow. The system warns "This domain is expired" but allows the sale to proceed after user confirmation, then changes the domain status to "sold."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Log a Domain Sale (Priority: P1)

A domain investor sells a domain. They open the sale or navigate to the domain detail page, click a "Log Sale" button, and fill in the sale details: the domain sold (auto-detected if coming from domain detail), sale price, sale date, buyer (optional), platform where the sale occurred (optional), and any notes. On submission, the sale is recorded, the domain's status is automatically updated to "sold", and the sale appears in the sales list. If the domain was already "sold", the system warns but still records the new sale.

**Why this priority**: Sales tracking is the core value of Phase 4 — without the ability to log sales, there is no sales data to track. This is the critical entry point.

**Independent Test**: Can be fully tested by navigating to a domain detail page, clicking "Log Sale", filling in sale details, submitting, and verifying the sale appears in the sales list and the domain status changes to "sold". Delivers a logged sale record.

**Acceptance Scenarios**:

1. **Given** a user viewing an active domain's detail page, **When** they click "Log Sale", fill in sale price ($500), sale date, and submit, **Then** the sale is recorded, the domain status updates to "sold", and the sale appears in the sales list.
2. **Given** a user logging a sale, **When** they submit without filling in the sale price, **Then** an inline validation error appears ("Sale price is required") and the sale is not recorded.
3. **Given** a user logging a sale for a domain already marked "sold", **When** they submit, **Then** the system warns "This domain is already marked as sold" but still records the new sale (domains can be sold multiple times).
4. **Given** a user logging a sale without selecting a domain (from the general "New Sale" entry point), **When** they type a domain name that doesn't exist in their portfolio, **Then** the system warns "Domain not found in your portfolio" but still allows the sale to be recorded with the provided domain name.
5. **Given** a user logging a sale, **When** they enter a future sale date, **Then** an inline validation error appears ("Sale date cannot be in the future") and the sale is not recorded.

---

### User Story 2 — Sales List & Earnings Summary (Priority: P1)

A user views all their logged sales in a paginated list. The list shows domain name, sale price, sale date, buyer, and platform. At the top of the page, an earnings summary card displays: total sales count, total revenue (sum of all sale prices), average sale price, and highest sale. The list can be sorted by sale date or sale price, and filtered by date range. The earnings summary updates dynamically as sales are added, edited, or deleted.

**Why this priority**: The sales list is the primary view for tracking performance. Without it, logged sales are inaccessible. It is co-equal with sale logging as the entry point for Phase 4.

**Independent Test**: Can be fully tested by logging 3–5 sales with varied prices and dates, navigating to the Sales page, verifying the earnings summary matches manual calculations, and applying sort/filter options. Delivers a browsable sales history with financial summary.

**Acceptance Scenarios**:

1. **Given** a user who has logged 10 sales totaling $8,000, **When** they view the Sales page, **Then** the earnings summary shows "10 Sales", "$8,000 Revenue", "$800 Average", and correctly identifies the highest sale.
2. **Given** a user on the Sales page, **When** they sort by sale price descending, **Then** sales are ordered from highest to lowest price.
3. **Given** a user on the Sales page, **When** they filter by a date range (e.g., "Last 6 months"), **Then** only sales within that date range are shown and the earnings summary updates accordingly.
4. **Given** a user with no logged sales, **When** they view the Sales page, **Then** an empty state message is displayed: "No sales logged yet — log your first sale to start tracking earnings."
5. **Given** a user viewing the Sales page, **When** they click on a sale's domain name, **Then** they are navigated to the domain detail page for that domain.

---

### User Story 3 — Edit & Delete Sales (Priority: P2)

A user can edit an existing sale to correct information (e.g., wrong sale price, wrong date) or delete a sale that was logged in error. Editing a sale updates the sale record; if the sale date or price changes, the earnings summary reflects the update. Deleting a sale permanently removes the record after confirmation. If the deleted sale was the only sale for a domain marked "sold", the domain status reverts to "active" (the domain was not actually sold).

**Why this priority**: Data correction is important but secondary to logging and viewing. Users can log new sales to override bad data in the interim, making edit/delete a convenience feature.

**Independent Test**: Can be fully tested by editing a sale's price and verifying the earnings summary updates, then deleting a sale and verifying it's removed from the list and the domain status reverts. Delivers correctable sales records.

**Acceptance Scenarios**:

1. **Given** a user viewing a sale in the sales list, **When** they edit the sale price from $500 to $750 and save, **Then** the sale price updates and the earnings summary reflects the new total.
2. **Given** a user viewing a sale, **When** they click delete and confirm the dialog, **Then** the sale is permanently removed from the list and the earnings summary updates.
3. **Given** a user deleting the only sale for a domain marked "sold", **When** the deletion completes, **Then** the domain status reverts to "active" (the domain is back in the portfolio).
4. **Given** a user viewing a sale, **When** they attempt to edit the sale date to a future date, **Then** an inline validation error appears and the change is rejected.

---

### User Story 4 — Sales Auto-Association with Domains (Priority: P2)

When a sale is logged with a domain name that matches an active domain in the user's portfolio, the sale is auto-associated with that domain record (via the `domain_id` foreign key). The domain's status automatically changes to "sold". If the domain name doesn't match any portfolio domains, the sale is still recorded (with `domain_id` set to null) as an external sale. Users can later edit the domain name in the sale to re-associate it if a matching domain is added later.

**Why this priority**: Auto-association closes the loop between sales and domains, ensuring the portfolio stays accurate. It is lower priority than logging and viewing because users can manually update domain statuses in Phase 2.

**Independent Test**: Can be fully tested by logging a sale for "example.com" (which exists as an active domain) and verifying the domain status changes to "sold", then logging a sale for "newdomain.io" (which doesn't exist) and verifying it's recorded as an external sale. Delivers integrated domain-sale relationships.

**Acceptance Scenarios**:

1. **Given** a user with an active domain "example.com", **When** they log a sale for "example.com", **Then** the sale is associated with the domain record (domain_id is set) and the domain status changes to "sold".
2. **Given** a user logging a sale for "external.io" which is not in their portfolio, **When** the sale is submitted, **Then** the sale is recorded with no domain association (domain_id is null) and no domain status change occurs.
3. **Given** a user with a sale for "example.com" (associated with domain), **When** they delete the domain "example.com" from their portfolio, **Then** the sale record persists with the domain name preserved but the domain_id is set to null.

---

### Edge Cases

- What happens when a user logs a sale with a sale price of $0?
- What happens when a user tries to log a sale for the same domain multiple times on the same date?
- How does the earnings summary handle mixed currencies (if multiple currencies were supported)?
- What happens when a user deletes a domain that has associated sales?
- How does the system handle a sale with a domain name that differs in casing from the portfolio domain (e.g., sale "Example.com" vs portfolio "example.com")?
- What happens when a user logs a sale for a domain that is expired — should the status still change to "sold"? → The system warns "This domain is expired" and requires user confirmation, then proceeds to auto-associate and change the status to "sold."
- What happens when a sale is edited to change the domain name — should the system re-attempt auto-association?
- How does the sales list perform with thousands of sales spanning multiple years?
- What happens when a user deletes a sale that was the most recent — does the domain status revert?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to log a domain sale with the following fields: domain name (required, case-insensitive match to portfolio), sale price (required, positive number), sale date (required, not in the future), buyer (optional), platform (optional), and notes (optional).
- **FR-002**: System MUST provide a "Log Sale" action accessible from the domain detail page (auto-filling the domain name) and from the Sales page (empty form for any domain).
- **FR-003**: System MUST validate that the sale price is a positive number greater than zero and display an inline error if validation fails.
- **FR-004**: System MUST validate that the sale date is not in the future and display an inline error if validation fails.
- **FR-005**: System MUST auto-associate the sale with a domain in the user's portfolio when the domain name matches case-insensitively (assign domain_id).
- **FR-006**: System MUST allow sales to be recorded for domains not in the user's portfolio (domain_id = null, marked as external sale).
- **FR-007**: System MUST automatically update the associated domain's status to "sold" when a sale is logged and auto-associated, for domains in any status (active, expired, or pending). For domains that are expired, the system MUST warn the user before proceeding.
- **FR-008**: System MUST display a warning when logging a sale for a domain already marked "sold" but allow the sale to proceed (domains can be sold multiple times).
- **FR-009**: System MUST display a paginated list of all logged sales on the Sales page, sorted by sale date descending by default.
- **FR-010**: System MUST display an earnings summary on the Sales page showing: total sales count, total revenue (sum of sale prices), average sale price, and highest sale.
- **FR-011**: System MUST support sorting the sales list by sale date and sale price (ascending/descending).
- **FR-012**: System MUST support filtering the sales list by date range (custom start and end dates).
- **FR-013**: System MUST allow users to edit an existing sale's mutable fields: domain name, sale price, sale date, buyer, platform, and notes.
- **FR-014**: System MUST re-attempt domain auto-association when a sale's domain name is edited.
- **FR-015**: System MUST allow users to delete a sale with a confirmation dialog.
- **FR-016**: System MUST revert the associated domain's status from "sold" to "active" when the sale is deleted AND no other sales exist for that domain.
- **FR-017**: System MUST preserve sale records when the associated domain is deleted (ON DELETE SET NULL — sale retains the domain name).
- **FR-018**: System MUST display an empty state on the Sales page when the user has no logged sales, directing them to log their first sale.
- **FR-019**: System MUST enforce per-user data isolation — users can only see, edit, and delete their own sales.
- **FR-020**: System MUST display the domain name as a clickable link in the sales list, navigating to the domain detail page when the sale is associated with a domain.

### Key Entities

- **Sale**: Represents a logged domain sale. Attributes: domain name (required, stored as-provided), sale price (positive decimal), sale date, buyer (optional), platform (optional), notes (optional). Auto-associated with a Domain via domain_id when the domain name matches case-insensitively. Belongs to exactly one user. Can be edited and deleted.
- **Domain** (from Phase 1): Status transitions to "sold" when an associated sale is logged; reverts to "active" when the last associated sale is deleted. Linked to sales via a nullable FK (ON DELETE SET NULL).
- **Earnings Summary**: A computed view derived from the user's sales. Includes: total count, total revenue sum, average sale price, highest sale. Not stored — computed on demand from the sales table.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a sale in under 30 seconds from opening the form to seeing the sale in the list.
- **SC-002**: The sales list page loads and displays up to 50 sales with earnings summary in under 2 seconds.
- **SC-003**: 100% of domain names matching portfolio domains are correctly auto-associated with their domain record (case-insensitive match).
- **SC-004**: 100% of domain status changes (active→sold on sale log, sold→active on last sale delete) execute correctly.
- **SC-005**: The earnings summary (total revenue, count, average, highest) is 100% accurate — matches manual calculation.
- **SC-006**: Sale edits and deletes are reflected in the sales list and earnings summary in under 2 seconds after saving.
- **SC-007**: 100% of sale operations (log, edit, delete) are scoped to the authenticated user — no cross-user data access.

## Assumptions

- The sales table (`public.sales`) already exists from the Phase 1 database migration with all required columns and RLS policies.
- All sales are in a single currency (assumed USD); no multi-currency support in Phase 4.
- Domain name auto-association uses the same case-insensitive matching rules as domain search and CSV import from Phase 2.
- The "Log Sale" form on the domain detail page pre-fills the domain name from the current domain and makes it read-only, while the Sales page form allows free text entry.
- Sale price of $0 is treated as invalid — sales must have a positive price value.
- Editing a sale's domain name triggers re-association with the portfolio — if the new name matches a different domain, the old domain's status is reverted and the new domain's status changes to "sold".
- The sales list paginates at 50 items per page, consistent with the domain list.
- Deleting a domain that has associated sales preserves the sale records (ON DELETE SET NULL) — the sale's `domain_name` field retains the domain name for posterity.
- The earnings summary excludes sales with a date outside the active filter range when filters are applied.
- No integration with external payment platforms (Stripe, PayPal, Escrow) — all sales are manually logged.
