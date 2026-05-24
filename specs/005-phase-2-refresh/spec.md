# Feature Specification: Phase 2 Refresh — CSV Import, Manual Entry & Domain Management

**Feature Branch**: `005-phase-2-refresh`

**Created**: 2026-05-24

**Status**: Draft

**Input**: "Review Phase 2 implementation against original spec. Identify what stays
[DONE], what needs [UPDATED], what should be [NEW], and what should be [DELETED].
Key addition: Manual Entry (was explicitly excluded from original Phase 2)."

**Tags legend**:
- **[DONE]** — Don't touch. Fully implemented, stable, no changes needed.
- **[NEW]** — Build from scratch. Was not implemented in original Phase 2.
- **[UPDATED]** — Modify as described. Exists but needs improvement.
- **[DELETED]** — Remove from codebase. No longer needed.

## Clarifications

### Session 2026-05-24

- Q: Should the "Add Domain" form open as a modal dialog, inline form, or separate page? → A: Modal dialog — overlay on the domain list; list dims underneath; closes on submit or cancel.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manual Domain Entry (Priority: P1) [NEW]

A domain investor acquires a single domain (e.g., through a private transaction or
hand-registration) and wants to add it to their portfolio immediately without
preparing a CSV file. From the Domains list page, they click "Add Domain", fill in
the domain name, expiration date, purchase price, registrar, notes, and tags in a
form, and submit. The domain is created instantly with status "active" and appears
in the domain list. Validation rules mirror CSV import (domain name must have a dot,
no spaces, ≤ 253 chars; expiration date required; price must be non-negative).

**Why this priority**: Manual entry is the #1 missing feature from Phase 2. Not every
domain acquisition comes from a registrar CSV export. Private sales, hand-registrations,
and one-off additions require single-entry capability. It is the primary blocker
between Phase 2's "bulk import only" and production-ready portfolio management.

**Independent Test**: Navigate to Domains page, click "Add Domain", fill in valid
data, submit. Verify the domain appears in the list with all fields correct. Attempt
to submit with invalid domain name (no dot) — inline error shown. Attempt to submit
with a domain that already exists — duplicate error shown. Delivers a new domain in
the portfolio without CSV import.

**Acceptance Scenarios**:

1. **Given** a user on the Domains page, **When** they click "Add Domain" and fill
   in a valid domain name, expiration date, and optional fields, **Then** the domain
   is created with status "active" and appears at the top of the domain list.
2. **Given** a user filling in the manual entry form, **When** they submit a domain
   name without a dot (e.g., "mydomain"), **Then** an inline validation error appears
   ("Domain must contain a dot") and no domain is created.
3. **Given** a user filling in the manual entry form, **When** they submit a domain
   name that already exists in their portfolio (case-insensitive match), **Then** an
   inline error appears ("Domain already exists in your portfolio") and no duplicate
   is created.
4. **Given** a user filling in the manual entry form, **When** they leave the
   expiration date empty, **Then** an inline validation error appears ("Expiration
   date is required").
5. **Given** a user submitting the manual entry form, **When** the request succeeds,
   **Then** a toast confirms "Domain added" and the form closes or resets.

---

### User Story 2 — Domain List "Add Domain" Integration (Priority: P1) [UPDATED]

The Domains list page currently has no mechanism to add domains outside of CSV
import. It must be updated to include a prominent "Add Domain" button that opens
the manual entry form. The empty-state message (shown when the user has no domains)
must be updated to offer both import and manual entry options.

**Why this priority**: The manual entry form (US1) needs a discoverable entry point.
Without this integration, the form exists but users can't find it.

**Independent Test**: View the Domains page with domains present — "Add Domain" button
visible. View the Domains page with zero domains — empty state shows both "Import CSV"
and "Add Domain" CTAs. Click "Add Domain" — form opens. Navigate to Import page —
import flow unchanged, no regression.

**Acceptance Scenarios**:

1. **Given** a user with one or more domains, **When** they view the Domains page,
   **Then** an "Add Domain" button is visible near the search/filter bar.
2. **Given** a user with zero domains, **When** they view the Domains page, **Then**
   the empty state shows both "Import your first CSV" and "Add your first domain"
   options with distinct CTAs.
3. **Given** a user on the Domains page, **When** they click "Add Domain", **Then**
    a modal dialog opens with the manual entry form overlaid on the domain list.
4. **Given** a user who adds a domain via manual entry,  **When** the domain is
   created, **Then** the domain list immediately reflects the new domain without a
   full page reload (optimistic update).

---

### Already Complete — No Changes Required

These features are classified **[DONE]** and MUST NOT be modified:

| Feature | Status | Justification |
|---|---|---|
| CSV file upload (drag-and-drop + file picker) | **[DONE]** | Fully functional; PapaParse integration; 10 MB limit enforced |
| CSV parsing (case-insensitive dedup, header trimming) | **[DONE]** | `csvRowSchema` Zod validation; case-insensitive domain matching |
| Import mode toggle (Skip vs Update existing) | **[DONE]** | `csv-option-toggle.tsx`; defaults to "Skip" |
| Import progress indicator | **[DONE]** | `csv-progress.tsx` shows parsing/importing/done phases |
| Import summary (imported, skipped, errors) | **[DONE]** | `csv-summary.tsx` with per-row error detail |
| Import log record creation | **[DONE]** | `createImportLog()` writes filename, counts, errors JSONB |
| Paginated domain list (50/page) | **[DONE]** | Server component hydration + TanStack Query; page nav |
| Domain search (case-insensitive substring) | **[DONE]** | Debounced; updates URL search params |
| Domain filters (status, TLD) | **[DONE]** | Dropdowns; sync with URL search params |
| Domain sort (name, date, status) | **[DONE]** | Column header click; asc/desc toggle; URL search params |
| Domain status badge (active/expired/sold/pending) | **[DONE]** | Color-mapped per constitution |
| Domain expiry badge (countdown + color) | **[DONE]** | 30/90/180 day thresholds per constitution |
| Domain detail page (full record view) | **[DONE]** | `app/(dashboard)/domains/[id]/page.tsx` |
| Domain edit form (status, registrar, price, notes, tags) | **[DONE]** | RHF + Zod `domainEditSchema`; name/TLD read-only |
| Single domain delete (with confirmation) | **[DONE]** | `domain-delete-dialog.tsx`; optimistic removal |
| Bulk domain delete (max 50, with confirmation) | **[DONE]** | Checkbox selection + bulk-delete button |
| Import history list (filename, date, counts) | **[DONE]** | `import-log-list.tsx`; 50 most recent |
| Import history error detail (expandable per log) | **[DONE]** | `import-log-detail.tsx` renders JSONB errors |
| Responsive domain table (card <480px, scroll 480-767px, table ≥768px) | **[DONE]** | per constitution breakpoints |
| Skeleton loaders (domain list, detail, import history) | **[DONE]** | Shimmer placeholders on all async fetches |
| TanStack Query cache (centralized keys, optimistic mutations) | **[DONE]** | `lib/query-keys.ts`; all mutations optimistic |
| Zod validation (csvRowSchema, domainEditSchema, domainFiltersSchema) | **[DONE]** | `lib/validations/domain.ts` |
| Typed database helpers (domains.ts, domains-client.ts, import-logs.ts) | **[DONE]** | Split server/client pattern per constitution v1.1.0 |
| Per-user data isolation (RLS) | **[DONE]** | Enforced by Supabase; domains and import_logs scoped |

### No Longer Needed

| Item | Status | Justification |
|---|---|---|
| Placeholder "Coming in Phase 2" pages | **[DELETED]** | Superseded by real pages; no placeholder code remains |
| T042 (ESLint + Prettier check) in tasks.md | **[DELETED]** | Task was administrative; build already passes lint |

## Requirements *(mandatory)*

### Functional Requirements

#### Manual Domain Entry [NEW]

- **FR-001**: System MUST allow users to manually add a single domain from the
  Domains page without uploading a CSV file.
- **FR-002**: The manual entry form MUST collect: domain name (required), expiration
  date (required), purchase price (optional, non-negative), registrar (optional),
  notes (optional), tags (optional, comma-separated).
- **FR-003**: Manual entry MUST apply the same validation rules as CSV import:
  domain name must contain a dot, no spaces, ≤ 253 characters; expiration date
  must be a valid date; purchase price must be non-negative.
- **FR-004**: System MUST reject manual entry of a domain that already exists in the
  user's portfolio (case-insensitive match) with an inline error "Domain already
  exists in your portfolio".
- **FR-005**: New domains created via manual entry MUST default to status "active".
- **FR-006**: TLD MUST be auto-derived from the domain name (split on last dot) at
  creation time.
- **FR-007**: System MUST display a success toast ("Domain added") and immediately
  show the new domain in the list after creation (optimistic update).

#### Domain List Page Updates [UPDATED]

- **FR-008**: [NEW] Domains page MUST display an "Add Domain" button visible when
  the user has one or more domains.
- **FR-009**: [UPDATED] Domain empty state MUST be updated to offer both "Import CSV"
  and "Add Domain" CTAs (currently only offers import).
- **FR-010**: [NEW] Clicking "Add Domain" MUST open the manual entry form as a modal dialog (overlay) on the domains list page.

### Key Entities

- **Domain** (existing): Domain name (immutable), TLD (auto-derived), expiration date,
  purchase price, status (active/expired/sold/pending), registrar, notes, tags.
  Previously only created via CSV import. **Now also creatable via manual entry form.**

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can manually add a domain to their portfolio in under 30 seconds
  (from clicking "Add Domain" to seeing the domain in the list).
- **SC-002**: Manual entry validation catches 100% of invalid domain names (no dot,
  spaces, >253 chars) before submission.
- **SC-003**: Duplicate domain detection via manual entry is case-insensitive —
  "Example.com" is correctly rejected when "example.com" already exists.
- **SC-004**: All existing Phase 2 features (CSV import, domain list, edit, delete,
  import history) continue to function without regression after manual entry is added.
- **SC-005**: The application builds with zero TypeScript errors and zero ESLint
  warnings after all changes are applied.

## Assumptions

- Manual entry uses the same Supabase client, typed helpers, and Zod schemas as the
  existing domain management features.
- The manual entry form is a dialog (modal) opened from the Domains list page, not a
  separate route — keeping it lightweight and inline with the list context.
- Tags in manual entry are entered as comma-separated text (same format as CSV import)
  and parsed client-side before storage.
- Manual entry does NOT support bulk addition or CSV-style batch operations — it is
  strictly single-domain entry.
- The existing `upsertDomains()` helper in `domains-client.ts` can be extended with a
  `insertSingleDomain()` function, or the existing function can handle single inserts.
- TLD auto-derivation uses the same mechanism as CSV import (split on last dot via
  database `GENERATED ALWAYS AS` column — no client-side logic needed).
