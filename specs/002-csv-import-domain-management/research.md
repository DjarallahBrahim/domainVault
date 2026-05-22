# Research: Phase 2 — CSV Import & Domain Management

**Date**: 2026-05-22

## Overview

Phase 2 introduces three new technology patterns not present in Phase 1:
1. **File upload + CSV parsing** in a Next.js client component
2. **TanStack Query** for server state management (deferred from Phase 1)
3. **Batch database operations** with upsert conflict handling

All decisions below are constrained by the constitution: server components by default,
no Route Handlers for CRUD, batch inserts only, Supabase anon key + RLS for auth.

---

## 1. CSV Parsing Strategy

### Decision: Client-side PapaParse → server-side batch Supabase upsert

**Rationale**: PapaParse v5 is the constitution-mandated CSV parser. Parsing on the
client gives immediate feedback (row counts, validation errors) without a round-trip.
The parsed and validated rows are then sent to Supabase in a single batch operation.
This avoids the need for a Route Handler (the "server" is Supabase itself).

**Alternatives considered**:
- **Server Action with PapaParse**: Would require a Server Action boundary, adding
  complexity without benefit — the file is already on the client and PapaParse is
  lightweight enough for client-side execution.
- **Route Handler for file upload**: Violates constitution — Route Handlers are
  reserved for server-side secrets, not CRUD.

**Implementation pattern**:
```
User selects file → client reads FileReader → PapaParse.parse() →
client-side Zod validation per row → batch upsert via Supabase client →
insert import_logs row via Supabase client
```

**PapaParse configuration**:
- `header: true` — first row is column headers
- `skipEmptyLines: true` — skip blank rows
- `transformHeader: (h) => h.trim().toLowerCase()` — normalize headers
- `dynamicTyping: false` — all values are strings initially, Zod converts types

**Whitespace tolerance**: `transform: (v) => v?.trim() ?? v` on all string fields.

---

## 2. TanStack Query with Supabase

### Decision: Centralized query keys + typed query helpers with cache invalidation

**Rationale**: The constitution requires TanStack Query v5 for all client-side fetches
and mandates centralized query keys and typed helpers. Phase 1 had no DB queries so
this is Phase 2's first introduction of the pattern.

**Query key structure** (in `lib/query-keys.ts`):
```typescript
export const queryKeys = {
  domains: {
    all: ['domains'] as const,
    lists: () => [...queryKeys.domains.all, 'list'] as const,
    list: (filters: DomainFilters) => [...queryKeys.domains.lists(), filters] as const,
    details: () => [...queryKeys.domains.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.domains.details(), id] as const,
  },
  importLogs: {
    all: ['import-logs'] as const,
    lists: () => [...queryKeys.importLogs.all, 'list'] as const,
    list: (filters?: ImportLogFilters) => [...queryKeys.importLogs.lists(), filters] as const,
    details: () => [...queryKeys.importLogs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.importLogs.details(), id] as const,
  },
};
```

**Optimistic update pattern**:
- Edit save: optimistic cache update → Supabase upsert → rollback on error
- Delete: optimistic cache removal → Supabase delete → rollback on error
- Bulk delete: optimistic batch removal → Supabase batch delete → rollback on error
- CSV import: invalidate all domain queries on completion (no optimistic — import is
  a long operation where optimistic UI would be misleading)

**Server component hydration**:
- Domain list page: Server component fetches first page via `createServerClient` →
  prefetches into TanStack Query via `HydrationBoundary`
- Domain detail page: Server component fetches single domain → prefetches into
  TanStack Query
- This gives both SSR (fast initial load) and client-side interactivity (filters,
  pagination changes happen without full page reload)

**Alternatives considered**:
- **SWR**: Simpler API but lacks TanStack Query's cache invalidation precision needed
  for the domain edit → list update flow.
- **Server fetch on every navigation**: Violates constitution UX requirement
  (skeleton loaders, not full-page reloads).

---

## 3. Domain List Pagination

### Decision: Range-based pagination via Supabase `.range()` with URL search params

**Rationale**: Cursor-based pagination (`.lt()`, `.gt()`) is more efficient for infinite
scroll but adds complexity for traditional page navigation. Range-based (`.range(0,49)`)
is simpler, supports "jump to page N", and is sufficient for portfolios up to 50k domains.

**URL state**: Pagination, sort, filter, and search are stored in URL search params (not
local state) so the domain list URL is shareable/bookmarkable:
```
/domains?page=2&sort=expiration_date&order=asc&status=active&tld=com&search=example
```

**Pagination default**: 50 items per page (per spec assumption).

**Sort options**: domain name, expiration date, status (asc/desc toggle).

**Alternatives considered**:
- **Cursor-based (`.lt()` / `.gt()`)**: Better for infinite scroll but worse for page
  jumping. The spec mandates "standard page navigation (no infinite scroll)" so
  range-based is the correct choice.

---

## 4. Batch Upsert Strategy

### Decision: Single `.upsert()` call with `onConflict: 'user_id,domain'`

**Rationale**: The constitution requires batch inserts — individual row loops are
prohibited. The domains table has a `UNIQUE(user_id, domain)` constraint, which maps
perfectly to Supabase's `.upsert()` with `onConflict`. This handles both:
- **New domains**: Inserts the row
- **Existing domains (update mode)**: Updates specified fields
- **Existing domains (skip mode)**: Set `ignoreDuplicates: true` to skip

**Case-insensitive duplicate detection**: Since PostgreSQL's UNIQUE constraint is
case-sensitive and we need case-insensitive matching, the approach is:
- Normalize domain to lowercase for the duplicate lookup (`.eq('domain_lower', domain.toLowerCase())`)
- Check for existing matches before the batch operation
- Or: add a separate case-insensitive comparison layer client-side

**Alternative**: A generated column `domain_lower TEXT GENERATED ALWAYS AS (lower(domain)) STORED`
with a unique index on `(user_id, domain_lower)`. This is a schema change but could be
done in a future migration if needed. For Phase 2, client-side case-insensitive dedup
is simpler and avoids a migration.

**Implementation**: Before the batch upsert, query existing domains matching the
normalized names. Mark matches as "skip" or "update" depending on the user's choice.
Filter the batch accordingly. This is 2 DB calls (1 select, 1 upsert) — acceptable
for the scale.

---

## 5. Domain Delete Pattern

### Decision: Hard delete via Supabase `.delete()` + confirmation dialog + toast

**Rationale**: Per the spec, domains are permanently removed. The sales table has
`ON DELETE SET NULL` for `domain_id`, so deleting a domain preserves the sale record
(with the denormalized `domain_name`). No soft delete → archive flow needed in Phase 2.

**Bulk delete**: `.delete().in('id', [...selectedIds])` with a max of 50 (per spec).

**Confirmation**: shadcn/ui Dialog (AlertDialog variant) with domain count displayed.
Prevent accidental clicks: require a 2-step confirmation (click delete → dialog →
confirm → toast success).

**Optimistic update**: Remove domains from TanStack Query cache immediately, rollback
if the Supabase call fails.

---

## 6. Domain Detail & Edit

### Decision: Separate route page with React Hook Form + Zod, optimistic save

**Rationale**: The Phase 1 project structure already has `app/(dashboard)/domains/[id]/page.tsx`.
Using a separate page (not a modal) aligns with:
- Constitution: Server Components by default
- URL shareability: `/domains/<uuid>` is a bookmarkable page
- Back-button behavior: standard web navigation

**Form pattern**:
- Immutable fields: domain name, TLD (displayed as read-only, not in form state)
- Mutable fields: status (Select), registrar (Input), purchase_price (Input/number),
  notes (Textarea), tags (TagInput or comma-separated Input)
- Validation: Zod schema in `lib/validations/domain.ts` — purchase_price ≥ 0,
  status is one of (active, expired, sold, pending)
- Save: optimistic update via `useMutation` → invalidate domain list queries

**Tags UI**: Simple comma-separated Input transformed to/from string array. Example:
tags "premium, brandable" → `["premium", "brandable"]`.

---

## 7. Import Progress Feedback

### Decision: Client-side progress tracking with row counter

**Rationale**: For synchronous imports (user waits on page), a progress indicator
prevents perceived slowness. Since PapaParse parses the entire file at once, the
"progress" is really about the batch upsert operation.

**Implementation**: After parsing:
1. Show "Parsing complete: 1,234 rows found"
2. Show "Importing to database..." with a determinate progress bar (chunk the
   batch into groups for UI updates if >1,000 rows)
3. Show "Import complete: 1,200 imported, 34 skipped, 0 errors"

For the user, this feels like progress even though the underlying operation
may be a single batch call.

---

## 8. Import Log History

### Decision: Read-only list with expandable error details

**Rationale**: Import logs are append-only records created during import. They are
displayed as a table (filename, date, counts) with row expansion for error details.

**Query pattern**: Fetch logs ordered by `created_at DESC`, limit 50. Error details
live in the `errors` JSONB column — displayed as a nested list when expanded.

**Components**: `import-log-list.tsx` (table) + `import-log-detail.tsx` (expandable
panel showing per-row error details).

---

## 9. New shadcn/ui Components Required

| Component | Purpose | Source |
|---|---|---|
| **Table** | Domain list table, import history table | shadcn/ui Table |
| **Dialog** | Delete confirmation dialog | shadcn/ui Dialog (AlertDialog) |
| **Select** | Status filter, status edit dropdown | shadcn/ui Select |
| **Badge** | Status badges (active/expired/sold/pending) | shadcn/ui Badge |
| **Sonner (Toaster)** | Toast notifications for import/save/delete | shadcn/ui Sonner |
| **Skeleton** | Loading skeletons for table rows, detail page | shadcn/ui Skeleton |

**Note**: Button, Input, Card, Label, Separator already exist from Phase 1.

---

## 10. File Validation (Client-Side)

Before PapaParse, validate the raw file:
- **Type**: Only `.csv` extension accepted; check MIME type `text/csv` (fallback to
  extension check since MIME can be unreliable)
- **Size**: Max 10 MB (reject with message if exceeded)
- **Content**: Check first byte for UTF-8 BOM and strip if present
- **Headers**: After parsing, verify at least `domain` and `expiration_date` headers
  exist (case-insensitive match); reject with error if missing

---

## Summary of Key Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| CSV parser | PapaParse v5 (client-side) | Constitution-mandated; instant feedback |
| Server state | TanStack Query v5 | Constitution-mandated; cache + optimistic updates |
| Pagination | Range-based (`.range()`) | Supports page jumping; simpler than cursor-based |
| Batch ops | Single `.upsert()` call | Constitution forbids row loops |
| Duplicate handling | Client-side dedup pre-query + upsert mode switch | Avoids schema migration; handles both skip/update |
| Delete | Hard delete via `.delete()` | Sales FK is SET NULL; no soft delete needed |
| Detail page | Separate route `/domains/[id]` | Aligns with phase 1 structure; URL-shareable |
| Progress | Client-side row counter + determinate bar | Perceived performance during synchronous import |
| Forms | React Hook Form + Zod | Constitution-mandated; same pattern as Phase 1 |
| Import logs | Read-only JSONB detail expansion | Data already structured from import; no extra queries |
