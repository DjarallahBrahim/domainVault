# Feature Specification: Phase 2 — CSV Import & Domain Management

**Feature Branch**: `002-csv-import-domain-management`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "read plan.md and create specification for the PHASE 2 · CSV Import & Domain Management"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bulk CSV Import (Priority: P1)

A domain investor has their portfolio stored in a CSV file (exported from a registrar or spreadsheet). They navigate to the Import page, select their CSV file, and the system parses the file, validates each row, imports valid domains into their portfolio, and presents a clear summary showing how many domains were imported, how many were skipped, and any errors that occurred. Re-running the same file on subsequent attempts does not create duplicates — previously imported domains are recognized and skipped.

**Why this priority**: CSV import is the primary onboarding channel for existing portfolios. Without it, users must manually enter each domain one by one, making the product unusable for anyone with more than a handful of domains. It is the critical path to getting data into the system.

**Independent Test**: Can be fully tested by uploading a CSV file with 50 domain entries (mix of valid, invalid, and duplicate rows), verifying the correct number of domains appear on the domain list page, and checking the import summary for accuracy. Delivers a populated domain portfolio ready for management.

**Acceptance Scenarios**:

1. **Given** a user on the Import page with no domains in their portfolio, **When** they upload a CSV containing 20 valid domain rows, **Then** all 20 domains are imported, the import summary shows "20 imported, 0 skipped, 0 errors", and the domains appear on the domain list page.
2. **Given** a user on the Import page, **When** they upload a CSV where 3 rows have invalid domain names (e.g., no dot, contains spaces), **Then** the valid rows are imported, the 3 invalid rows are reported as errors in the summary, and domains already in the portfolio are not duplicated.
3. **Given** a user who previously imported 10 domains, **When** they upload the same CSV file again, **Then** all 10 domains are recognized as duplicates and skipped, the summary shows "0 imported, 10 skipped, 0 errors", and no duplicate domains are created.
4. **Given** a user on the Import page, **When** they attempt to upload a file that is not a CSV (e.g., `.xlsx`, `.txt` with no commas), **Then** an error message is displayed immediately and no import is attempted.
5. **Given** a user on the Import page, **When** they upload an empty CSV file (headers only, no data rows), **Then** the summary shows "0 imported, 0 skipped, 0 errors" and a message indicates the file contained no data.

---

### User Story 2 — Domain List & Filtering (Priority: P1)

A user views all their imported and manually added domains in a paginated list. They can sort the list by domain name, expiration date, or status. They can filter the list by status (active, expired, sold, pending), by TLD (`.com`, `.io`, etc.), or search by domain name substring. Each domain shows its name, TLD, expiration date, purchase price, and status at a glance. The list updates immediately after import, edit, or deletion.

**Why this priority**: The domain list is the primary portfolio view. After importing data, users need to browse, search, and assess their holdings. It is co-equal with CSV import — without it, imported data is inaccessible.

**Independent Test**: Can be fully tested by importing 60+ domains with varied statuses and TLDs, then applying each filter/sort combination, verifying pagination works, and confirming the list reflects changes after editing or deleting a domain. Delivers a browsable, filterable portfolio.

**Acceptance Scenarios**:

1. **Given** a user with 50+ domains in their portfolio, **When** they navigate to the Domains page, **Then** domains are displayed in a paginated list showing name, TLD, expiration date, purchase price, and status.
2. **Given** a user on the Domains page, **When** they apply a status filter ("Active"), **Then** only domains with the "Active" status are shown.
3. **Given** a user on the Domains page, **When** they search for "example", **Then** only domains whose name contains "example" (case-insensitive) are shown.
4. **Given** a user on the Domains page, **When** they sort by expiration date ascending, **Then** domains expiring soonest appear first.
5. **Given** a user on the Domains page with no domains, **When** the page loads, **Then** an empty-state message is displayed guiding them to import their first domain.

---

### User Story 3 — Domain Detail & Edit (Priority: P2)

A user clicks on a domain from the list to see its full details. They can edit any mutable field: status, registrar, purchase price, notes, and tags. The domain name and TLD cannot be changed (they are the identity of the record). Changes are validated inline and saved immediately or on explicit confirmation. After saving, the domain list reflects the updates.

**Why this priority**: While viewing the list covers inventory assessment, users need to correct data, update statuses, add notes, and tag domains for organization. This is secondary to import and browsing but essential for portfolio maintenance.

**Independent Test**: Can be fully tested by navigating to a domain detail page, editing each mutable field, saving, returning to the list page, and verifying the changes persist. Delivers an editable domain record.

**Acceptance Scenarios**:

1. **Given** a user viewing a domain detail page, **When** they change the status from "Active" to "Sold" and save, **Then** the domain appears with the "Sold" status on the list page.
2. **Given** a user editing a domain, **When** they enter a negative purchase price and attempt to save, **Then** an inline validation error appears and the change is rejected.
3. **Given** a user editing a domain, **When** they add tags "premium" and "brandable", **Then** the tags are saved and displayed on the detail page.
4. **Given** a user viewing a domain detail page, **When** they attempt to edit the domain name field, **Then** the field is read-only and cannot be modified.
5. **Given** a user viewing a domain detail page, **When** the domain has no notes or tags, **Then** the fields appear empty with a placeholder hint.

---

### User Story 4 — Domain Deletion (Priority: P2)

A user can delete individual domains or multiple domains at once from the list page. A confirmation dialog requires explicit confirmation to prevent accidental data loss. Deleted domains are permanently removed from the portfolio and no longer appear in the list or in any associated sale records (the sale record retains the domain name for posterity but the link is broken).

**Why this priority**: Portfolio curation requires the ability to remove domains that were sold, expired, or entered by mistake. It is important but blocked behind having data to delete (import).

**Independent Test**: Can be fully tested by selecting one or multiple domains, confirming deletion, and verifying they no longer appear in the list. Delivers one-click portfolio cleanup.

**Acceptance Scenarios**:

1. **Given** a user on the Domains list page, **When** they click delete on a single domain and confirm the deletion dialog, **Then** the domain is permanently removed and the list updates to exclude it.
2. **Given** a user on the Domains list page with bulk select enabled, **When** they select 3 domains and confirm deletion, **Then** all 3 are permanently removed.
3. **Given** a user on the Domains list page, **When** they click delete but cancel the confirmation dialog, **Then** no domains are deleted and the list is unchanged.

---

### User Story 5 — Import Log History (Priority: P3)

A user can review their import history, including past CSV imports with their filenames, timestamps, and outcome summaries (total rows, imported count, skipped count). They can drill into a specific import log to see the detailed list of errors (which rows failed and why), helping them correct their CSV file for a successful re-import.

**Why this priority**: Import history provides auditability and helps users debug failed imports. It enhances the import workflow but is not required for initial data loading — users can retry imports without history lookup.

**Independent Test**: Can be fully tested by performing 3 imports (some with errors), navigating to the import history list, and verifying each log entry shows accurate counts and drillable error details. Delivers an auditable import trail.

**Acceptance Scenarios**:

1. **Given** a user who has performed 3 imports, **When** they view the import history, **Then** all 3 imports are listed with filename, date, and summary counts.
2. **Given** a user viewing an import log for a failed import (3 errors), **When** they expand the error details, **Then** they see which rows failed and the specific reason for each error.
3. **Given** a user with no prior imports, **When** they view the import history, **Then** an empty state message indicates no imports have been performed yet.

---

### Edge Cases

- What happens when a user uploads a CSV file larger than 50,000 rows?
- What happens when a CSV has unexpected encoding (e.g., Latin-1 instead of UTF-8)?
- What happens when a CSV column header is misspelled or has extra whitespace?
- What happens when a user navigates away from the Import page during an active import?
- How does the system handle CSV rows where required fields (domain, expiration_date) are empty?
- What happens when two users (same account, different browser tabs) simultaneously import the same CSV file?
- How does the system handle a domain name that exceeds the database column length?
- What happens when a user tries to bulk-delete more than 100 domains at once?
- How does the domain list behave when a user has thousands of domains and applies filters that match none?
- What happens when the user's browser loses connectivity during a domain edit save?
- How does the import handle a CSV row with a future expiration date — is that valid or should it be flagged?
- What happens when a CSV contains a domain that already exists in the portfolio but has different data (e.g., different expiration date)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to upload a CSV file for domain import on the Import page.
- **FR-002**: System MUST support CSV files with comma-separated values, UTF-8 encoding, and a header row.
- **FR-003**: System MUST map CSV columns by standardized header names: `domain`, `expiration_date`, `purchase_price`, `registrar`, `notes`, `tags`.
- **FR-004**: System MUST accept flexible column ordering — columns can appear in any order in the header row.
- **FR-005**: System MUST tolerate optional whitespace around column headers and values during CSV parsing.
- **FR-006**: System MUST validate each CSV row before insertion, rejecting rows where:
  - The domain name is empty or invalid (no dot, contains spaces, exceeds 253 characters).
  - The domain already exists in the user's portfolio (skip as duplicate).
  - The expiration date is missing, unparseable, or not a valid date.
  - The purchase price (if provided) is not a valid non-negative number.
- **FR-007**: System MUST import all valid rows in a single atomic operation — no partial imports on failure.
- **FR-008**: System MUST create an import log record for every import attempt, recording filename, total row count, number imported, number skipped, and structured error details per row.
- **FR-009**: System MUST display an import summary after completion showing the counts of imported, skipped, and errored rows.
- **FR-010**: System MUST display a paginated list of all domains in the user's portfolio on the Domains page.
- **FR-011**: System MUST support sorting the domain list by domain name, expiration date, and status.
- **FR-012**: System MUST support filtering the domain list by status (active, expired, sold, pending) and by TLD.
- **FR-013**: System MUST support full-text search on domain names (case-insensitive substring match).
- **FR-014**: System MUST display an empty-state message when the user has no domains, directing them to the Import page.
- **FR-015**: System MUST allow users to view a single domain's full details on a dedicated detail page.
- **FR-016**: System MUST allow users to edit the following domain fields: status, registrar, purchase price, notes, and tags.
- **FR-017**: System MUST prevent editing of the domain name and TLD fields (read-only).
- **FR-018**: System MUST validate edited fields with the same rules as CSV import (purchase price must be non-negative, status must be a valid option).
- **FR-019**: System MUST display inline validation errors on the edit form when field values are invalid.
- **FR-020**: System MUST allow users to delete individual domains with a confirmation dialog.
- **FR-021**: System MUST allow users to select multiple domains and bulk-delete them with a single confirmation.
- **FR-022**: System MUST display a confirmation dialog before any domain deletion, clearly stating the number of domains to be deleted.
- **FR-023**: System MUST display a list of past import attempts (import log history) with filename, timestamp, and summary counts.
- **FR-024**: System MUST allow users to expand an import log entry to view detailed per-row error information.
- **FR-025**: System MUST enforce per-user data isolation — users can only see, edit, and delete their own domains and import logs.

### Key Entities

- **Domain**: Represents a domain name in the user's portfolio. Key attributes: domain name (immutable), TLD (auto-derived), expiration date, purchase price, status (active/expired/sold/pending), registrar, notes, tags. Owned by exactly one user. Created via CSV import or manual entry. Can be edited and deleted.
- **Import Log**: Records the outcome of each CSV import attempt. Key attributes: filename, timestamp, total row count, imported count, skipped count, and structured error details (row number, column, error message). Owned by exactly one user. Created automatically on every import and read-only after creation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can import a CSV file of 1,000 valid domain rows and see the results in under 10 seconds.
- **SC-002**: A user can import a CSV file of 10,000 rows and see the results in under 60 seconds.
- **SC-003**: 100% of valid domain rows are successfully imported with no data loss or truncation.
- **SC-004**: Duplicate domain rows are correctly identified and skipped in subsequent imports — zero duplicate domains created.
- **SC-005**: A user can locate any specific domain in a portfolio of 1,000 domains within 5 seconds using search or filter.
- **SC-006**: Domain list pagination delivers a full page of results (up to 50 domains) in under 2 seconds.
- **SC-007**: Domain edits are reflected in the list view in under 2 seconds after saving.
- **SC-008**: Domain deletions complete in under 1 second for single deletes and under 5 seconds for bulk deletes of up to 50 domains.
- **SC-009**: Import history is accessible and displays the last 50 import logs in under 2 seconds.
- **SC-010**: 100% of domain operations (import, edit, delete) are scoped to the authenticated user — no cross-user data access is possible.

## Assumptions

- Users have access to their domain portfolio data in CSV format, with at minimum `domain` and `expiration_date` columns.
- The CSV file uses UTF-8 encoding with comma delimiters and a header row — other formats (tab-delimited, semicolon-delimited, Excel binary) are out of scope.
- File upload size is limited to 10 MB (approximately 50,000+ typical rows) — files exceeding this will be rejected before parsing.
- CSV import is synchronous (not a background job) — the user waits on the import page until processing completes. For very large files (50k+ rows), the import may be slower but completes within the stated success criteria.
- Duplicate detection is based on exact domain name match within the user's portfolio — close matches (e.g., different casing, extra whitespace) are treated as distinct domains.
- Tags are provided as a single comma-separated value in the CSV (e.g., "premium, brandable" → ["premium", "brandable"]).
- Dates are expected in ISO 8601 format (YYYY-MM-DD) or common variants (MM/DD/YYYY, DD/MM/YYYY with auto-detection).
- The database schema from Phase 1 (domains, import_logs tables with RLS policies) is deployed and accessible.
- Supabase client-side queries use the public `anon` key; RLS policies enforce per-user isolation on all domain and import_log operations — no custom API routes.
- Domain list pagination defaults to 50 items per page with standard page navigation (no infinite scroll).
- Bulk delete is limited to 50 domains at a time for UI performance and user safety.
- Email notifications for import completion are out of scope for Phase 2.
- Manual single-domain creation (without CSV) is out of scope for Phase 2 — all new domains enter via CSV import.
- Domain status auto-transition (e.g., "active" → "expired" based on date) is out of scope for Phase 2.
