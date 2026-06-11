# Data Model: Spaceship SellerHub Integration

**Date**: 2026-06-08

## Modified Tables

### user_settings (new columns)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `spaceship_api_key` | TEXT | NULLABLE | Spaceship API Key |
| `spaceship_api_secret` | TEXT | NULLABLE | Spaceship API Secret (plain text, RLS-protected) |

**Migration**: `ALTER TABLE user_settings ADD COLUMN spaceship_api_key TEXT, ADD COLUMN spaceship_api_secret TEXT`

## New Tables

### spaceship_listings

Write-through cache of Spaceship SellerHub listing data. One row per listed domain per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE, NOT NULL | Owning user |
| `domain_id` | UUID | FK → domains(id), ON DELETE CASCADE, NOT NULL, UNIQUE | Referenced domain |
| `domain_name` | TEXT | NOT NULL | Domain name (denormalized) |
| `spaceship_domain_id` | TEXT | NULLABLE | Spaceship's internal ID for this listing |
| `spaceship_price` | DECIMAL(10,2) | NOT NULL | Asking price on Spaceship |
| `spaceship_currency` | TEXT | NOT NULL, DEFAULT 'USD' | Currency code (e.g., USD, EUR, GBP) |
| `last_synced_at` | TIMESTAMPTZ | DEFAULT NOW() | Last sync timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_spaceship_listings_user_id ON spaceship_listings(user_id)`
- `idx_spaceship_listings_domain_id ON spaceship_listings(domain_id)`

**RLS**: `CREATE POLICY "own spaceship_listings" ON spaceship_listings FOR ALL USING (auth.uid() = user_id)`

**Cascade**: `ON DELETE CASCADE` on `domain_id` — deleting a domain removes its listing cache.

## Entity Relationships

```
auth.users (1) ────< (1) user_settings
     │                  ├── sedo_partner_id, sedo_signkey, sedo_username, sedo_password
     │                  ├── spaceship_api_key, spaceship_api_secret
     │
     └───< (0..*) domains
              │
              ├── bin (optional, shared across platforms)
              │
              ├───< (0..1) sedo_listings
              │
              └───< (0..1) spaceship_listings
```

## State Transitions

### Spaceship Listing Cell States

```
State A: Not Listed (no cache row)
  └── create → Spaceship API + cache upsert → State B

State B: Listed (spaceship_listings row exists)
  ├── edit → Spaceship API + cache upsert → State B (updated)
  ├── remove → Spaceship API delete + cache delete → State A
  └── external delist (sync detects missing) → cache delete → State A
```

### Per-Domain Sync States

```
click ↻ on any domain
  ├── Spaceship API GET returns listing → upsert/update cache → cell shows price
  └── Spaceship API returns 404 or empty → delete cache if exists → cell shows "Not Listed"
```
