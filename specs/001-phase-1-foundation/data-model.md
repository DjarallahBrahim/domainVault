# Data Model: Phase 1 — Foundation

**Date**: 2026-05-21

## Overview

Phase 1 introduces the database schema for all three core tables and the Supabase
Auth user model. The schema matches `plan.md` §5 exactly — no deviations permitted.

## Entities

### User Account (Supabase `auth.users`)

Managed entirely by Supabase Auth. The application does not maintain a separate
`profiles` table in Phase 1. User metadata (avatar, display name) is derived from
the email address.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, referenced by all RLS policies |
| `email` | TEXT | Unique, used for login |
| `encrypted_password` | TEXT | Managed by Supabase Auth |
| `email_confirmed_at` | TIMESTAMPTZ | NULL until verified |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |

**Lifecycle states**: Unregistered → Registered (unverified) → Verified → (optional: Deleted)

### Domain (`public.domains`)

The core portfolio entity. Each domain belongs to exactly one user. The `tld` field is
a generated column (no manual insert). The `domain` field is unique per user.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `user_id` | UUID | FK → `auth.users(id)`, ON DELETE CASCADE, NOT NULL |
| `domain` | TEXT | NOT NULL, UNIQUE(user_id, domain) |
| `tld` | TEXT | GENERATED ALWAYS AS `split_part(domain, '.', -1)` STORED |
| `expiration_date` | DATE | NOT NULL |
| `purchase_price` | DECIMAL(10,2) | NULLABLE |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active','expired','sold','pending') |
| `registrar` | TEXT | NULLABLE |
| `notes` | TEXT | NULLABLE |
| `tags` | TEXT[] | NULLABLE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_domains_user_id`, `idx_domains_expiration`, `idx_domains_status`

**RLS Policy**: `CREATE POLICY "own domains" ON domains FOR ALL USING (auth.uid() = user_id)`

**State transitions**:
- `active` → `expired` (when expiration_date passes without renewal)
- `active` → `sold` (when a sale is logged, Phase 4)
- `active` → `pending` (manual status change)
- `pending` → `active` | `expired` | `sold`

### Sale (`public.sales`)

Records domain sales. References the domain via a nullable FK (sale persists even
if the domain record is deleted). Contains a denormalized `domain_name` for display
when the referenced domain is gone.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `user_id` | UUID | FK → `auth.users(id)`, ON DELETE CASCADE, NOT NULL |
| `domain_id` | UUID | FK → `domains(id)`, ON DELETE SET NULL |
| `domain_name` | TEXT | NOT NULL (denormalized for data resilience) |
| `sale_price` | DECIMAL(10,2) | NOT NULL |
| `sold_at` | DATE | NOT NULL |
| `buyer` | TEXT | NULLABLE |
| `platform` | TEXT | NULLABLE |
| `notes` | TEXT | NULLABLE |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_sales_user_id`, `idx_sales_sold_at`

**RLS Policy**: `CREATE POLICY "own sales" ON sales FOR ALL USING (auth.uid() = user_id)`

### Import Log (`public.import_logs`)

Audit trail for CSV imports. Stores summary stats and structured error details.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `user_id` | UUID | FK → `auth.users(id)`, ON DELETE CASCADE, NOT NULL |
| `filename` | TEXT | NOT NULL |
| `total_rows` | INT | NOT NULL |
| `imported` | INT | NOT NULL |
| `skipped` | INT | NOT NULL |
| `errors` | JSONB | NULLABLE (array of error objects) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

**RLS Policy**: `CREATE POLICY "own import_logs" ON import_logs FOR ALL USING (auth.uid() = user_id)`

## Entity Relationships

```
auth.users (1) ────< (N) domains
auth.users (1) ────< (N) sales
auth.users (1) ────< (N) import_logs
domains    (1) ────< (N) sales        [domain_id FK, ON DELETE SET NULL]
```

## Validation Rules

| Entity | Field | Rule |
|---|---|---|
| User Account | email | Valid email format, unique in system |
| User Account | password | Min 8 chars, at least 1 digit |
| Domain | domain | Non-empty, valid domain format (contains at least one `.`) |
| Domain | expiration_date | Valid date, not in the past for 'active' status |
| Domain | purchase_price | Non-negative decimal or NULL |
| Domain | status | Must be one of: active, expired, sold, pending |
| Domain | tags | Array of non-empty strings if present |
| Sale | sale_price | Positive decimal |
| Sale | sold_at | Valid date, not in the future |
| Import Log | total_rows | Non-negative integer |
| Import Log | imported | Non-negative integer, ≤ total_rows |
| Import Log | skipped | Non-negative integer, = total_rows - imported |

## Migration

The migration file `supabase/migrations/001_initial_schema.sql` contains:

1. `CREATE TABLE domains (...)` with generated `tld` column
2. `CREATE TABLE sales (...)` with FK to domains
3. `CREATE TABLE import_logs (...)`
4. All indexes per the schema above
5. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all three tables
6. RLS policies for all three tables
7. `CREATE OR REPLACE FUNCTION update_updated_at_column()` trigger for `domains.updated_at`

The migration is wrapped in idempotent checks (e.g., `DROP TABLE IF EXISTS` preceded
by a safety check, or `CREATE TABLE IF NOT EXISTS`). Running it against an existing
database with data is safe — it will not drop or modify existing tables.
