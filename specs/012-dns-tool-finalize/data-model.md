# Data Model: DNS Tool Finalize

**Feature**: 012-dns-tool-finalize | **Date**: 2026-07-28

## Overview

Adds three new state entities and one utility type. All are transient, client-side only. No persistence. Extends the `useDnsChecker` hook's state from Phase 8.

## State Entities

### compareMode (new hook state)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `compareMode` | `boolean` | `false` | Whether Compare Providers mode is active |

**State transitions**:
- Toggled by user via `CompareToggle` component
- Blocked (cannot change) when `isLoading === true`
- When `compareMode` is toggled on: `resolver` selector is disabled, results table switches to side-by-side layout
- When `compareMode` is toggled off: `resolver` selector re-enabled, table returns to single-resolver layout

### ComparisonResult

A new type for compare-mode results. Stored in `compareResults` array in the hook.

```typescript
interface ComparisonResult {
  domain: string;
  cloudflare: DnsResult;
  google: DnsResult;
  mismatch: boolean;  // true when cloudflare.ips !== google.ips
}
```

| Field | Type | Description |
|-------|------|-------------|
| `domain` | `string` | The domain that was queried |
| `cloudflare` | `DnsResult` | Resolution result from Cloudflare resolver |
| `google` | `DnsResult` | Resolution result from Google resolver |
| `mismatch` | `boolean` | Whether the two providers returned different IP addresses |

### CsvRow

Internal utility type for CSV generation. Not stored — built on-demand.

```typescript
// Single-resolver mode
type CsvRow = {
  domain: string;
  status: string;
  ip: string;  // comma-separated if multiple IPs
};

// Compare mode
type CompareCsvRow = {
  domain: string;
  cloudflare_status: string;
  cloudflare_ips: string;
  google_status: string;
  google_ips: string;
};
```

### AnalyticsPayload

Event payload for `dns_lookup_run` custom event.

```typescript
interface AnalyticsPayload {
  resolver: "cloudflare" | "google" | "compare";
  domainCount: number;
  timestamp: number;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `resolver` | `string` | Which resolver(s) used — "cloudflare", "google", or "compare" |
| `domainCount` | `number` | Number of domains in the batch |
| `timestamp` | `number` | `Date.now()` when resolution started |

## Component Props

### ExportButton

```
props: {
  results: DnsResult[] | ComparisonResult[];
  compareMode: boolean;
  disabled: boolean;
}
```

### CompareToggle

```
props: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
}
```

### HelpSection

```
props: none (self-contained presentational component)
```

## No Persistence

No database tables, no Supabase, no file storage. All state is React state. CSV downloads use `Blob` + `URL.createObjectURL` — memory-only, URLs revoked immediately after download trigger.
