# Quickstart: Phase 3 Refresh — Dashboard & Analytics

**Audience**: Developers verifying the redesigned dashboard after implementation.

## Prerequisites

- Phase 1 & Phase 2 fully implemented
- Supabase project provisioned
- At least one verified user account with domains and sales data

## Step 1: Apply Migrations

```bash
# Apply migration 002 (promotions table)
npx supabase db push

# Or manually run the SQL:
# supabase/migrations/002_promotions.sql
# supabase/migrations/003_registrar_index.sql

# Regenerate types
npm run types:generate
```

## Step 2: Delete Deprecated Components

```bash
# Remove v1 components:
rm components/dashboard/dashboard-timeline-chart.tsx
rm components/dashboard/dashboard-tld-chart.tsx
# Remove any 6-month toggle variant or associated queries
```

## Step 3: Build & Deploy

```bash
npm run dev        # Start dev server
npm run typecheck  # Zero TS errors required
npm run lint       # Zero ESLint warnings required
npm run build      # Clean Vercel build
```

## Verification Checklist

### 1. KPI Cards (US-013)

- [ ] 4 cards render: Total Domains, Portfolio Value, Expiring in 90 Days, Sold This Year.
- [ ] Values are correct for the authenticated user's portfolio.
- [ ] Hover: card lifts with shadow transition.
- [ ] Click: Total Domains → `/domains`.
- [ ] Click: Expiring in 90 Days → `/domains?expiry=3m`.
- [ ] Click: Sold This Year → `/sales`.
- [ ] Loading: skeleton cards shown while data fetches.
- [ ] Each card has an icon and colored accent stripe on left border.

### 2. Expiry Donut Chart (US-014)

- [ ] 4 segments with correct colors: red (≤1m), amber (≤3m), yellow (≤6m), green (≤9m).
- [ ] Counts are non-overlapping (a domain in ≤1m is NOT counted in ≤3m).
- [ ] Center of donut shows total active domain count.
- [ ] Legend shows each segment with color swatch, label, count, percentage.
- [ ] Hover: segment brightens; tooltip lists domain names and expiry dates.
- [ ] Click: segment → `/domains?expiry=1m` (or `3m`, `6m`, `9m`).
- [ ] Empty state: "No expiring domains — your portfolio is in great shape."

### 3. Registrar Breakdown Chart (US-015)

- [ ] Horizontal bar chart with top 10 registrars sorted by count descending.
- [ ] Bar color: accent-primary with opacity gradient.
- [ ] Hover: tooltip shows registrar name, count, % of portfolio.
- [ ] Click: bar → `/domains?registrar=<name>`.
- [ ] "Unknown" bar for domains with null/empty registrar.
- [ ] Empty state if no registrar data.

### 4. Critical Renewals Panel (US-016)

- [ ] Up to 10 domains expiring within 30 days, sorted by days remaining ascending.
- [ ] Each row shows days-remaining badge.
- [ ] "Mark as Renewed": click → inline date picker → select date → save.
- [ ] Updated domain disappears from panel (if new date >30 days out).
- [ ] "All clear" message when no domains expire within 30 days.
- [ ] "View All" → `/domains?expiry=1m`.

### 5. Promotion Table (US-017)

- [ ] Widget renders "Domains to Promote This Week".
- [ ] Default pool: active domains expiring within 3 months.
- [ ] 10 domains shown with columns: Domain, Registrar, Expiration Date, Days Until Expiry, Promoted?
- [ ] Pool dropdown: Expiring in 1m/3m/6m/9m/All active.
- [ ] Change pool → batch re-generates.
- [ ] "Promote" button per row.
- [ ] Click "Promote" → inline confirmation bar: "✓ Mark as promoted? [Yes] [Cancel]".
- [ ] Click "Yes" → green "Promoted ✓" badge, button disappears.
- [ ] Click "Cancel" → confirmation collapses, row returns to normal.
- [ ] Already-promoted domains show "Promoted ✓" badge (no button).
- [ ] Reload page → same batch for the current week.
- [ ] Empty state: "Not enough active domains to fill a promotion list."

### 6. Portfolio Value Chart (US-018)

- [ ] Existing area chart renders unchanged.
- [ ] Toggle: 12 months / all time.
- [ ] Tooltip: date, count, total value.

### 7. Quick Stats Widget (US-019)

- [ ] Desktop (≥1024px): right column sidebar.
- [ ] Mobile (<1024px): horizontal scroll chips.
- [ ] Stats include: Average price, Most common Registrar, Oldest domain, Newest domain, Total expired, Total earnings.
- [ ] "Most common Registrar" shown (NOT "Most common TLD").

### 8. Responsive Layout

- [ ] Desktop ≥1024px: 2-column layout per master plan diagram.
- [ ] Tablet 768–1023px: single column, all sections stacked.
- [ ] Mobile <768px: stacked cards, simplified chart variants.

### 9. Performance

- [ ] Dashboard load <2 seconds.
- [ ] No more than 4 Supabase queries per render (check Network tab).
- [ ] Charts animate in smoothly (no jank).

### 10. No Regressions

- [ ] Sidebar navigation still works.
- [ ] All other dashboard routes functional.
- [ ] Existing sales page unaffected.
- [ ] Domain list page unaffected.

## Files Changed Summary

| File | Change | Story |
|---|---|---|
| `dashboard-timeline-chart.tsx` | **DELETED** | v1 removal |
| `dashboard-tld-chart.tsx` | **DELETED** | v1 removal |
| `dashboard-value-chart.tsx` v1 variant | **DELETED** | v1 removal |
| `dashboard-kpi-cards.tsx` | **UPDATED** | US-013 |
| `dashboard-expiry-donut.tsx` | **NEW** | US-014 |
| `dashboard-registrar-chart.tsx` | **NEW** | US-015 |
| `dashboard-critical-renewals.tsx` | **UPDATED** | US-016 |
| `dashboard-promotion-table.tsx` | **NEW** | US-017 |
| `dashboard-quick-stats.tsx` | **UPDATED** | US-019 |
| `dashboard-client.tsx` | **NEW** | All |
| `dashboard/page.tsx` | **UPDATED** | All |
| `dashboard.ts` (queries) | **UPDATED** | All |
| `dashboard-client.ts` (queries) | **NEW** | US-017 |
| `002_promotions.sql` | **NEW** | Migration |
| `003_registrar_index.sql` | **NEW** | Migration |
