# Data Model: Core DNS Resolution Engine

**Feature**: 010-dns-resolution-engine | **Date**: 2026-07-28

## Overview

All entities are in-memory TypeScript types. No persistence, no database tables, no serialization format. Types are defined in `lib/dns/types.ts`.

## Entity Definitions

### DnsStatus

Discriminated union of two string literals representing the outcome of a DNS resolution attempt.

```
type DnsStatus = "ok" | "no_dns"
```

| Value | Meaning |
|-------|---------|
| `"ok"` | At least one IPv4 address was resolved |
| `"no_dns"` | No A record found, or an error occurred (timeout, network failure, etc.) |

**State transitions**: None — this is a result type, not a stateful entity.

### Resolver

Identifies which DNS-over-HTTPS provider to query.

```
type Resolver = "cloudflare" | "google"
```

| Value | Description |
|-------|-------------|
| `"cloudflare"` | Cloudflare's public DoH resolver (1.1.1.1) |
| `"google"` | Google's public DoH resolver (8.8.8.8) |

**Extensibility**: Adding a new resolver requires adding a string literal to `Resolver` and a corresponding config object in `providers.ts`.

### DnsResult

The outcome of resolving a single domain against a specific resolver.

```
interface DnsResult {
  domain: string;      // The domain that was queried
  resolver: Resolver;  // Which provider was used
  status: DnsStatus;   // "ok" or "no_dns"
  ips: string[];       // IPv4 addresses (empty if status is "no_dns")
  error?: string;      // Error description (present when status is "no_dns" due to error)
  tookMs?: number;     // Round-trip latency in milliseconds
}
```

**Validation rules**:
- `domain` is always non-empty, lowercased, no protocol/port/path
- `status` is `"ok"` ⟹ `ips` has at least one element
- `status` is `"no_dns"` ⟹ `ips` is empty
- `error` is only present for error cases, not for genuine "no DNS" results
- `tookMs` is rounded to nearest integer, ≥ 0

### ResolverConfig

Internal configuration for a DNS-over-HTTPS provider. Defined in `providers.ts`, not exported.

```
interface ResolverConfig {
  name: Resolver;
  endpoint: string;      // URL template with {domain} placeholder
  headers: Record<string, string>;  // Required HTTP headers
}
```

**Provider configurations**:

| Provider | Endpoint | Headers |
|----------|----------|---------|
| Cloudflare | `https://cloudflare-dns.com/dns-query?name={domain}&type=A` | `Accept: application/dns-json` |
| Google | `https://dns.google/resolve?name={domain}&type=A` | _(none required)_ |

### DoH API Response (external)

The raw JSON shape returned by Cloudflare and Google DoH endpoints. Parsed internally, not persisted.

```typescript
interface DohResponse {
  Status: number;        // DNS response code (0 = NOERROR)
  TC: boolean;           // Truncated flag
  RD: boolean;           // Recursion Desired
  RA: boolean;           // Recursion Available
  AD: boolean;           // Authenticated Data
  CD: boolean;           // Checking Disabled
  Question: Array<{
    name: string;
    type: number;        // 1 = A record
  }>;
  Answer?: Array<{
    name: string;
    type: number;        // 1 = A record
    TTL: number;
    data: string;        // IPv4 address string
  }>;
}
```

## Relationships

```
ResolverConfig ──(selected by)──> Resolver
                                    
Domain (string) ──(queried via)──> resolveDomain() ──> DnsResult[]
                                           ↑
                                    Resolver (parameter)

Domain[] (string[]) ──(queried via)──> resolveBatch() ──> DnsResult[]
                                           ↑
                                    Resolver (parameter)
                                    { concurrency }
```

## No Persistence

This phase involves no database tables, no Supabase rows, no file storage. All data is transient and exists only for the duration of a single function call. If persistence is needed in a future phase (e.g., saved lookups), a new `dns_lookups` table would be created in a separate migration, but that is explicitly out of scope for Phase 7.
