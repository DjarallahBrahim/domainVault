# Data Model: Phase 2 Refresh — Manual Domain Entry

**Date**: 2026-05-24

## Overview

No new database entities. The manual entry feature uses the existing `domains` table
from Phase 1. This document defines the form schema and validation rules for the
manual entry flow.

## Entities

### Domain (Existing — No Changes)

The `public.domains` table remains unchanged. Manual entries are inserted as new rows
with `status = 'active'` and `created_at = NOW()`.

| Column | Type | Manual Entry Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto-generated | `gen_random_uuid()` |
| `user_id` | UUID FK | Auth session | RLS enforces `auth.uid()` |
| `domain` | TEXT | Form input | Required; validated by Zod |
| `tld` | TEXT | Auto-derived | `GENERATED ALWAYS AS (split_part(domain, '.', -1)) STORED` |
| `expiration_date` | DATE | Form input | Required; date picker |
| `purchase_price` | DECIMAL(10,2) | Form input | Optional; non-negative |
| `status` | TEXT | Hardcoded `'active'` | All manual entries start as active |
| `registrar` | TEXT | Form input | Optional |
| `notes` | TEXT | Form input | Optional |
| `tags` | TEXT[] | Form input | Optional; comma-separated string parsed to array |
| `created_at` | TIMESTAMPTZ | Auto-generated | `NOW()` |
| `updated_at` | TIMESTAMPTZ | Auto-generated | Trigger `update_updated_at_column()` |

## Form Schema

### `manualEntrySchema` (Zod)

Derived from `csvRowSchema` but adapted for form `<input>` types:

```typescript
// Added to lib/validations/domain.ts

export const manualEntrySchema = z.object({
  domain: z
    .string()
    .min(1, "Domain name is required")
    .max(253, "Domain name exceeds 253 characters")
    .regex(/\./, "Domain must contain a dot")
    .regex(/^\S+$/, "Domain must not contain spaces"),
  expiration_date: z
    .string()
    .min(1, "Expiration date is required")
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  purchase_price: z
    .coerce
    .number()
    .min(0, "Price must be non-negative")
    .optional()
    .nullable(),
  registrar: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
```

### Key differences from `csvRowSchema`:
- `purchase_price` uses `z.coerce.number()` instead of string validation (form input
  is a number type, not a string from CSV)
- `expiration_date` uses `Date.parse()` validation instead of the `isValidDate()`
  helper (form date input always produces ISO format strings)
- No `parseDate()` needed — the `<input type="date">` value is already `YYYY-MM-DD`

## Validation Rules (Shared with CSV Import)

| Rule | Source | Error Message |
|---|---|---|
| Domain required | `csvRowSchema` / `manualEntrySchema` | "Domain name is required" |
| Domain max 253 chars | `csvRowSchema` / `manualEntrySchema` | "Domain name exceeds 253 characters" |
| Domain must contain dot | `csvRowSchema` / `manualEntrySchema` | "Domain must contain a dot" |
| Domain no spaces | `csvRowSchema` / `manualEntrySchema` | "Domain must not contain spaces" |
| Expiration date required | `csvRowSchema` / `manualEntrySchema` | "Expiration date is required" |
| Expiration date valid | `csvRowSchema` / `manualEntrySchema` | "Invalid date" |
| Price non-negative | `csvRowSchema` / `manualEntrySchema` | "Price must be non-negative" |
| Domain not duplicate | `insertSingleDomain()` pre-check | "Domain already exists in your portfolio" |

## State Transitions

```
[Form Open] → [User fills fields] → [Validate (Zod)] →
  ├─ Fail → [Inline errors shown; form stays open]
  └─ Pass → [Check duplicate via .ilike()] →
       ├─ Duplicate → [Inline error "Domain already exists"; form stays open]
       └─ Unique → [Insert row] → [Invalidate cache] → [Toast "Domain added"] → [Close dialog]
```

## Relationships

- **Domain → User**: Many-to-one via `user_id` FK → `auth.users(id)`. RLS enforces.
- **Domain → Sale**: One-to-many via `domain_id` FK on `sales.domain_id`.
  ON DELETE SET NULL preserves sale records when domain is deleted.
- No new relationships introduced by this feature.
