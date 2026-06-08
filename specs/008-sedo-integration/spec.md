# Feature Specification: Sedo Integration

**Feature Branch**: `008-sedo-integration`

**Created**: 2026-06-08

**Status**: Draft

**Input**: Phase 5 of DomainVault Master Plan — integrate Sedo marketplace so users can list, update, and remove domain listings directly from the platform, with cached pricing in the domains table and a global sync capability.

## Clarifications

### Session 2026-06-08

- Q: Should the cache auto-populate on first visit or is manual sync the only trigger? → A: Purely manual — user must click "Sync Sedo" to populate the cache at any time, including first visit. No automatic sync on page load.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Configure Sedo Credentials (Priority: P1)

A domain investor wants to connect their Sedo account to DomainVault so they can manage listings without leaving the platform. They navigate to Settings, find the Sedo section, enter their Partner ID, Sign Key, Username, and Password, test the connection, and save.

**Why this priority**: Credentials are the gate — no Sedo feature works without them. Must be built first.

**Independent Test**: Can be fully tested by entering valid/invalid Sedo credentials, testing the connection, and saving — delivers the ability to link a Sedo account to DomainVault.

**Acceptance Scenarios**:

1. **Given** a user with no saved Sedo credentials, **When** they navigate to Settings and fill in all four fields (Partner ID, Sign Key, Username, Password) and click "Test Connection", **Then** an inline badge shows "Connected" with a green checkmark.
2. **Given** a user enters invalid Sedo credentials, **When** they click "Test Connection", **Then** an inline badge shows "Invalid credentials" with a red X.
3. **Given** valid credentials are filled in, **When** the user clicks "Save Credentials", **Then** a success toast confirms they were saved and the fields persist on page reload (password masked).
4. **Given** saved credentials exist, **When** the user revisits Settings, **Then** all fields are pre-filled (password shown as masked placeholder `••••••••` without revealing the actual value).
5. **Given** a user enters a password, **When** they toggle the visibility icon, **Then** the password is shown/hidden.

---

### User Story 2 — View Sedo Listing Status on Domains Page (Priority: P1)

A user opens their Domains page and wants to see, at a glance, which domains are listed on Sedo and at what price — without making an API call.

**Why this priority**: The core value proposition — users need to see their Sedo listings inline with their portfolio.

**Independent Test**: Can be tested by having domains with and without cached Sedo listings and verifying the correct display states.

**Acceptance Scenarios**:

1. **Given** a domain that is NOT listed on Sedo, **When** viewed in the desktop domains table, **Then** the Sedo column shows "Not Listed" in muted text.
2. **Given** a domain that IS listed on Sedo with a cached price, **When** viewed in the desktop domains table, **Then** the Sedo column shows the cached price in green with an edit icon (✏️).
3. **Given** a domain that is NOT listed on Sedo, **When** viewed on a mobile device, **Then** the domain card shows "Sedo — Not Listed" in a separated row.
4. **Given** a domain that IS listed on Sedo, **When** viewed on a mobile device, **Then** the domain card shows "Sedo — $[price]" with an edit icon.
5. **Given** a user with no Sedo credentials saved, **When** they view the Domains page, **Then** the Sedo column header shows a tooltip hinting to add credentials in Settings.

---

### User Story 3 — List a Domain on Sedo (Priority: P1)

A user selects a domain they own and wants to list it for sale on Sedo — setting an asking price, a minimum offer, and choosing between a fixed or negotiable price.

**Why this priority**: Listing domains on Sedo is the primary action of the integration.

**Independent Test**: Can be tested by opening the overlay from a domain row, filling in pricing fields, and submitting — delivers a domain listing on Sedo.

**Acceptance Scenarios**:

1. **Given** a domain NOT listed on Sedo with a `bin` price set, **When** the user opens "List on Sedo" from the Actions menu, **Then** an overlay opens with domain/registrar/expiry pre-filled as read-only, and the Asking Price defaults to the `bin` value with suggestion chips shown (BIN, BIN −20%, BIN −30%).
2. **Given** the overlay is open, **When** the user enters an Asking Price and Min Offer and selects "Fixed" or "Negotiable", then clicks "List on Sedo", **Then** the domain is listed on Sedo, the cache is updated, the overlay closes, a success toast appears, and the Sedo column switches from "Not Listed" to showing the price.
3. **Given** a domain with no `bin` price set, **When** the user opens "List on Sedo", **Then** the Asking Price input is empty and no suggestion chips are shown — the user must enter a price manually.
4. **Given** the overlay is open, **When** the user changes the Asking Price, **Then** the Min Offer suggestion chips recalculate live (20%, 30%, 40%, 50% of the new asking price).
5. **Given** the user submits with empty required fields (Asking Price or Min Offer), **Then** inline validation errors appear below each empty field.
6. **Given** no Sedo credentials are saved, **When** the user opens the overlay, **Then** an inline error appears: "Add Sedo credentials in Settings first" — the submit button is disabled.

---

### User Story 4 — Edit an Existing Sedo Listing (Priority: P2)

A user wants to change the price or minimum offer on a domain already listed on Sedo.

**Why this priority**: Price adjustments are a common need — but a listed domain can still be managed even without editing.

**Independent Test**: Can be tested by opening the overlay from an already-listed domain's edit icon, changing values, and submitting.

**Acceptance Scenarios**:

1. **Given** a domain already listed on Sedo, **When** the user clicks the edit icon (✏️) in the Sedo column, **Then** the overlay opens in edit mode with the current Sedo price and min offer pre-filled.
2. **Given** the overlay is in edit mode, **When** the user changes the price and clicks "Update", **Then** the Sedo listing is updated, the cache is refreshed, a success toast appears, and the table cell shows the new price.
3. **Given** the overlay is in edit mode, **When** the user changes the price but `bin` was previously null, **Then** the `bin` is also saved so it persists for future listing actions.

---

### User Story 5 — Remove a Domain from Sedo (Priority: P2)

A user wants to delist a domain from Sedo because it sold elsewhere or is no longer for sale.

**Why this priority**: Delisting is important for portfolio management, but domains can also be delisted directly on Sedo.

**Independent Test**: Can be tested by clicking "Remove from Sedo" in the edit overlay and confirming.

**Acceptance Scenarios**:

1. **Given** a domain listed on Sedo, **When** the user opens the edit overlay and clicks "Remove from Sedo", **Then** an inline confirmation appears: "Remove from Sedo? [Yes] [Cancel]".
2. **Given** the confirmation is shown, **When** the user clicks "Yes", **Then** the domain is delisted from Sedo, the cache row is removed, the overlay closes, a success toast appears, and the Sedo column reverts to "Not Listed".
3. **Given** the confirmation is shown, **When** the user clicks "Cancel", **Then** the confirmation bar collapses and the edit form remains unchanged.

---

### User Story 6 — Sync All Sedo Listings (Priority: P2)

A user wants to refresh all their Sedo listing data at once to catch any changes made outside of DomainVault (e.g., listings added/removed directly on Sedo's website).

**Why this priority**: Sync is important for data accuracy but is a periodic action, not a per-visit requirement.

**Independent Test**: Can be tested by clicking the Sync button and verifying that the cache reflects the current state on Sedo.

**Acceptance Scenarios**:

1. **Given** the user has Sedo credentials saved, **When** they click "Sync Sedo" on the Domains page toolbar, **Then** all domains currently listed on Sedo are fetched, the cache is updated, and a success toast confirms completion.
2. **Given** a domain was delisted directly on Sedo's website, **When** the user syncs, **Then** that domain's cache row is removed and the Sedo column reverts to "Not Listed".
3. **Given** a domain was listed directly on Sedo's website, **When** the user syncs, **Then** a new cache row is created and the Sedo column shows the listing price.
4. **Given** the user clicks "Sync Sedo", **When** the sync is running, **Then** the button shows a spinning icon, is disabled, and the last-synced timestamp updates upon completion.
5. **Given** no Sedo credentials are saved, **When** the user views the Domains page, **Then** the Sync button is disabled with a tooltip: "Add Sedo credentials in Settings".
6. **Given** a sync encounters a Sedo API error, **When** the sync fails, **Then** an error toast displays the fault message.

---

### User Story 7 — Account Settings Page (Priority: P1)

A user needs a Settings page where they can view their account details (email, member since) and change their password — in addition to configuring Sedo credentials.

**Why this priority**: The Settings page is the prerequisite for credential configuration (Story 1) and provides essential account management.

**Independent Test**: Can be tested by navigating to Settings, viewing account info, and changing password.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to Settings, **Then** they see their email (read-only), member-since date (read-only), and a Change Password sub-form.
2. **Given** the Change Password sub-form, **When** the user enters a new password (min 8 chars, 1 number) and confirmation that match, then clicks "Save Password", **Then** the password is updated and a success toast appears.
3. **Given** the Change Password sub-form, **When** the user enters mismatched passwords, **Then** an inline error appears on the confirmation field.
4. **Given** the Change Password sub-form, **When** the new password doesn't meet requirements (too short, no number), **Then** an inline validation error appears.

---

### Edge Cases

- What happens when the Sedo API returns a fault during listing creation? The error is displayed inline above the overlay footer (not a toast), and the user can correct and retry.
- How does the system handle a domain whose `bin` is null when listing? The Asking Price input is empty — the user must provide a value. Upon successful listing, the `bin` is saved.
- What happens if a user has credentials saved but the Sedo account is later deactivated? Test Connection returns "Invalid credentials" — the user must update their credentials.
- What happens when a sync finds domains on Sedo that don't exist in DomainVault? Those entries are not added to the local cache (they cannot be mapped to a domain_id).
- How does the system handle concurrent edits (user edits a listing while another sync is running)? The last write wins — sync upserts cache rows, and manual edits also upsert.
- What happens on mobile for the Sedo overlay? It renders as a full-screen bottom sheet (`fixed bottom-0`, rounded top corners) at 375px width.
- How does the system handle very large portfolios (users with many Sedo listings)? Sync paginates in batches of 100 listings per request.
- What happens when a user with saved credentials visits the Domains page for the first time (empty cache)? All domains show "Not Listed" — the user must manually click "Sync Sedo" to populate the cache. No automatic sync occurs on page load.

## Requirements *(mandatory)*

### Functional Requirements

**Credentials & Settings**

- **FR-001**: The Settings page MUST display the user's email (read-only) and account creation date (read-only).
- **FR-002**: Users MUST be able to change their password via an inline sub-form with new password, confirm password, and validation (min 8 characters, 1 number).
- **FR-003**: The Settings page MUST include a Sedo API Credentials section with four fields: Partner ID, Sign Key, Username (max 25 characters), and Password (max 16 characters).
- **FR-004**: The Sedo credentials form MUST pre-fill existing values on page load, with the password field masked as a placeholder — the actual value MUST never be exposed in the UI.
- **FR-005**: Users MUST be able to test their Sedo connection without saving — results appear as an inline badge ("Connected" or "Invalid credentials") below the buttons.
- **FR-006**: Saving credentials MUST upsert the values and show a success toast.
- **FR-007**: The Sedo credentials section MUST include helper text explaining how to obtain Partner ID and Sign Key, with a link to Sedo's partner program.

**Domains Page — Sedo Column**

- **FR-008**: The domains table MUST include a `BIN` column (Buy-It-Now price) visible on both desktop table and mobile cards.
- **FR-009**: The domains table MUST include a `Sedo` column immediately after `BIN`, visible on both desktop table and mobile cards.
- **FR-010**: For domains NOT listed on Sedo, the Sedo column MUST display "Not Listed" in muted text.
- **FR-011**: For domains listed on Sedo, the Sedo column MUST display the cached Sedo price in green with an edit icon (✏️). The price shown MUST be from the cache, NOT from the `bin` column.
- **FR-012**: The Sedo column header MUST show a refresh icon with a tooltip indicating when the last sync occurred.
- **FR-013**: On mobile, each domain card MUST include a Sedo row separated by a border, showing either "Not Listed" or the price with an edit icon.

**Sedo Overlay (Create / Edit / Delete)**

- **FR-014**: Opening the overlay MUST pre-fill domain name, registrar, and expiration date as read-only fields from the already-loaded table row — no extra data fetch required.
- **FR-015**: The overlay MUST support two modes: create (for unlisted domains, triggered from Actions menu) and edit (for listed domains, triggered from the ✏️ icon).
- **FR-016**: In create mode, the Asking Price field MUST default to the domain's `bin` value if set. Suggestion chips (BIN, BIN −20%, BIN −30%) MUST appear only when `bin` is not null.
- **FR-017**: In edit mode, the Asking Price and Min Offer MUST pre-fill from the cached Sedo listing values.
- **FR-018**: The Min Offer suggestion chips (20%, 30%, 40%, 50%) MUST recalculate live whenever the Asking Price changes.
- **FR-019**: Users MUST be able to toggle between "Fixed" price and "Negotiable" price. Default: Fixed.
- **FR-020**: On create submit: the domain MUST be listed on Sedo, the `bin` MUST be saved if it was null, a cache row MUST be created, and the table cell MUST switch to State B (listed).
- **FR-021**: On edit submit: the Sedo listing price MUST be updated, the cache MUST be refreshed, and the table cell MUST reflect the new price.
- **FR-022**: On remove (from edit mode): after inline confirmation ("Remove from Sedo? [Yes] [Cancel]"), the domain MUST be delisted from Sedo, the cache row MUST be deleted, and the table cell MUST revert to State A (not listed).
- **FR-023**: During overlay submission, the CTA button MUST show a spinner and all inputs MUST be disabled. Sedo API faults MUST appear as inline errors above the footer — not as toasts.
- **FR-024**: On mobile, the overlay MUST render as a full-width bottom sheet anchored to the bottom of the screen with rounded top corners.

**Sedo Sync**

- **FR-025**: The Domains page toolbar MUST include a "Sync Sedo" button with a refresh icon and a "Last synced: X min ago" timestamp.
- **FR-026**: On sync click: the system MUST fetch all listings from Sedo (paginated, 100 per request), upsert returned domains into the cache, and delete cache rows for domains no longer returned by Sedo (externally delisted).
- **FR-027**: During sync, the button MUST show a spinning icon and be disabled.
- **FR-028**: On sync success: a toast MUST confirm "Sedo listings synced" and the last-synced timestamp MUST update.
- **FR-029**: On sync error: a toast MUST display the Sedo fault message.
- **FR-030**: When no Sedo credentials are saved, the Sync button MUST be disabled with a tooltip directing users to Settings.

**API & Data Integrity**

- **FR-031**: All Sedo API calls MUST be proxied through server-side route handlers — Sedo credentials MUST never be exposed to the client.
- **FR-032**: Every API route MUST authenticate the user, verify credentials exist (return 401 if missing), and return structured error responses on Sedo faults or network failures.
- **FR-033**: The `sedo_listings` cache table MUST use RLS enforcing `user_id = auth.uid()`.
- **FR-034**: When a domain is deleted from DomainVault, its associated `sedo_listings` row MUST be cascade-deleted.

### Key Entities

- **Sedo Credentials**: Per-user credentials stored securely — Partner ID (integer), Sign Key (string), Username (max 25 chars), Password (max 16 chars). Protected by RLS, never exposed to client.
- **Sedo Listing (Cache)**: A local cache of a domain's listing state on Sedo — domain reference, asking price, minimum offer, fixed/negotiable flag, currency (always USD), for-sale status, and last-synced timestamp. Keyed by domain.
- **Domain BIN**: The user's desired Buy-It-Now price stored on the domain record. Distinct from the active Sedo listing price in the cache. Used as the default asking price when listing a domain.
- **Sedo Overlay**: A unified form component for creating, editing, and removing Sedo listings — pre-populated from existing data, with live suggestion chips based on pricing input.
- **Settings Page**: Account management page with read-only profile info, change-password sub-form, and Sedo API credential configuration with test-connection capability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure Sedo credentials and verify the connection in under 30 seconds from arrival on the Settings page.
- **SC-002**: Users can list a domain on Sedo in under 60 seconds from opening the overlay (including price configuration and submission).
- **SC-003**: The Sedo column loads instantly on the Domains page — no per-row API calls, all data served from the local cache.
- **SC-004**: A full sync of 500 Sedo listings completes in under 30 seconds.
- **SC-005**: Users can edit a listing price in under 30 seconds from clicking the edit icon to seeing the updated price in the table.
- **SC-006**: 100% of Sedo API faults are surfaced to the user with meaningful context (inline for forms, toast for sync) — no silent failures.
- **SC-007**: The entire feature works correctly across all supported breakpoints (375px mobile through 1920px desktop).

## Assumptions

- The user has already obtained their Sedo Partner ID and Sign Key by registering at `https://sedo.com/services/sedos-partner-program/` and emailing `[email protected]`.
- The database tables (`user_settings`, `sedo_listings`) and `domains.bin` column already exist in the Supabase project. Migration SQL files (004, 005, 006) need to be added to `supabase/migrations/` for history/documentation purposes only — they do not need to be re-run.
- Currency is always USD for Sedo listings. Multi-currency support is not required.
- The Sedo API uses XML responses. XML parsing is handled server-side only.
- Pagination during sync uses the `startfrom` parameter in batches of 100 — the Sedo API returns all account listings when no `$domain` filter is specified.
- The existing Settings page route (`/settings`) and Domains page route (`/domains`) already exist and are being extended — not created from scratch.
- Pricing for Sedo listings is computed server-side (currency, fixedprice, forsale flags) via shared utility functions.
