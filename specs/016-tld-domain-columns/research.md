# Research: TLD Domain Columns & Sync UI

**Date**: 2026-07-30 | **Feature**: Phases 19+20

## Decision: Three-State Per-Row Cell Component

### What we chose

Create a `TldCell` component that renders one of three states based on the domain's `reserved_tlds_count` and local UI state:

| State | Trigger | Visual |
|-------|---------|--------|
| `idle` | `reserved_tlds_count` is NULL or 0, no check in progress | Refresh icon button |
| `loading` | User clicked refresh, API call in flight | Spinner icon |
| `data` | `reserved_tlds_count > 0` | Count badge with chevron-down |

### Rationale

- Matches the existing `SedoCell` and `SpaceshipCell` patterns — per-row components with local state
- States are mutually exclusive and cover all possible data scenarios
- The refresh icon uses the same `RefreshCw` icon already imported in domain-table.tsx

### State machine

```
idle (icon) ──click──► loading (spinner) ──success──► data (badge)
                          │
                          └──error──► idle (icon, clickable again)
data (badge) ──click──► dropdown open ──close──► data (badge)
```

## Decision: Lazy-Loaded Dropdown via Popover

### What we chose

The TLD dropdown data is fetched only when the user clicks the count badge. The dropdown uses shadcn/ui's `Popover` component. While loading, it shows skeleton rows. Once loaded, it renders the actual TLD list with live/dead indicators.

### Rationale

- Avoids pre-loading extension data for all visible rows (200 domains × 10 TLDs = 2000 data points unnecessarily loaded)
- shadcn/ui Popover is already in the project's component library
- Lazy loading keeps the table fast — no additional API calls on table render
- Caching: fetched data can be stored in a local `useState` map for the session, so re-opening the same domain's dropdown doesn't re-fetch

### Data flow

```
User clicks count badge
  → TldDropdown opens
  → fetch `/api/tld-checker/domains/{id}/extensions`
  → show skeletons while loading
  → populate with { tld, fullDomain, isReserved, isLive }
  → render as clickable rows
```

## Decision: Scope Modal Wrapping Existing TldSyncButton

### What we chose

Create a `TldSyncModal` component that renders the existing `TldSyncButton` inside a modal/dialog with scope selection. The modal uses shadcn/ui `Dialog`. Before triggering the sync, the user selects "All domains" or "Current page" scope.

### Rationale

- `TldSyncButton` from Phase 17-18 already handles progress, completion, and error states — don't duplicate that logic
- The modal only adds scope selection — a thin wrapper
- "Current page" scope needs the currently rendered domain IDs — passed as a prop from the domains page
- All domains count shown in modal subtitle — fetched from the existing `total` prop already available in DomainTable

### API call shape for "Current page"

```ts
// Modal owns the scope state, passes resolved IDs to TldSyncButton
POST /api/tld-checker/jobs
{ scope: "page", domainIds: currentPageDomainIds }
```

## Decision: Mobile Card Layout — Inline Badge

### What we chose

On mobile (< 768px, where the domain-card.tsx layout is used), the TLD status is shown as a small inline badge or refresh icon next to the domain name, not as a separate card row. This matches the existing pattern of inline elements in the card header.

### Rationale

- Domain cards are already cramped with registrar, expiry, BIN, status, and Sedo/Spaceship sections
- Adding a full row would push content further down
- Inline badge at the top of the card is discoverable without being obtrusive
- Same `TldCell` component reused — just rendered in a different position

## Decision: Level 1 Column Positioning — Left of Actions

### What we chose

Place the "TLDs Reserved" column immediately before the Actions column (the last functional column). On mobile, place the inline badge next to the domain name in the card header.

### Rationale

- Matches the master plan's spec: "inserted before Actions"
- Keeps it visible without disrupting the existing flow (Domain → Status → Expiry → BIN → Sedo → Spaceship → TLDs → Actions)
- On desktop, the columns are wide enough to accommodate one more badge column
