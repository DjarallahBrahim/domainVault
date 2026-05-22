# Data Model: Phase 2 — CSV Import & Domain Management

**Date**: 2026-05-22

## Overview

Phase 2 builds on the Phase 1 database schema (domains, import_logs tables with RLS).
This document defines the Phase 2-specific validation rules, Zod schemas, spreadsheet
column mapping, and business logic rules. The underlying PostgreSQL schema, indexes,
and RLS policies are unchanged from Phase 1 — see `specs/001-phase-1-foundation/data-model.md`
and `supabase/migrations/001_initial_schema.sql` for the DDL.

## Entities (from Phase 1)

### Domain (`public.domains`)

| Column | Type | Phase 2 Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → auth.users | Set by RLS; never client-supplied |
| `domain` | TEXT NOT NULL, UNIQUE(user_id, domain) | Immutable after creation; stored with original casing from CSV |
| `tld` | TEXT GENERATED | Auto-derived from domain via `split_part(domain, '.', -1)` |
| `expiration_date` | DATE NOT NULL | Required in CSV; must be a valid parseable date |
| `purchase_price` | DECIMAL(10,2) NULLABLE | Optional; must be ≥ 0 if provided |
| `status` | TEXT DEFAULT 'active' | One of: active, expired, sold, pending |
| `registrar` | TEXT NULLABLE | Optional; free-text |
| `notes` | TEXT NULLABLE | Optional; free-text |
| `tags` | TEXT[] NULLABLE | Optional; comma-separated in CSV |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | Auto-set |
| `updated_at` | TIMESTAMPTZ DEFAULT NOW() | Auto-updated via trigger |

**Indexes** (from Phase 1): `idx_domains_user_id`, `idx_domains_expiration`, `idx_domains_status`

**RLS** (from Phase 1): `CREATE POLICY "own domains" ON domains FOR ALL USING (auth.uid() = user_id)`

### Import Log (`public.import_logs`)

| Column | Type | Phase 2 Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → auth.users | Set by RLS; never client-supplied |
| `filename` | TEXT NOT NULL | Original CSV filename |
| `total_rows` | INT NOT NULL | Total data rows in CSV (excluding header) |
| `imported` | INT NOT NULL | New domains created |
| `skipped` | INT NOT NULL | Existing domains matched (skip or update) |
| `errors` | JSONB NULLABLE | Array of `{row, field, message}` objects |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | Auto-set |

**RLS** (from Phase 1): `CREATE POLICY "own import_logs" ON import_logs FOR ALL USING (auth.uid() = user_id)`

---

## CSV Import Schema

### Column Mapping

CSV headers are matched case-insensitively with whitespace trimming. The canonical
names are:

| CSV Header | Required | Field in `domains` | Type | Validation |
|---|---|---|---|---|
| `domain` | Yes | `domain` | string | Non-empty, contains `.`, no spaces, ≤ 253 chars |
| `expiration_date` | Yes | `expiration_date` | date | Parseable date (ISO 8601, MM/DD/YYYY, DD/MM/YYYY) |
| `purchase_price` | No | `purchase_price` | decimal | Non-negative number; blank = NULL |
| `registrar` | No | `registrar` | string | Free-text; blank = NULL |
| `notes` | No | `notes` | string | Free-text; blank = NULL |
| `tags` | No | `tags` | text[] | Comma-separated; blank = NULL |

**Unknown headers** are silently ignored (no error).

**Missing required headers**: If `domain` or `expiration_date` column is missing,
the entire import is rejected before any rows are processed.

### CSV Row Validation (Zod)

```typescript
const csvRowSchema = z.object({
  domain: z.string()
    .min(1, "Domain name is required")
    .max(253, "Domain name exceeds 253 characters")
    .regex(/\./, "Domain must contain a dot")
    .regex(/^[^\s]+$/, "Domain must not contain spaces"),
  expiration_date: z.string()
    .min(1, "Expiration date is required")
    .refine(isValidDate, "Invalid date format"),
  purchase_price: z.string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Price must be a non-negative number"),
  registrar: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});
```

**Date parsing logic**:
1. Try ISO 8601: `YYYY-MM-DD`
2. Try US format: `MM/DD/YYYY`
3. Try EU format: `DD/MM/YYYY` (ambiguous: only attempt if MM > 12 in US parse)
4. Reject if none parse to a valid `Date`

### Duplicate Detection

Before batch upsert:
1. Collect all normalized domain names from CSV: `normalized = domain.trim().toLowerCase()`
2. Query existing domains: `SELECT domain FROM domains WHERE user_id = $uid AND LOWER(domain) IN ($normalized)`
3. For each match:
   - **Skip mode**: Remove from upsert batch, count as skipped
   - **Update mode**: Keep in upsert batch with `onConflict` to overwrite fields
4. Domains not matched are always inserted

---

## Domain Edit Schema (Zod)

```typescript
const domainEditSchema = z.object({
  status: z.enum(['active', 'expired', 'sold', 'pending']),
  registrar: z.string().optional().nullable(),
  purchase_price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string().min(1)).optional().nullable(),
});

type DomainEdit = z.infer<typeof domainEditSchema>;
```

**Note**: `domain` and `tld` are NOT in the edit schema — they are immutable per FR-017/FR-018.

**Tags transformation**: A comma-separated string is split, trimmed, and filtered (removing empty strings) to produce `string[]`. Stored as PostgreSQL `TEXT[]` array.

---

## Domain Filter Schema

```typescript
const domainFiltersSchema = z.object({
  status: z.enum(['active', 'expired', 'sold', 'pending']).optional(),
  tld: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['domain', 'expiration_date', 'status']).optional().default('expiration_date'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.number().int().positive().optional().default(1),
});

type DomainFilters = z.infer<typeof domainFiltersSchema>;
```

**Search behavior**: Case-insensitive substring match on domain name. Example query:
```sql
WHERE LOWER(domain) LIKE '%' || LOWER($search_term) || '%'
```

---

## Entity Relationships (unchanged from Phase 1)

```
auth.users (1) ────< (N) domains
auth.users (1) ────< (N) import_logs
domains    (1) ────< (N) sales          [Phase 4, schema already exists]
```

---

## State Transitions

### Domain Status

```
                  ┌──────────┐
                  │  active  │──── (user edits) ────┐
                  └────┬─────┘                       │
                       │                             ▼
              (date passes)                    ┌──────────┐
                       │                       │ pending  │
                       ▼                       └────┬─────┘
                  ┌──────────┐                     │
                  │ expired  │◄─── (user edits) ────┤
                  └──────────┘                     │
                                                   ▼
                  ┌──────────┐
                  │   sold   │◄─── (user edits) ────┘
                  └──────────┘
```

**Note**: Auto-transition from `active` → `expired` based on `expiration_date` is
out of scope for Phase 2 (deferred to Phase 3 dashboard). Status changes in Phase 2
are entirely manual via edit or CSV update.

### Import Log

Import logs are **immutable** after creation. No state transitions. Created once
during import and never modified.

---

## Data Volume Assumptions

| Metric | Value |
|---|---|
| Max domains per user | No hard limit (constrained by 50k/file cap + performance) |
| Max CSV file size | 10 MB (~50k rows typical) |
| Max CSV rows per import | 50,000 (file size cap) |
| Pagination page size | 50 domains |
| Max bulk delete | 50 domains |
| Import log history display | Last 50 logs |
| Search scope | All domains for the user (no pagination limit on search) |
