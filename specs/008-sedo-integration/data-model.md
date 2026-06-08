# Data Model: Sedo Integration

**Date**: 2026-06-08

## New Tables

### user_settings

Per-user settings and third-party API credentials. One row per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE, UNIQUE | Owning user |
| `sedo_partner_id` | INTEGER | NULLABLE | Sedo Partner ID |
| `sedo_signkey` | TEXT | NULLABLE | Sedo Sign Key |
| `sedo_username` | TEXT | CHECK (char_length ≤ 25), NULLABLE | Sedo login username |
| `sedo_password` | TEXT | CHECK (char_length ≤ 16), NULLABLE | Sedo login password (plain text, RLS-protected) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**RLS**: `CREATE POLICY "own settings" ON user_settings FOR ALL USING (auth.uid() = user_id)`

**Notes**: Password stored as plain text behind RLS — acceptable per constitution Principle I (Third-party API credential storage). Upgrade path: `pgcrypto` column-level encryption later.

### sedo_listings

Write-through cache of Sedo listing data. One row per listed domain per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE, NOT NULL | Owning user |
| `domain_id` | UUID | FK → domains(id), ON DELETE CASCADE, NOT NULL, UNIQUE | Referenced domain |
| `domain_name` | TEXT | NOT NULL | Domain name (denormalized for display) |
| `sedo_price` | DECIMAL(10,2) | NOT NULL | Asking price on Sedo |
| `sedo_minprice` | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Minimum offer on Sedo |
| `sedo_fixedprice` | INTEGER | NOT NULL, DEFAULT 1 | 1 = Fixed, 0 = Negotiable |
| `sedo_currency` | INTEGER | NOT NULL, DEFAULT 1 | Currency code (always 1 = USD) |
| `sedo_forsale` | INTEGER | NOT NULL, DEFAULT 1 | 1 = For sale, 0 = Not for sale |
| `last_synced_at` | TIMESTAMPTZ | DEFAULT NOW() | Last time this row was synced with Sedo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_sedo_listings_user_id ON sedo_listings(user_id)` — fast per-user cache reads
- `idx_sedo_listings_domain_id ON sedo_listings(domain_id)` — fast domain-level lookups

**RLS**: `CREATE POLICY "own sedo_listings" ON sedo_listings FOR ALL USING (auth.uid() = user_id)`

**Cascade**: `ON DELETE CASCADE` on `domain_id` — when a domain is deleted, its cache row is automatically removed.

## Modified Tables

### domains (new column)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `bin` | DECIMAL(10,2) | NULLABLE | User's desired Buy-It-Now / asking price. Distinct from `purchase_price` (what they paid) and `sedo_listings.sedo_price` (active listing price on Sedo). |

**Note**: `bin` is the user's desired price for any marketplace listing (not Sedo-specific). It serves as the default asking price in the Sedo overlay and is saved back when the user lists a domain without a prior `bin`.

## Entity Relationships

```
auth.users (1) ────< (1) user_settings
     │
     └───< (0..*) domains
              │
              ├── bin (optional)
              │
              └───< (0..1) sedo_listings (one listing per domain)
```

- A user has exactly one `user_settings` row (created on first save).
- A domain has zero or one `sedo_listings` rows (UNIQUE on domain_id).
- Deleting a domain cascade-deletes its `sedo_listings` row.

## State Transitions

### Sedo Listing Cell States

```
State A: Not Listed (undefined)
  └── create → Sedo API + cache upsert → State B

State B: Listed (sedo_listings row exists)
  ├── edit → Sedo API + cache upsert → State B (updated)
  ├── remove → Sedo API delete + cache delete → State A
  └── external delist (sync detects missing) → cache delete → State A
```
