# Contract: resolveDomain

**Module**: `lib/dns/resolve.ts`
**Exported as**: `resolveDomain`

## Signature

```typescript
async function resolveDomain(
  domain: string,
  resolver: Resolver,
  signal?: AbortSignal
): Promise<DnsResult>
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | `string` | Yes | Clean domain name (lowercase, no protocol/path). Caller is responsible for normalization. |
| `resolver` | `Resolver` | Yes | `"cloudflare"` or `"google"` |
| `signal` | `AbortSignal` | No | External cancellation signal. Combined with internal 5s timeout. |

## Return Value

Always returns a `DnsResult` — never throws.

```typescript
interface DnsResult {
  domain: string;
  resolver: Resolver;
  status: "ok" | "no_dns";
  ips: string[];
  error?: string;
  tookMs?: number;
}
```

## Behavior

### Success Path (`status: "ok"`)
- `ips` contains all A-record IPv4 addresses from the DoH response
- `ips` is never empty when status is `"ok"`
- `tookMs` reflects the measured round-trip time

### No-DNS Paths (`status: "no_dns"`)
| Condition | `error` value |
|-----------|---------------|
| Domain has no A record | `undefined` (no error) |
| DoH returns HTTP error (4xx/5xx) | `"HTTP {status}: {statusText}"` |
| Request timed out (5s) | `"Request timed out after 5000ms"` |
| Network failure | `"Network error: {message}"` |
| Malformed JSON response | `"Failed to parse DNS response"` |
| DNS server error (Status ≠ 0) | `"DNS server error: status code {Status}"` |
| Aborted externally | `"Request aborted"` |

### Timeout
- Internal 5-second timeout via `AbortController`
- Combined with user-supplied `signal` using composition
- Timeout fires → request aborted → status `"no_dns"` with timeout error

## Example

```typescript
import { resolveDomain } from "@/lib/dns/resolve";

const result = await resolveDomain("google.com", "cloudflare");
// {
//   domain: "google.com",
//   resolver: "cloudflare",
//   status: "ok",
//   ips: ["142.250.80.78"],
//   tookMs: 147
// }
```

## Errors

This function does NOT throw. All error conditions are captured in the returned `DnsResult` with `status: "no_dns"` and an `error` string.
