# Data Model: Phase 3 — Dashboard & Analytics

**Date**: 2026-05-22

## Overview

Phase 3 is a read-only analytics layer on top of the existing `domains` table
(created in Phase 1). No new database tables, columns, or migrations are needed.
All dashboard data is computed via server-side queries and client-side aggregations
derived from the user's domain rows.

---

## Derived Entities (Computed Views)

### Dashboard Summary

Not stored — computed on demand from the user's domains.

| Metric | Computation | Source Field(s) |
|---|---|---|
| Total Domains | `COUNT(*)` | All domains for user |
| Active Domains | `COUNT(*) WHERE status = 'active'` | `domains.status` |
| Expiring Soon (≤30d) | `COUNT(*) WHERE status = 'active' AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30` | `domains.status`, `domains.expiration_date` |
| Portfolio Value | `SUM(purchase_price) WHERE purchase_price > 0` | `domains.purchase_price` |

### Expiration Timeline

Computed by grouping future-expiring domains into monthly buckets for the next 12 months.

| Field | Computation |
|---|---|
| Month label | Derived from `expiration_date` — e.g., "Jun 2026", "Jul 2026" |
| Domain count | `COUNT(*)` per calendar month |
| Data source | All domains for user with `expiration_date >= CURRENT_DATE` |

**Edge case**: Domains expiring >12 months out are excluded from the timeline chart
but still counted in total/active summary cards.

### TLD Distribution

Computed by grouping domains by TLD.

| Field | Computation |
|---|---|
| TLD | `domains.tld` |
| Count | `COUNT(*)` per TLD |
| Total Value | `SUM(purchase_price) WHERE purchase_price > 0` per TLD |

**Grouping rule**: TLDs with fewer than 3 domains are merged into an "Other" category
for chart display per FR-015. The raw per-TLD data is still available in summary cards.

### Expiring Soon Table

A filtered subset of domains expiring within 90 days.

| Column | Source |
|---|---|
| Domain name | `domains.domain` |
| TLD | `domains.tld` |
| Expiration date | `domains.expiration_date` |
| Days remaining | Computed: `expiration_date - CURRENT_DATE` |
| Status badge | `domains.status` |

**Filter**: `status = 'active' AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 90`

**Sort**: `expiration_date ASC`

### Expired Domains Section

A filtered subset of domains that are already expired.

| Column | Source |
|---|---|
| Domain name | `domains.domain` |
| Days since expiry | Computed: `CURRENT_DATE - expiration_date` |

**Filter**: `status IN ('expired', 'active') AND expiration_date < CURRENT_DATE`

**Note**: After auto-transition runs, no domains should have `status = 'active' AND expiration_date < CURRENT_DATE`.

---

## Query Functions

All dashboard query functions live in `lib/supabase/queries/dashboard.ts` and
use the server Supabase client (`createServerClient`).

### `autoTransitionExpired()`

```typescript
// Runs before fetching dashboard data
UPDATE domains
SET status = 'expired'
WHERE user_id = $uid
  AND status = 'active'
  AND expiration_date < CURRENT_DATE::date
```

Returns: number of rows updated (for logging/debugging).

### `fetchDashboardData()`

Returns all dashboard data in a single aggregated response:

```typescript
{
  summary: {
    total: number;
    active: number;
    expiringSoon: number;
    portfolioValue: number;
  },
  domains: DomainRow[],        // All domains (used for client-side chart aggregation)
  expiringSoon: DomainRow[],   // ≤90 day expiring (sorted ASC)
  expired: DomainRow[],        // Already expired
}
```

---

## State Transitions

### Domain Status (Auto-Transition)

```
active ───── (expiration_date < today) ────► expired
                                              (automatic, idempotent)
```

**Trigger**: Dashboard page load (server component)
**Scope**: Only domains with `status = 'active'`
**Idempotency**: `WHERE status = 'active' AND expiration_date < CURRENT_DATE` ensures
only qualifying rows are updated, and running it again finds zero rows.

**Not affected**: Domains with status `expired`, `sold`, or `pending` — these are
never auto-transitioned regardless of expiration date.

---

## Data Volume Assumptions

| Metric | Value |
|---|---|
| Max domains per user | 50,000 (per Phase 2 file cap) |
| Domains fetched for dashboard | All user domains (single query) |
| Chart TLD groups | Up to 20 distinct TLDs + "Other" |
| Expiration timeline months | 12 (current month + 11 future) |
| Expiring soon table rows | Variable (0 to all active domains) |
| Aggregate computation time | <500ms for 50k domains (client-side Map/Reduce) |
