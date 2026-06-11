# Feature Specification: Spaceship SellerHub Integration

**Feature Branch**: `009-spaceship-integration`

**Created**: 2026-06-08

**Status**: Draft

**Input**: Phase 6 of DomainVault Master Plan — integrate Spaceship SellerHub marketplace. Users can list, update, and remove domains for sale on Spaceship directly from DomainVault. Follows the same UX patterns established in Phase 5 (Sedo Integration) but adapted for Spaceship's REST/JSON API.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Configure Spaceship API Credentials (Priority: P1)

A domain investor wants to connect their Spaceship account to DomainVault so they can manage SellerHub listings without leaving the platform. They navigate to Settings, find the Spaceship section, enter their API Key and API Secret, test the connection, and save.

**Why this priority**: Credentials are required before any Spaceship feature works.

**Independent Test**: Enter valid/invalid Spaceship API credentials, test the connection, save — delivers the ability to link a Spaceship account.

**Acceptance Scenarios**:

1. **Given** a user with no saved Spaceship credentials, **When** they navigate to Settings and fill in API Key and API Secret, then click "Test Connection", **Then** an inline badge shows "Connected" or "Invalid credentials".
2. **Given** valid credentials are filled in, **When** the user clicks "Save Credentials", **Then** a success toast confirms they were saved and the fields persist on page reload (secret masked).
3. **Given** saved credentials exist, **When** the user revisits Settings, **Then** both fields are pre-filled (secret shown as masked placeholder without revealing the actual value).
4. **Given** a user enters their API Secret, **When** they toggle the visibility icon, **Then** the secret is shown/hidden.

---

### User Story 2 — View SellerHub Listing Status on Domains Page (Priority: P1)

A user opens their Domains page and sees which domains are listed on Spaceship SellerHub and at what price — alongside the existing Sedo column.

**Why this priority**: Core value — inline visibility of listings across marketplaces.

**Independent Test**: Verify domains with and without SellerHub cache entries display correct states.

**Acceptance Scenarios**:

1. **Given** a domain NOT listed on Spaceship, **When** viewed in the desktop domains table, **Then** the Spaceship column shows "Not Listed" in muted text.
2. **Given** a domain listed on Spaceship with a cached price, **When** viewed in the desktop table, **Then** the Spaceship column shows the cached price in green with edit (✏️) and sync (↻) icons.
3. **Given** a domain NOT listed on Spaceship, **When** viewed on a mobile device, **Then** the domain card shows "Spaceship — Not Listed" in a separated row with sync (↻) and list (+) icons.
4. **Given** a user with no Spaceship credentials saved, **When** they view the Domains page, **Then** the Spaceship column header shows a tooltip hinting to add credentials in Settings.

---

### User Story 3 — List a Domain on SellerHub (Priority: P1)

A user selects a domain and lists it for sale on Spaceship SellerHub with an asking price.

**Why this priority**: Primary action of the integration.

**Independent Test**: Open the overlay from a domain row, set a price, submit — verify domain appears as listed on Spaceship and the column updates.

**Acceptance Scenarios**:

1. **Given** a domain NOT listed on Spaceship with a `bin` price set, **When** the user opens the listing overlay, **Then** the Asking Price defaults to the `bin` value with suggestion chips shown (BIN, BIN −20%, BIN −30%).
2. **Given** the overlay is open, **When** the user enters a price and clicks "List on Spaceship", **Then** the domain is listed on SellerHub, the cache is updated, the overlay closes, and the column switches to showing the price.
3. **Given** a domain with no `bin` price, **When** the user opens the overlay, **Then** the Asking Price input is empty and no suggestion chips are shown — the user must enter a price manually.
4. **Given** no Spaceship credentials are saved, **When** the user opens the overlay, **Then** an inline error appears: "Add Spaceship credentials in Settings first".

---

### User Story 4 — Edit an Existing SellerHub Listing (Priority: P2)

A user wants to change the price on a domain already listed on Spaceship SellerHub.

**Why this priority**: Price adjustments are common but a listed domain still functions without editing.

**Independent Test**: Open overlay from the edit icon on a listed domain, change the price, submit — verify cache updates.

**Acceptance Scenarios**:

1. **Given** a domain already listed on SellerHub, **When** the user clicks the edit icon (✏️), **Then** the overlay opens in edit mode with the current price pre-filled.
2. **Given** the overlay is in edit mode, **When** the user changes the price and clicks "Update", **Then** the listing is updated on Spaceship, the cache refreshes, and the table cell shows the new price.

---

### User Story 5 — Remove a Domain from SellerHub (Priority: P2)

A user wants to delist a domain from Spaceship SellerHub.

**Why this priority**: Important for portfolio management but domains can be delisted directly on Spaceship.

**Independent Test**: Click "Remove from Spaceship" in the edit overlay, confirm — verify domain is delisted and column reverts to "Not Listed".

**Acceptance Scenarios**:

1. **Given** a domain listed on SellerHub, **When** the user opens the edit overlay and clicks "Remove from Spaceship", **Then** an inline confirmation appears.
2. **Given** the confirmation is shown, **When** the user clicks "Yes", **Then** the domain is delisted from Spaceship, the cache row is removed, and the column reverts to "Not Listed".

---

### User Story 6 — Sync All SellerHub Listings (Priority: P2)

A user wants to refresh all their Spaceship SellerHub listing data at once to catch changes made outside DomainVault.

**Why this priority**: Sync ensures data accuracy but is periodic, not per-visit.

**Independent Test**: Click "Sync Spaceship" — verify cache populates/updates, stale rows removed.

**Acceptance Scenarios**:

1. **Given** the user has credentials saved, **When** they click "Sync Spaceship", **Then** all SellerHub listings are fetched (paginated), the cache is updated, and a success toast confirms completion.
2. **Given** a domain was delisted directly on Spaceship, **When** the user syncs, **Then** that domain's cache row is removed and the column reverts to "Not Listed".
3. **Given** a domain was listed directly on Spaceship, **When** the user syncs, **Then** a new cache row is created and the column shows the listing price.
4. **Given** no Spaceship credentials are saved, **When** the user views the Domains page, **Then** the Sync button is disabled with a tooltip directing to Settings.
5. **Given** a sync encounters a Spaceship API error, **When** the sync fails, **Then** an error toast displays the API error message.

---

### User Story 7 — Per-Domain Sync via SellerHub API (Priority: P2)

A user clicks the sync icon (↻) on a single domain row to check its current status on Spaceship SellerHub — whether it is listed and at what price.

**Why this priority**: Enables quick single-domain checks without a full sync.

**Independent Test**: Click the sync icon on any domain row — verify the cache updates if the domain is listed on Spaceship or stays unchanged if not.

**Acceptance Scenarios**:

1. **Given** a domain shown as "Not Listed", **When** the user clicks the sync icon, **Then** the system checks Spaceship — if the domain IS listed there, the cache is updated and the cell shows the price.
2. **Given** a domain shown as listed, **When** the user clicks the sync icon, **Then** the current price is fetched from Spaceship and the cache is updated if changed.
3. **Given** a domain that is NOT listed on Spaceship, **When** the user clicks the sync icon, **Then** a toast confirms it is not listed and the cache is not changed.

---

### Edge Cases

- What happens when the Spaceship API returns a 401 (invalid credentials)? The inline badge in Settings shows "Invalid credentials" and the user must re-enter their API key/secret.
- What happens during sync when a domain listed on Spaceship doesn't exist in DomainVault? Those entries are skipped — they cannot be mapped to a domain_id.
- How does the system handle concurrent edits and syncs? The last write wins — sync upserts cache rows and manual edits also upsert.
- What happens on mobile for the Spaceship overlay? It renders as a full-screen bottom sheet matching the Sedo overlay behavior.
- How does the system handle Spaceship API rate limits (300 req/300s for listing, 30 req/30s for operations)? The sync paginates in reasonable batch sizes; per-domain syncs are user-initiated so rate limits are unlikely to be hit.
- What happens if the Spaceship API returns a 429 (rate limit exceeded)? An error toast displays the rate limit message with the retry-after window.

## Requirements *(mandatory)*

### Functional Requirements

**Credentials & Settings**

- **FR-001**: The Settings page MUST include a Spaceship API Credentials section with two fields: API Key and API Secret.
- **FR-002**: The Spaceship credentials form MUST pre-fill existing values on page load, with the API Secret field masked — the actual value MUST never be exposed in the UI.
- **FR-003**: Users MUST be able to test their Spaceship connection without saving — results appear as an inline badge ("Connected" or "Invalid credentials").
- **FR-004**: Saving credentials MUST upsert the values to `user_settings` (new columns: `spaceship_api_key`, `spaceship_api_secret`) and show a success toast.
- **FR-005**: The Spaceship credentials section MUST include helper text explaining how to obtain an API Key and Secret from Spaceship's API Manager.

**Domains Page — Spaceship Column**

- **FR-006**: The domains table MUST include a `Spaceship` column positioned after the `Sedo` column, visible on both desktop table and mobile cards.
- **FR-007**: For domains NOT listed on Spaceship, the column MUST display "Not Listed" in muted text with sync (↻) and list (+) action icons.
- **FR-008**: For domains listed on Spaceship, the column MUST display the cached price in green with sync (↻) and edit (✏️) action icons.
- **FR-009**: On mobile, each domain card MUST include a Spaceship row separated by a border, showing either "Not Listed" + actions or the price + actions.

**Spaceship Overlay (Create / Edit / Delete)**

- **FR-010**: Opening the overlay MUST pre-fill domain name, registrar, and expiration date as read-only fields from the already-loaded table row — no extra data fetch required.
- **FR-011**: The overlay MUST support two modes: create (for unlisted domains via + icon) and edit (for listed domains via ✏️ icon).
- **FR-012**: In create mode, the Asking Price field MUST default to the domain's `bin` value if set with suggestion chips. Chips MUST appear only when `bin` is not null.
- **FR-013**: In edit mode, the Asking Price MUST pre-fill from the cached Spaceship listing value.
- **FR-014**: On create submit: the domain MUST be listed on Spaceship SellerHub, the `bin` MUST be saved if it was null, a cache row MUST be created, and the table cell MUST switch to the listed state.
- **FR-015**: On edit submit: the Spaceship listing MUST be updated, the cache MUST be refreshed, and the table cell MUST reflect the new price.
- **FR-016**: On remove: after inline confirmation, the domain MUST be delisted from Spaceship, the cache row MUST be deleted, and the cell MUST revert to "Not Listed".
- **FR-017**: During overlay submission, the CTA button MUST show a spinner and all inputs MUST be disabled. Spaceship API errors MUST appear as inline errors above the footer.
- **FR-018**: On mobile, the overlay MUST render as a full-width bottom sheet with rounded top corners, positioned above the tab bar.

**Spaceship Sync**

- **FR-019**: The Domains page toolbar MUST include a "Sync Spaceship" button with a refresh icon and a "Last synced: X min ago" timestamp.
- **FR-020**: On sync click: the system MUST fetch all SellerHub listings (paginated), upsert returned domains into the cache, and delete cache rows for domains no longer returned by Spaceship.
- **FR-021**: During sync, the button MUST show a spinning icon and be disabled.
- **FR-022**: On sync success: a toast MUST confirm completion and the last-synced timestamp MUST update.
- **FR-023**: When no Spaceship credentials are saved, the Sync button MUST be disabled with a tooltip directing users to Settings.

**Per-Domain Sync**

- **FR-024**: The sync icon (↻) MUST appear on every domain row in the Spaceship column.
- **FR-025**: On click: the system MUST fetch the specific domain's status from Spaceship SellerHub and update the cache directly (no refetch from Supabase).

**API & Data Integrity**

- **FR-026**: All Spaceship API calls MUST be proxied through server-side route handlers — API credentials MUST never be exposed to the client.
- **FR-027**: Every API route MUST authenticate the user, verify credentials exist (return 401 if missing), and return structured error responses on Spaceship API faults or network failures.
- **FR-028**: The `spaceship_listings` cache table MUST use RLS enforcing `user_id = auth.uid()`.

**Filters**

- **FR-029**: The "Not Listed On" filter dropdown MUST include a "Not listed on Spaceship" option that filters out domains with entries in `spaceship_listings`.

### Key Entities

- **Spaceship Credentials**: Per-user API Key and API Secret stored in `user_settings`. Protected by RLS, never exposed to client.
- **Spaceship Listing (Cache)**: A local cache of a domain's listing state on Spaceship SellerHub — domain reference, asking price, currency, and last-synced timestamp. Keyed by domain.
- **Spaceship Overlay**: A unified form component for creating, editing, and removing Spaceship SellerHub listings — follows the same UX patterns as the Sedo overlay.
- **Domain BIN**: The user's desired Buy-It-Now price stored on the domain record (shared across all marketplaces). Used as the default asking price.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure Spaceship credentials and verify the connection in under 30 seconds from arrival on the Settings page.
- **SC-002**: Users can list a domain on Spaceship in under 60 seconds from opening the overlay.
- **SC-003**: The Spaceship column loads instantly on the Domains page — no per-row API calls, all data served from the local cache.
- **SC-004**: A full sync of 500 Spaceship listings completes in under 30 seconds.
- **SC-005**: 100% of Spaceship API errors are surfaced to the user with meaningful context — no silent failures.
- **SC-006**: The entire feature works correctly across all supported breakpoints (375px mobile through 1920px desktop).
- **SC-007**: The feature coexists with the existing Sedo column without layout regressions — the domains table can display both marketplace columns simultaneously.

## Assumptions

- The user has a Spaceship account and has generated an API Key and Secret via Spaceship's API Manager (`https://spaceship.dev`).
- The `user_settings` table will be extended with new columns (`spaceship_api_key`, `spaceship_api_secret`) rather than creating a separate table.
- A new `spaceship_listings` cache table will follow the same pattern as `sedo_listings` — write-through cache with RLS, keyed by `domain_id`.
- The Spaceship API uses REST/JSON (not XML) — a different client module is needed (`lib/spaceship/client.ts`).
- Spaceship SellerHub does not have a dedicated "check credentials" endpoint — connection testing will use the GET SellerHub domains list endpoint (lightweight request to validate auth).
- Currency is determined by Spaceship's API response — no fixed currency assumption.
- Column ordering on the domains table will be: BIN → Sedo → Spaceship.
- The existing Sedo integration components (SedoCell, SedoCardRow, SedoOverlay, SedoSyncButton) serve as the pattern for equivalent Spaceship components.
