# Contract: resolveBatch

**Module**: `lib/dns/resolve.ts`
**Exported as**: `resolveBatch`

## Signature

```typescript
async function resolveBatch(
  domains: string[],
  resolver: Resolver,
  options?: {
    concurrency?: number;    // default: 20
    signal?: AbortSignal;    // external cancellation
  }
): Promise<DnsResult[]>
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domains` | `string[]` | Yes | Clean domain names (lowercase, no protocol/path). Caller is responsible for normalization. |
| `resolver` | `Resolver` | Yes | `"cloudflare"` or `"google"` |
| `options.concurrency` | `number` | No | Max concurrent in-flight requests. Default: 20. Min: 1. |
| `options.signal` | `AbortSignal` | No | External cancellation signal. |

## Return Value

A `Promise<DnsResult[]>` — one result per input domain, in the same order as the input array. Returns after ALL domains have resolved (or failed). Never throws.

## Behavior

### Concurrency Model
- Maintains a pool of at most `concurrency` in-flight `resolveDomain` calls
- As each call completes (success or failure), the next queued domain starts
- Uses `Promise.allSettled` semantics internally — individual failures don't reject the batch
- All results returned as a single array after the last domain resolves

### Cancellation
- If `options.signal` fires, all in-flight requests are aborted
- Pending (not-yet-started) domains are never resolved — they are excluded from the result array
- Already-completed results are discarded (consistent: abort means "I don't need results anymore")

### Empty Input
- Passing an empty array returns an empty array immediately (no network requests)

### Ordering
- Results are returned in the same order as the input `domains` array

## Example

```typescript
import { resolveBatch } from "@/lib/dns/resolve";

const results = await resolveBatch(
  ["google.com", "cloudflare.com", "this-domain-does-not-exist-12345.com"],
  "cloudflare",
  { concurrency: 10 }
);

// results[0] → { domain: "google.com", status: "ok", ips: ["142.250.80.78"], ... }
// results[1] → { domain: "cloudflare.com", status: "ok", ips: ["104.16.133.229", ...], ... }
// results[2] → { domain: "this-domain-does-not-exist-12345.com", status: "no_dns", ips: [], ... }
```

## Errors

This function does NOT throw. Every input domain produces a `DnsResult` with either `"ok"` or `"no_dns"` status.
