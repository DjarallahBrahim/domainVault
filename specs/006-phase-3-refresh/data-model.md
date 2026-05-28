# Data Model: Phase 3 Refresh — Dashboard & Analytics

**Date**: 2026-05-24

## Overview

One new entity: **Promotion**. The `promotions` table is created via Migration 002.
A new index on `domains.registrar` via Migration 003. No changes to existing tables.

## Entities

### Promotion [NEW]

The `public.promotions` table tracks weekly promotion batches.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto-generated | `gen_random_uuid()` |
| `user_id` | UUID FK | Auth session | RLS: `auth.uid() = user_id` |
| `domain_id` | UUID FK | Selected domain | `REFERENCES domains(id) ON DELETE CASCADE` |
| `week_start` | DATE | `DATE_TRUNC('week', CURRENT_DATE)` | Monday of the ISO week |
| `promoted_at` | TIMESTAMPTZ | User action | NULL = pending; set to NOW() on confirm |

**Constraints**:
- `UNIQUE(user_id, domain_id, week_start)` — a domain can only be promoted once per week.

**Indexes**:
- `idx_promotions_user_week ON promotions(user_id, week_start)` — speeds up batch lookup.

**RLS Policy**:
- `CREATE POLICY "own promotions" ON promotions FOR ALL USING (auth.uid() = user_id);`

**State transitions**:
```
[NULL] → user clicks "Promote" → [inline confirm shown] →
  ├─ Yes → [promoted_at = NOW()]
  └─ Cancel → [NULL, confirm collapsed]
```

### Domain (Existing — New Index)

New index added via Migration 003:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domains_registrar ON domains(registrar);
```

This speeds up the registrar breakdown chart query.

## Dashboard Query Results

### Stats Summary (Query 1)

```typescript
interface DashboardStats {
  total_active: number;
  portfolio_value: number;
  expiring_90d: number;
  expiring_30d: number;
  sold_this_year: number;
}
```

### Donut Segments (Query 2)

```typescript
interface ExpirySegments {
  exp_1m: number;  // ≤1 month
  exp_3m: number;  // 1–3 months
  exp_6m: number;  // 3–6 months
  exp_9m: number;  // 6–9 months
}
```

### Registrar Breakdown (Query 3)

```typescript
interface RegistrarBreakdown {
  registrar: string;  // "Unknown" if null
  domain_count: number;
}

// Returned as array, sorted desc, top 10
```

### Promotions (Query 4)

```typescript
interface PromotionRow {
  id: string;
  user_id: string;
  domain_id: string;
  week_start: string;
  promoted_at: string | null;
  // Joined fields from domains
  domain: string;
  registrar: string | null;
  expiration_date: string;
}
```

## Promotion Pool Parameters

| Pool Option | Filter |
|---|---|
| Expiring in 1 month | `status = 'active' AND expiration_date <= NOW() + INTERVAL '1 month'` |
| Expiring in 3 months | `status = 'active' AND expiration_date <= NOW() + INTERVAL '3 months'` |
| Expiring in 6 months | `status = 'active' AND expiration_date <= NOW() + INTERVAL '6 months'` |
| Expiring in 9 months | `status = 'active' AND expiration_date <= NOW() + INTERVAL '9 months'` |
| All active domains | `status = 'active'` |

Default: Expiring in 3 months. Count must be ≥10 to generate a full batch.
