# Quickstart: Phase 4 Refresh — Sales Analytics on Dashboard

**Audience**: Developers verifying the new sales analytics widgets on the dashboard.

## Prerequisites

- Phase 1–3 fully implemented
- Sales data in the `sales` table (create test sales with varied prices/dates/platforms)
- Domains with `purchase_price` set (for ROI calculations)

## Verification Checklist

### 1. Revenue Over Time Chart (US-024)

- [ ] Bar chart renders below the promotion section on the dashboard.
- [ ] Each bar represents one month of revenue.
- [ ] Toggle: "12M" (default) shows last 12 months.
- [ ] Toggle: "24M" shows last 24 months.
- [ ] Toggle: "All time" shows all months with sales.
- [ ] Cumulative line overlaid on secondary Y-axis.
- [ ] Hover bar → tooltip shows: month, revenue, # of sales, cumulative total.
- [ ] Months with no sales show zero-height (or thin) bars — no gaps.
- [ ] Bars animate in on mount.
- [ ] Empty state when no sales exist.

### 2. Top Sales Leaderboard (US-025)

- [ ] Table shows top 5 sales by sale price with rank, domain, price, ROI %, date.
- [ ] ROI % green for positive, red for negative.
- [ ] Missing purchase price → ROI % shows "—".
- [ ] "Show top 10" toggle expands list to 10 (or all if fewer exist).
- [ ] "Best ROI" toggle re-sorts by ROI % descending.
- [ ] Click a row → expands to show purchase price, sale price, profit, ROI %,
  hold duration, platform.
- [ ] Click expanded row → collapses.
- [ ] Click different row → previous collapses, new expands (accordion).
- [ ] Empty state when no sales exist.

### 3. Platform Performance (US-026)

- [ ] Horizontal bar chart or table shows platforms sorted by revenue descending.
- [ ] Each entry shows: platform name, # of sales, total revenue, avg sale price.
- [ ] Hover bar → tooltip with platform, sales count, revenue, avg price.
- [ ] Null/empty platform → "Other" or "Direct".
- [ ] Empty state when no sales exist.

### 4. Layout (Desktop ≥1024px)

- [ ] KPI cards row at top.
- [ ] Expiry Donut + Registrar Chart side by side.
- [ ] Promotion Section below.
- [ ] Revenue Chart full width.
- [ ] Leaderboard + Platform side by side below.
- [ ] Critical Renewals + Quick Stats in right column.

### 5. Responsive

- [ ] Tablet (768–1023px): single column, all stacked.
- [ ] Mobile (<768px): stacked cards, simplified charts.

### 6. No Regressions

- [ ] Existing dashboard widgets (KPI, donut, registrar, renewals, promotion, quick stats) unaffected.
- [ ] Sales page (log, list, KPI cards) unaffected.
- [ ] Domain list, import, settings unaffected.

### 7. Build & Lint

- [ ] `npm run typecheck` — zero TypeScript errors.
- [ ] `npm run lint` — zero ESLint warnings.
- [ ] `npm run build` — clean Vercel build.

## Files Changed Summary

| File | Change | Story |
|---|---|---|
| `dashboard-revenue-chart.tsx` | **NEW** | US-024 |
| `dashboard-sales-leaderboard.tsx` | **NEW** | US-025, US-027 |
| `dashboard-platform-breakdown.tsx` | **NEW** | US-026 |
| `dashboard-client.tsx` | **UPDATED** | Layout integration |
| `dashboard.ts` (server queries) | **UPDATED** | `fetchSalesAnalytics` |
| `dashboard-client.ts` (client queries) | **UPDATED** | Client variant |
