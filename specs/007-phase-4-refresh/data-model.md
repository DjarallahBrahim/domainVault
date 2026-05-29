# Data Model: Phase 4 Refresh — Sales Analytics on Dashboard

**Date**: 2026-05-24

## Overview

No new entities. All data from existing `sales` and `domains` tables. This document
defines the query result shape and derived calculations.

## Entities

### Sale (Existing — Read Only)

| Field | Type | Used By |
|---|---|---|
| `id` | UUID | Leaderboard key |
| `user_id` | UUID | RLS filter |
| `domain_id` | UUID | JOIN to domains |
| `domain_name` | TEXT | Display |
| `sale_price` | DECIMAL(10,2) | Revenue chart, leaderboard, platform breakdown, ROI |
| `sold_at` | DATE | Revenue chart (month grouping), leaderboard (date display) |
| `buyer` | TEXT | Leaderboard detail |
| `platform` | TEXT | Platform breakdown |
| `notes` | TEXT | Leaderboard detail |

### Domain (Existing — Joined)

| Field | Type | Used By |
|---|---|---|
| `purchase_price` | DECIMAL(10,2) | ROI calculation (profit, ROI %) |
| `domain` | TEXT | Leaderboard display |
| `created_at` | TIMESTAMPTZ | Hold duration calculation |

## Query Result Shape

### `SalesAnalytics`

Returned by `fetchSalesAnalytics()`:

```typescript
interface SalesAnalyticsRow {
  id: string;
  domain: string;
  sale_price: number;
  purchase_price: number | null;
  sold_at: string;
  platform: string | null;
  buyer: string | null;
  notes: string | null;
  profit: number | null;
  created_at: string | null;
}

type SalesAnalytics = SalesAnalyticsRow[];
```

## Derived Calculations (Client-Side)

### Revenue Chart Data

```typescript
interface RevenueMonth {
  month: string;         // "Jan 2026"
  revenue: number;       // sum of sale_price
  count: number;         // number of sales
  cumulative: number;    // running total
}
```

Computed by grouping `SalesAnalyticsRow[]` by month, sorted ascending.

### Leaderboard

```typescript
interface LeaderboardEntry {
  rank: number;
  id: string;
  domain: string;
  sale_price: number;
  roi_pct: number | null;  // null if purchase_price missing
  sold_at: string;
  purchase_price: number | null;
  buyer: string | null;
  platform: string | null;
  profit: number | null;
  hold_days: number | null;
  created_at: string | null;
}
```

Sorted by `sale_price DESC` (default) or `roi_pct DESC` (Best ROI toggle).

ROI % = `((sale_price - purchase_price) / purchase_price) * 100`.

Hold duration = `diffDays(sold_at, created_at)`.

### Platform Breakdown

```typescript
interface PlatformBreakdown {
  platform: string;
  sales_count: number;
  total_revenue: number;
  avg_sale_price: number;
}
```

Grouped by `platform`, with `null` → "Other". Sorted by `total_revenue DESC`.

## RLS Policies

Existing policies unchanged:
- `CREATE POLICY "own sales" ON sales FOR ALL USING (auth.uid() = user_id);`
- `CREATE POLICY "own domains" ON domains FOR ALL USING (auth.uid() = user_id);`

All queries automatically scoped to the authenticated user.
