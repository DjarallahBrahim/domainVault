# Research: Phase 2 Refresh — Manual Domain Entry

**Date**: 2026-05-24

## Decisions

### 1. Form Validation Strategy

**Decision**: Create a dedicated `manualEntrySchema` derived from the existing
`csvRowSchema`, adapted for form use (no string coercion on price, `expiration_date`
as a date string). Use React Hook Form with Zod resolver — same pattern as every
form in the codebase (login, register, domain edit, sale log).

**Rationale**: The CSV schema validates raw string columns (all values are strings
from PapaParse). The manual entry form has typed `<input>` fields (date, number).
A derived schema ensures the same validation rules apply (domain format, expiration
date validity, price non-negative) without string coercion artifacts.

**Alternatives considered**:
- Reusing `csvRowSchema` directly — would require string coercion on all fields,
  creating unnecessary conversion logic between the form's typed values and the
  schema's string expectations.
- Creating schema from scratch — would risk divergence from CSV validation rules,
  creating inconsistent duplicate-detection or validation behavior.

### 2. Modal Implementation

**Decision**: Use shadcn/ui `<Dialog>` component for the modal overlay. Form is
rendered inside `<DialogContent>`. Close on Escape key or clicking outside cancels
the operation. Submit closes the dialog on success. Dialog state managed via React
`useState` in the parent `domain-list-client.tsx`.

**Rationale**: shadcn/ui Dialog is already installed and used by
`domain-delete-dialog.tsx`, `sales-delete-dialog.tsx`, and `domain-detail-form.tsx`
(which uses Dialog for the "Log Sale" action). Consistent UX pattern across the
application. Modal overlay keeps the user on the domain list page context.

**Alternatives considered**:
- Inline expandable form — would push the domain list down, disrupt scroll position,
  and break the mental model of "adding" as a distinct action from "browsing."
- Separate page (`/domains/new`) — adds routing complexity for a simple form;
  disconnects user from the list context; unnecessary for single-field-primary entry.

### 3. Database Insert Approach

**Decision**: Add `insertSingleDomain()` function to `lib/supabase/queries/domains-client.ts`.
The function performs a single-row `.insert()` against the `domains` table via the
browser Supabase client. Duplicate detection is handled pre-insert via a case-insensitive
`.ilike()` query against the domain name.

**Rationale**: The existing `upsertDomains()` is optimized for batch CSV operations.
A separate single-insert function keeps the batch path clean and avoids unnecessary
overhead. Duplicate detection via `.ilike()` is the same mechanism used in
`checkExistingDomains()` for CSV import.

**Alternatives considered**:
- Reusing `upsertDomains()` — designed for batch arrays with `onConflict` handling;
  wrapping a single row in an array adds unnecessary indirection.
- Server-side insert via Route Handler — violates constitution (no Route Handlers for
  CRUD). RLS on the domains table already enforces per-user isolation.

### 4. Cache Invalidation Strategy

**Decision**: Use TanStack Query `useMutation` with `onSuccess` invalidating
`queryKeys.domains.list()`. This triggers a re-fetch of the current domain list page,
showing the new domain. No manual cache manipulation needed.

**Rationale**: Matches the pattern used by domain edit and delete mutations. The
domain list already uses `useQuery` with filters from URL search params; invalidating
the list key causes an automatic re-fetch with the current filters, which is
immediately reflected in the table.

**Alternatives considered**:
- Optimistic cache insertion — would require duplicating server-side validation logic
  client-side (TLD derivation, timestamp generation); more complex than a simple
  re-fetch for a non-performance-critical operation.
- No cache invalidation — user would need to manually refresh the page to see the new
  domain; violates the spec requirement for immediate list update.

### 5. TLD Derivation

**Decision**: Let the database `GENERATED ALWAYS AS (split_part(domain, '.', -1)) STORED`
column handle TLD derivation. No client-side TLD extraction needed. The column is
computed automatically on insert.

**Rationale**: The TLD column is a generated column in the database schema. Any insert
into the `domains` table automatically computes the TLD. This is the same mechanism
used by CSV import (`upsertDomains`). Zero client-side logic needed.

**Alternatives considered**:
- Client-side TLD splitting — duplicates database logic; risks inconsistency if the
  database generation formula changes.
