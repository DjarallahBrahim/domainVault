# Quickstart: Phase 2 Refresh — Full v2 Alignment

**Audience**: Developers verifying all v2 Phase 2 features after implementation.

## Prerequisites

- Phase 1 & Phase 2 v1 fully implemented
- At least one verified user account with domains in portfolio

## Verification Checklist

### 1. CSV Preview — Registrar Column (US-007)

- [ ] Upload a CSV with Registrar column filled. Preview table shows Registrar column
  between Price and Status.
- [ ] Upload a CSV without Registrar column. Registrar column shows empty cells.

### 2. Domain List — Registrar Column (US-009)

- [ ] Domain list table shows Registrar column between TLD and Expiration Date.
- [ ] Column is sortable (click header to toggle asc/desc).

### 3. Enter-Key Search (US-009)

- [ ] Type a search term. List does NOT re-filter on each keystroke.
- [ ] Press Enter. List filters to matching domains.
- [ ] Click the search button (magnifying glass). List filters.
- [ ] Clear search and press Enter. Full list restores.

### 4. Multi-Domain Search (US-009b)

- [ ] Enter "example.com, test.org" and press Enter. Both domains appear.
- [ ] Enter "  example.com  ,   test.org  " with irregular spacing. Same result.
- [ ] Enter a single domain without commas. Works as before (no regression).
- [ ] Placeholder text shows "Search domains (comma-separate multiple)".

### 5. Pagination Options (US-009)

- [ ] Page size selector shows options: 25, 50, 100.
- [ ] Select 25. List shows 25 domains. Page count adjusts.
- [ ] Select 100. List shows up to 100 domains.

### 6. CSV Export (US-009)

- [ ] Click "Export CSV". File downloads with all visible columns.
- [ ] Apply a filter. Export. Downloaded CSV contains only filtered domains.

### 7. Improved Filters (US-009c)

- [ ] Expiry window control: All, ≤1m, ≤3m, ≤6m, ≤9m. Selecting immediately filters.
- [ ] Registrar dropdown: shows distinct registrars with counts. Select one → filters.
- [ ] Registrar multi-select: select two registrars → list shows domains from either.
- [ ] Status multi-select: select Active + Sold → both statuses shown.
- [ ] "Clear all" link resets all filters to defaults.
- [ ] Reload page with filters applied. Filters persist via URL params.

### 8. Slide-Over Panel (US-010)

- [ ] Click "Add Domain". Slide-over panel opens from the right with opaque backdrop.
- [ ] No transparency issue — backdrop and panel are fully visible.
- [ ] Form fields: Domain*, Expiration Date*, Purchase Price, Status (dropdown),
  Registrar (with autocomplete), Tags (chip input), Notes.
- [ ] Type in Registrar field. Autocomplete suggestions appear from existing registrars.
- [ ] Type a tag and press Enter. Chip appears. Type another → second chip. Click X
  on chip → removes it.
- [ ] Domain validated on blur — leave field with invalid domain → inline error.
- [ ] Fill all fields, submit. Toast "Domain added". Panel closes. Domain in list.
- [ ] Click edit on existing domain. Slide-over opens pre-populated. Domain read-only.
  Change status, save. List updates.
- [ ] Press Escape or click outside. Panel closes without saving.

### 9. Import Page — Add Manually Tab (US-030)

- [ ] Navigate to `/import`. Two tabs visible: "CSV Upload" (active) and "Add Manually".
- [ ] Click "Add Manually". Form appears: Domain*, Expiration Date*, Price, Registrar,
  Notes (textarea), Tags (chip input), "Add Domain" button.
- [ ] Fill valid domain + date. Submit. Success message inline. Form resets empty.
- [ ] Domain appears in portfolio (/domains).
- [ ] Submit invalid domain (no dot). Inline error. Form retains entered data.
- [ ] Add 3 domains sequentially. Each succeeds, form resets. No page redirect.

### 10. CSV Column Reference Banner (US-031)

- [ ] CSV Upload tab shows info banner at top: "Required: Domain, Expiration Date /
  Optional: Price, Registrar, Notes, Tags".
- [ ] Click copy button. Toast confirms copied. Paste into text editor — header row
  is `Domain,Expiration Date,Price,Registrar,Notes,Tags`.
- [ ] Click sample download link. CSV file downloads with header + 2 example rows.

### 11. No Regressions

- [ ] CSV upload + import flow still works.
- [ ] Domain list: sort, existing filters work.
- [ ] Domain detail page works.
- [ ] Delete (single + bulk) works.
- [ ] Import history works.
- [ ] Dashboard (Phase 3) charts still navigate to filtered domains correctly.
- [ ] Sales (Phase 4) still work.

### 12. Build & Lint

- [ ] `npm run typecheck` — zero TypeScript errors.
- [ ] `npm run lint` — zero ESLint warnings.
- [ ] `npm run build` — clean Vercel build, 15 routes.

## Files Changed Summary

| File | Change | Stories |
|---|---|---|
| `components/domains/domain-add-dialog.tsx` | **DELETED** | Replaced |
| `components/domains/domain-add-slideover.tsx` | **NEW** | US-010 |
| `components/domains/tag-input.tsx` | **NEW** | US-010, US-030 |
| `components/domains/domain-list-client.tsx` | **UPDATED** | US-009, US-010 |
| `components/domains/domain-empty-state.tsx` | **UPDATED** | US-010 |
| `components/domains/domain-search.tsx` | **UPDATED** | US-009, US-009b, US-009c |
| `components/domains/domain-table.tsx` | **UPDATED** | US-009 |
| `components/import/csv-summary.tsx` | **UPDATED** | US-007 |
| `components/import/csv-uploader.tsx` | **UPDATED** | US-031 |
| `components/import/manual-entry-tab.tsx` | **NEW** | US-030 |
| `app/(dashboard)/import/page.tsx` | **UPDATED** | US-030 |
| `lib/supabase/queries/domains-client.ts` | **UPDATED** | US-009c, US-009b |

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Slide-over transparent | Missing z-index or CSS variable | Ensure Sheet component has `z-50` or higher; backdrop uses `bg-black/50` |
| Search triggers on keystroke | Old debounce logic remains | Remove `useEffect` debounce; wire `onKeyDown` + Enter only |
| Autocomplete shows no results | No registrar data in portfolio | Import a CSV with Registrar column or add via manual entry with registrar field |
| Export CSV downloads empty | No domains match current filters | Clear filters before export, or check filter state in URL |
| Multi-domain search slow | Too many OR conditions | Limit tokens to 10; warn if more are entered |
