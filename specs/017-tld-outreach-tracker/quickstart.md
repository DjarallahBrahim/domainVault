# Developer Quickstart: Promoting (TLD Outreach Tracker)

**Date**: 2026-08-19 | **Branch**: `017-tld-outreach-tracker`

## Overview

Adds a `/promoting` page where users track manual outreach to the owners of reserved TLD variants of their domains. Pure UI layer on top of the TLD Reservation Checker (Phases 14–22) — zero new DNS/network logic.

## Build Order

1. Migration 009 → `supabase gen types typescript > types/supabase.ts`
2. `types/promoting.ts` + `lib/query-keys.ts` (promoting namespace)
3. `lib/supabase/queries/outreach-client.ts` (typed upsert/fetch helpers)
4. Hooks: `usePromotingDomains` → `useReservedTlds` → `useTldOutreach`
5. Components: `ReplyStatusSelect` → `DomainPicker` → `PromotingSummaryCards` → `ReservedTldTable` → `ReservedTldCardRow` → `RunTldCheckPrompt` → `PromotingPage`
6. Route `app/(dashboard)/promoting/page.tsx` + sidebar/tab-bar nav entry (Megaphone icon)

## Component Tree

```
app/(dashboard)/promoting/page.tsx
└── PromotingPage (client)
    ├── DomainPicker (Command + Popover)        ← usePromotingDomains()
    ├── PromotingSummaryCards                   ← merged counts (only when domain selected)
    ├── ReservedTldTable (desktop ≥md)          ← useReservedTlds() ⨝ useTldOutreach()
    │     ├── TLD link + isLive dot
    │     ├── Contacted Checkbox  → toggleContacted
    │     └── ReplyStatusSelect   → setReplyStatus
    ├── ReservedTldCardRow (mobile <md)         ← same data, stacked cards
    └── RunTldCheckPrompt (empty state)         ← reuses POST .../refresh
```

## Key Files

```
supabase/migrations/009_tld_outreach.sql         NEW
types/promoting.ts                               NEW
app/(dashboard)/promoting/page.tsx               NEW
app/(dashboard)/layout.tsx                       EDIT (nav entry)
components/promoting/*                           NEW (7 files)
lib/hooks/usePromotingDomains.ts                 NEW
lib/hooks/useReservedTlds.ts                     NEW
lib/hooks/useTldOutreach.ts                      NEW
lib/supabase/queries/outreach-client.ts          NEW
lib/query-keys.ts                                EDIT (promoting namespace)
```

Reused (no changes): `GET /api/tld-checker/domains/:id/extensions`, `POST /api/tld-checker/domains/:id/refresh`, `fetchActiveTlds` (for the empty-list gate).

## State Flows

```
Domain selection:
  picker select → domainId set → router.replace("?domain=<id>")
  page mount with ?domain= → pre-select

Contacted:
  unchecked ──toggle──► checked  (contacted_at = now, optimistic)
  checked ──toggle──► unchecked (contacted_at = null, reply disabled again)

Reply:
  disabled until contacted → Pending → Positive/Negative (reply_at set on first change)

Run TLD Check:
  neverChecked → click "Run TLD Check" → spinner → table replaces prompt
  isEmpty      → "Re-check" variant
  empty TLD list → button disabled, tooltip "No TLD list configured yet."
```

## Testing

```bash
supabase db push                       # apply migration 009
supabase gen types typescript > types/supabase.ts
npx tsc --noEmit

# Verify in browser (login required):
# 1. /promoting reachable from sidebar + mobile tab bar
# 2. Picker shows domains with reserved-count badges; ?domain= deep-link works
# 3. Summary cards match table state; update instantly on toggle
# 4. TLD link opens new tab; live dot accurate
# 5. Contacted checkbox persists after reload; tooltip shows time
# 6. Reply select disabled until contacted; colors match accent tokens
# 7. Never-checked domain → "Run TLD Check" → table appears
# 8. Empty TLD list → button disabled with tooltip
# 9. Sorting by TLD and by Reply works
# 10. Mobile (375px): stacked cards + scroll chips; desktop (1920px): full table
# 11. Dark + light theme both correct
```

## RLS Note

All `tld_outreach` rows are scoped via `auth.uid() = user_id`; the reused Phase 18 routes also enforce ownership server-side. Test with two accounts to confirm no cross-user reads/writes.