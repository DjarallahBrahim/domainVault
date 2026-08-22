# Data Model: Promoting (TLD Outreach Tracker)

**Date**: 2026-08-19 | **Feature**: Phase 23

## Entity: Outreach Tracking Record (`tld_outreach`)

One row per (domain, TLD) pair the user has interacted with. Created lazily — never pre-seeded. Scoped to the owning user via RLS.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | generated |
| `user_id` | UUID FK → `auth.users` | `ON DELETE CASCADE`; RLS `auth.uid() = user_id` |
| `domain_id` | UUID FK → `domains` | `ON DELETE CASCADE` — deleting a domain removes its outreach rows |
| `tld` | TEXT | e.g. `io`; combined with `domain_id` under `UNIQUE(domain_id, tld)` |
| `full_domain` | TEXT | denormalized, e.g. `word.io` — for fast render without joins |
| `contacted` | BOOLEAN | default `false` |
| `contacted_at` | TIMESTAMPTZ | set by mutation on `false → true`; cleared on `true → false` |
| `reply_status` | TEXT | `'pending' | 'positive' | 'negative'` (CHECK constraint), default `'pending'` |
| `reply_at` | TIMESTAMPTZ | set by mutation when `reply_status` leaves `'pending'` (first transition only) |
| `notes` | TEXT | nullable — reserved for future use, not surfaced in v1 UI |
| `created_at` / `updated_at` | TIMESTAMPTZ | defaults `NOW()` |

Indexes: `(user_id)`, `(domain_id)`, `(reply_status)`.

### State transitions (contacted)

```
contacted=false (no row or row) ──toggle──► contacted=true  (contacted_at = now())
      ▲                                              │
      └────────── toggle back ◄──────────────────────┘
      (contacted_at = null, reply disabled again)
```

### State transitions (reply)

```
pending ──► positive  (reply_at = now())
pending ──► negative  (reply_at = now())
positive/negative ──► pending   (reply_at kept — tracks first reply)
```

Reply control is only interactive while `contacted = true`.

## View Model: Merged Table Row

The reserved-TLD table is a join by `tld` between two sources, rendered as one row per reserved TLD:

```
ReservedTld (from Phase 18 route)          OutreachRow (from tld_outreach map)
{ tld, fullDomain, isLive }          ⨝    { contacted, contacted_at, reply_status, reply_at }
      │                                        │
      └──────────── tld key ───────────────────┘
                         │
                         ▼
        { tld, fullDomain, isLive, contacted, contacted_at, reply_status, reply_at }
```

Missing outreach rows default to `{ contacted: false, reply_status: 'pending' }` — "no row" is a valid state, never an error.

## Derived Counts (Summary Cards)

| Card | Computation | Accent |
|---|---|---|
| Reserved TLDs | `useReservedTlds(domainId).tlds.length` | primary |
| Contacted | count of merged rows with `contacted === true` | warning |
| Positive Replies | count of merged rows with `reply_status === 'positive'` (subtext: `N` negative) | success |

## Component State Machines

### DomainPicker

```
idle (no selection) ──select──► selected (domainId set, URL synced)
selected ──open/change──► searching (filtered options) ──select──► selected
```

### RunTldCheckPrompt

```
neverChecked ──click "Run TLD Check"──► running (spinner, disabled)
running ──success──► table replaces prompt
running ──error──► back to idle state (retry-able)

isEmpty ──► "Re-check" variant (same running/error transitions)

no TldListConfigured ──► button disabled, tooltip "No TLD list configured yet."
```

### ReplyStatusSelect

```
disabled (contacted=false) ──toggle contacted──► enabled (pending)
enabled ──select positive/negative──► active pill (success/danger tint)
```

## Query Keys (addition to `lib/query-keys.ts`)

```ts
promoting: {
  all: ["promoting"] as const,
  domains: () => [...queryKeys.promoting.all, "domains"] as const,
  reservedTlds: (domainId: string | null) =>
    [...queryKeys.promoting.all, "reserved-tlds", domainId] as const,
  outreach: (domainId: string | null) =>
    [...queryKeys.promoting.all, "outreach", domainId] as const,
},
```

- `toggleContacted` / `setReplyStatus` invalidate `outreach(domainId)` and `domains()` (picker counts + summary cards stay consistent).
- Post-refresh invalidates `reservedTlds(domainId)` and `domains()`.
- `useReservedTlds` reuses the Phase 18 route response — no additional table read.

## Data Flow

```
/promoting page (client)
  ├─ usePromotingDomains() → domains (id, domain, reserved_tlds_count, tlds_last_checked_at)
  │     └─ DomainPicker options + empty-portfolio placeholder
  ├─ DomainPicker select → set domainId → router.replace("?domain=<id>")
  ├─ PromotingSummaryCards(domainId) → derived counts from merged rows
  ├─ useReservedTlds(domainId)  → GET /api/tld-checker/domains/:id/extensions
  ├─ useTldOutreach(domainId)   → outreach map + mutations
  │     ├─ toggleContacted(tld, next)  → upsert tld_outreach (optimistic)
  │     └─ setReplyStatus(tld, status) → upsert tld_outreach (optimistic)
  └─ ReservedTldTable (desktop) / ReservedTldCardRow (mobile)
        └─ merge by tld → rows with live dot, link, checkbox, reply pill
        └─ RunTldCheckPrompt shown when neverChecked or isEmpty
              └─ POST /api/tld-checker/domains/:id/refresh (reused)
```