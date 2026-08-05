# Developer Quickstart: TLD Domain Columns & Sync UI

**Date**: 2026-07-30 | **Branch**: `016-tld-domain-columns`

## Overview

Adds visual UI for TLD reservation data in the domains table — a new column, a dropdown popover, and a scope-based sync button.

## Component Tree

```
DomainTable (existing, edited)
├── <TableHead>TLDs Reserved</TableHead>  ← new column header
└── per row:
    └── TldCell                         ← new: icon / spinner / badge
          └── TldDropdown (Popover)     ← new: reserved TLD list

DomainCard (existing, edited)
└── <TldCell />                          ← new: inline status

TldSyncModal (new)
└── TldSyncButton (from Phase 17-18)    ← existing, wrapped with scope modal
```

## Key Files

```
components/domains/
├── domain-table.tsx          EDIT: add column + TldCell
├── domain-card.tsx           EDIT: add inline TldCell
├── TldCell.tsx               NEW: three-state cell
├── TldDropdown.tsx           NEW: popover + lazy fetch
└── TldSyncModal.tsx          NEW: scope modal

lib/hooks/
└── useJobProgress.ts         EXISTS: progress tracking
```

## State Flows

```
TldCell:
  idle (icon) → click → loading (spinner) → success → data (badge)
                                           → error   → idle (icon)

TldDropdown:
  open → loading (skeletons) → populated (TLD list)
  open → loading (skeletons) → empty ("No reserved TLDs")

TldSyncModal:
  click "Sync TLDs" → modal open → select scope → confirm → TldSyncButton tracks progress
```

## Testing

```bash
npx tsc --noEmit

# Verify in browser:
# 1. Load /domains — "TLDs Reserved" column visible
# 2. Domain with count > 0: badge shown, click → dropdown with TLDs
# 3. Domain with NULL/0 count: refresh icon shown, click → spinner → badge
# 4. Click "Sync TLDs" → scope modal → progress → completion notification
# 5. Mobile: card layout shows TLD status inline
```
