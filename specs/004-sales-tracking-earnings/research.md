# Research: Phase 4 — Sales Tracking & Earnings

**Date**: 2026-05-22

## Overview

Phase 4 introduces three new patterns:
1. **Cross-table mutations** — creating a sale also updates domain status
2. **Computed earnings summary** — aggregate calculations from sales data
3. **Domain auto-association** — case-insensitive lookup on sale creation

All patterns follow existing Phase 2 conventions (TanStack Query, typed helpers, Zod).

---

## 1. Sale Create Flow (Cross-Table Mutation)

### Decision: Two-step Supabase call with Zod validation

**Rationale**: Creating a sale involves: (1) lookup domain by name (case-insensitive),
(2) insert sale row, (3) update domain status to "sold". These are executed
sequentially in the mutation function — no transaction needed at this scale.

**Flow**:
```
User submits form → Zod validation → client-side mutation:
  1. Query: SELECT id, status FROM domains WHERE LOWER(domain) = LOWER($name)
  2. If found: warn if status is 'expired' (FR-007 clarification), warn if 'sold' already (FR-008)
  3. INSERT INTO sales (domain_id, domain_name, sale_price, sold_at, buyer, platform, notes)
  4. If found: UPDATE domains SET status = 'sold' WHERE id = $domain_id
  5. Invalidate TanStack Query caches for sales + domains
  6. Toast success
```

**Domain status change behavior**:
- Domain found (active): auto-associate + status → "sold"
- Domain found (expired): warn + confirm + auto-associate + status → "sold"
- Domain found (sold): warn + allow + new sale recorded (status stays "sold")
- Domain found (pending): auto-associate + status → "sold"
- Domain not found: sale recorded as external (domain_id = null), no status change

---

## 2. Earnings Summary

### Decision: Server-side aggregation in sales query helper

**Rationale**: The earnings summary (total count, total revenue, average, highest)
is computed from the user's sales. For simplicity, fetch all sales and compute
client-side (same pattern as dashboard aggregates in Phase 3).

```typescript
const totalRevenue = sales.reduce((sum, s) => sum + s.sale_price, 0);
const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
const highestSale = sales.length > 0 ? Math.max(...sales.map(s => s.sale_price)) : 0;
```

When a date range filter is active, only filtered sales contribute to the summary.

**Alternative**: Supabase `.select("sale_price")` + server-sum — more efficient for
large datasets but requires an extra query. For single-user scale, client-side is fine.

---

## 3. Sale Delete with Domain Status Revert

### Decision: Count remaining sales for domain before reverting status

**Flow**:
```
User confirms delete →
  1. DELETE FROM sales WHERE id = $id
  2. Query: SELECT COUNT(*) FROM sales WHERE domain_id = $domain_id
  3. If count = 0: UPDATE domains SET status = 'active' WHERE id = $domain_id
  4. Invalidate caches + toast
```

Only revert to "active" if NO other sales exist for that domain. If other sales exist,
the domain stays "sold" (it was sold at least once).

---

## 4. Domain Name Auto-Association

### Decision: Case-insensitive server-side lookup

**Pattern** (same as Phase 2 duplicate detection):

```typescript
const normalized = domainName.trim().toLowerCase();
const { data } = await supabase
  .from("domains")
  .select("id, status")
  .ilike("domain", normalized);
```

If exactly one match → auto-associate. If zero → external sale. If multiple (unlikely
due to UNIQUE constraint) → use first match.

**On edit**: When a sale's domain name is edited (FR-014), re-run association lookup.
If the new name matches a different domain: revert old domain's status (if it was the
last sale), associate with new domain, set new domain status to "sold."

---

## 5. Sales List Pagination & Sorting

### Decision: Same pattern as domain list (Phase 2)

- Range-based pagination via Supabase `.range(0, 49)`
- Sort by `sold_at` (default DESC) or `sale_price`
- Date range filter: `.gte("sold_at", startDate)` and `.lte("sold_at", endDate)`
- URL search params for shareable filtered views

---

## 6. No New Dependencies

Phase 4 uses only existing dependencies: React Hook Form, Zod, TanStack Query,
date-fns, shadcn/ui. No new packages needed.

---

## Summary of Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Sale create | Two-step mutation (lookup + insert + update) | Simple; no transaction needed |
| Earnings summary | Client-side reduce on sales array | Same pattern as Phase 3 dashboard |
| Delete revert | Count remaining sales; revert if zero | Accurate; prevents false reversions |
| Auto-association | Case-insensitive `.ilike()` lookup | Consistent with Phase 2 search/dedup |
| Pagination | Range-based `.range()` + URL params | Same pattern as domain list |
