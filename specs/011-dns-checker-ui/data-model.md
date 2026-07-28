# Data Model: DNS Checker UI

**Feature**: 011-dns-checker-ui | **Date**: 2026-07-28

## Overview

All state is transient, client-side only. No database tables, no persistence, no serialization. The hook (`useDnsChecker`) owns all state. Types reuse `DnsResult` from `lib/dns/types.ts` (Phase 7).

## State Entities

### DnsCheckerState

The central state object managed by `useDnsChecker`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `rawInput` | `string` | `""` | Raw text from the textarea |
| `parsedDomains` | `string[]` | `[]` | Clean domain list from `parseDomainList()` |
| `parseError` | `string \| null` | `null` | Error from parsing (e.g. exceeds 200 limit) |
| `resolver` | `"cloudflare" \| "google"` | `"cloudflare"` | Selected DNS provider |
| `results` | `(DnsResult \| null)[]` | `[]` | Resolution results, null entries = not yet resolved |
| `isLoading` | `boolean` | `false` | Whether a resolution batch is in progress |
| `filter` | `"all" \| "dns_ok" \| "no_dns"` | `"all"` | Active result filter |
| `progress` | `{ done: number; total: number }` | `{ done: 0, total: 0 }` | Resolution progress counter |

**State transitions**:

```
[Idle] ──(user pastes text)──> [Parsed] ──(user clicks Resolve)──> [Loading]
                                                                       │
                                                           (each domain resolves)
                                                                       │
                                                                       ▼
                                                                   [Loading]
                                                              (results accumulate)
                                                                       │
                                                            (all domains done)
                                                                       │
                                                                       ▼
                                                                   [Idle / Results]
```

- `isLoading` transitions `false → true` when resolution starts, `true → false` when all domains resolve or the user navigates away
- `parsedDomains` updates on every keystroke via debounced `parseDomainList()`
- `results` array grows non-null entries as each domain resolves; index corresponds to `parsedDomains` order
- `filter` changes instantly on user click, no loading state

### Derived Values (computed, not stored)

| Value | Computation |
|-------|-------------|
| `filteredResults` | `results.filter(r => r !== null).filter(r => matchesFilter(r, filter))` |
| `dnsOkCount` | `results.filter(r => r?.status === "ok").length` |
| `noDnsCount` | `results.filter(r => r?.status === "no_dns").length` |
| `allCount` | `results.filter(r => r !== null).length` |
| `hasResults` | `results.length > 0` |
| `canResolve` | `parsedDomains.length > 0 && !isLoading && !parseError` |

### Filter State

| Filter | Condition |
|--------|-----------|
| `"all"` | Show all non-null results |
| `"dns_ok"` | Show only results with `status === "ok"` |
| `"no_dns"` | Show only results with `status === "no_dns"` |

## Component Props

### DomainInput

```
props: {
  value: string;
  onChange: (value: string) => void;
  domainCount: number;
  error: string | null;
  isLoading: boolean;
}
```

### ResolverSelector

```
props: {
  value: "cloudflare" | "google";
  onChange: (value: "cloudflare" | "google") => void;
  disabled: boolean;
}
```

### SummaryBar

```
props: {
  filter: "all" | "dns_ok" | "no_dns";
  onFilterChange: (filter: "all" | "dns_ok" | "no_dns") => void;
  counts: { all: number; dns_ok: number; no_dns: number };
}
```

### ResultsTable

```
props: {
  results: (DnsResult | null)[];
  filter: "all" | "dns_ok" | "no_dns";
}
```

## No Persistence

This phase involves no database tables, no Supabase, no file storage. All state is React state managed by `useDnsChecker`. State is lost on page navigation (expected behavior).
