# Data Model: Phase 4 — Sales Tracking & Earnings

**Date**: 2026-05-22

## Overview

Phase 4 uses the existing `sales` table from the Phase 1 migration. No new tables or
columns are needed. This document defines the Phase 4 validation rules, Zod schemas,
and business logic for sales operations.

---

## Entity: Sale (`public.sales`)

| Column | Type | Phase 4 Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → auth.users | Set by RLS; never client-supplied |
| `domain_id` | UUID FK → domains(id) NULLABLE | Auto-associated on create; SET NULL on domain delete |
| `domain_name` | TEXT NOT NULL | Stored as-provided (original casing); denormalized for resilience |
| `sale_price` | DECIMAL(10,2) NOT NULL | Must be positive (> 0) |
| `sold_at` | DATE NOT NULL | Must not be in the future |
| `buyer` | TEXT NULLABLE | Optional free-text |
| `platform` | TEXT NULLABLE | Optional free-text (e.g., "Afternic", "Sedo", "Private") |
| `notes` | TEXT NULLABLE | Optional free-text |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | Auto-set |

**Indexes** (from Phase 1): `idx_sales_user_id`, `idx_sales_sold_at`

**RLS** (from Phase 1): `CREATE POLICY "own sales" ON sales FOR ALL USING (auth.uid() = user_id)`

---

## Zod Validation Schemas

### Sale Create/Edit Schema

```typescript
const saleFormSchema = z.object({
  domain_name: z.string().min(1, "Domain name is required"),
  sale_price: z.coerce.number()
    .positive("Sale price must be greater than zero"),
  sold_at: z.string()
    .min(1, "Sale date is required")
    .refine((v) => new Date(v) <= new Date(), "Sale date cannot be in the future"),
  buyer: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
```

---

## Domain ↔ Sale Relationship

```
domains (1) ────< (N) sales   [domain_id FK, ON DELETE SET NULL]
```

**Lifecycle rules**:
1. **Sale created** → if `domain_id` is set: domain status → "sold"
2. **Sale deleted** → if domain has 0 remaining sales: domain status → "active"
3. **Domain deleted** → sale persists with `domain_id = NULL`, `domain_name` preserved
4. **Sale domain_name edited** → re-associate: old domain may revert, new domain → "sold"

---

## State Transitions

### Domain Status (with Sales)

```
active ── (sale logged) ──────► sold
  ▲                              │
  │    (last sale deleted)       │ (more sales exist)
  └──────────────────────────────┘
```

### Sale

```
created ── (edited) ──► updated
   │
   └── (deleted) ──► removed
```

Sales are permanently deleted on user confirmation — no soft delete.

---

## Earnings Summary (Computed)

| Metric | Computation |
|---|---|
| Total Sales Count | `sales.length` |
| Total Revenue | `SUM(sale_price)` |
| Average Sale Price | `totalRevenue / count` (0 if no sales) |
| Highest Sale | `MAX(sale_price)` (0 if no sales) |

When date range filter is active, only sales within the range contribute.

---

## Data Volume Assumptions

| Metric | Value |
|---|---|
| Max sales per user | No hard limit |
| Pagination page size | 50 sales |
| Sales list fetch | All user sales (tenant isolation via RLS) |
| Date range filter | Custom start + end dates |
