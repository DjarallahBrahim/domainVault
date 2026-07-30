# Component Contracts: TLD Domain Columns & Sync UI

**Date**: 2026-07-30 | **Feature**: Phases 19+20

## TldCell

Per-row cell for the domains table. Manages three states: idle, loading, data.

```tsx
<TldCell
  domainId={domain.id}
  reservedTldsCount={domain.reserved_tlds_count}
/>

// States:
// - idle:    <RefreshCw /> button — clickable
// - loading: <RefreshCw className="animate-spin" /> — non-interactive
// - data:    <Badge>{count} <ChevronDown /></Badge> — opens TldDropdown
```

**Behavior**:
- On click (idle state): fires `POST /api/tld-checker/domains/{domainId}/refresh`, shows spinner
- On success with count > 0: transitions to data state with count badge
- On success with count = 0: transitions back to idle
- On error: transitions back to idle (retry-able)
- On click (data state): opens TldDropdown via Popover

---

## TldDropdown

Popover listing reserved TLD extensions for a domain.

```tsx
<TldDropdown
  domainId={domain.id}
  reservedTldsCount={domain.reserved_tlds_count}
  open={isOpen}
  onOpenChange={setIsOpen}
/>

// Loading: 3 skeleton rows
// Populated: {tld}.{extension} rows with live/dead indicator
//           Rows link to https://{word}.{tld}
// Empty: "No reserved TLDs" message
```

**Data source**: `GET /api/tld-checker/domains/{domainId}/extensions`
**Sorting**: Reserved first, then alphabetical by TLD

---

## TldSyncModal

Scope selection modal wrapping the existing TldSyncButton.

```tsx
<TldSyncModal
  totalDomains={total}
  currentPageDomainIds={currentPageIds}
/>

// Modal content:
// - "All domains" option — shows "({totalDomains} domains)" label
// - "Current page" option — shows "({currentPageIds.length} domains)" label
// - Confirm button — fires sync with selected scope
```

**Flow**:
1. User clicks "Sync TLDs" → modal opens
2. User selects scope → clicks Confirm
3. Modal closes → TldSyncButton begins showing progress
4. Sync completes/fails → TldSyncButton returns to idle

---

## DomainTable Edit (Existing)

Add "TLDs Reserved" column header and TldCell to each row.

```tsx
// New column header (before Actions):
<TableHead className="w-[100px] font-mono text-xs">TLDs Reserved</TableHead>

// New cell per row:
<TableCell>
  <TldCell
    domainId={domain.id}
    reservedTldsCount={domain.reserved_tlds_count}
  />
</TableCell>
```

---

## DomainCard Edit (Existing)

Add inline TLD badge to mobile card layout.

```tsx
// In card header, next to domain name:
<div className="flex items-center gap-2">
  <span className="font-mono">{domain.domain}</span>
  <TldCell
    domainId={domain.id}
    reservedTldsCount={domain.reserved_tlds_count}
  />
</div>
```
