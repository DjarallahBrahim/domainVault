# Data Model: TLD Domain Columns & Sync UI

**Date**: 2026-07-30 | **Feature**: Phases 19+20

## Component State Models

### TldCell State Machine

```
                    ┌─────────┐
         ┌──────────│  idle   │◄──────────┐
         │          │  (icon) │           │
         │          └────┬────┘           │
         │               │ click          │ error / retry
         │          ┌────▼────┐           │
         │          │ loading │───────────┘
         │          │(spinner)│
         │          └────┬────┘
         │               │ success
         │          ┌────▼────┐
         │          │  data   │
         └──────────│ (badge) │
        data=0/     └────────┘
        NULL after
        refresh
```

**Transitions**:
- `idle → loading`: User clicks refresh icon. API call fires.
- `loading → data`: API returns `reserved_tlds_count > 0`. Display badge.
- `loading → idle`: API returns `reserved_tlds_count = 0` or fails. Show icon again.
- `data → idle`: After a subsequent refresh finds 0 reserved TLDs. Show icon.
- `data → data`: Badge clicked. Dropdown opens/closes. Cell unchanged.

### TldDropdown States

```
open ──► loading (skeletons) ──► populated (TLD list)
                              ──► empty (defensive: 0 results)
                              ──► error (network failure)
```

### TldSyncModal Flow

```
modal closed ──click "Sync TLDs"──► modal open
                                      │
                                      ├─ select "All domains" → confirms → TldSyncButton starts job
                                      └─ select "Current page" → confirms → TldSyncButton starts job
                                      │
                                      modal closes ──► TldSyncButton shows progress
```

## Props Interfaces

### TldCellProps

```ts
interface TldCellProps {
  domainId: string;
  reservedTldsCount: number | null;
  onRefresh?: (domainId: string) => void;
}
```

### TldDropdownProps

```ts
interface TldDropdownProps {
  domainId: string;
  reservedTldsCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### TldSyncModalProps

```ts
interface TldSyncModalProps {
  totalDomains: number;
  currentPageDomainIds: string[];
}
```

## Data Flow

```
Domains Page
  │
  ├─ fetches domains array (includes reserved_tlds_count, tlds_last_checked_at)
  │
  ├─ passes to DomainTable
  │     │
  │     └─ each row renders TldCell
  │           ├─ idle state: <button onClick={refresh}>
  │           ├─ loading state: <Spinner />
  │           └─ data state: <Badge onClick={openDropdown}>
  │                 └─ TldDropdown
  │                       └─ fetch("/api/tld-checker/domains/{id}/extensions")
  │                             └─ render { tld, fullDomain, isReserved, isLive } rows
  │
  └─ TldSyncModal
        └─ "Sync TLDs" button
              └─ Scope selection (All / Current page)
                    └─ POST /api/tld-checker/jobs { scope, domainIds }
                          └─ TldSyncButton tracks progress
```
