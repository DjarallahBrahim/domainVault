# Research: Core DNS Resolution Engine

**Feature**: 010-dns-resolution-engine | **Date**: 2026-07-28

## Research Tasks

### 1. Cloudflare DoH JSON API

**Decision**: Use `GET https://cloudflare-dns.com/dns-query?name={domain}&type=A` with header `Accept: application/dns-json`.

**Rationale**:
- CORS-enabled — callable directly from browser `fetch()` without a proxy
- No API key required — fully open public resolver
- Response is RFC 8427 JSON format with `Status`, `TC`, `RD`, `RA`, `AD`, `CD`, `Question[]`, `Answer[]`
- Each `Answer` entry has `name`, `type` (1 = A), `TTL`, `data` (IPv4 string)
- Empty `Answer` array or `Status ≠ 0` means no A record found
- Known to handle ~1.3T queries/day at production scale — highly reliable

**Alternatives considered**:
- Cloudflare's standard DNS API (`1.1.1.1:53`) — requires UDP/TCP sockets, not available in browser
- Cloudflare's DoH with POST — works but GET is simpler and cacheable by the browser

### 2. Google DoH JSON API

**Decision**: Use `GET https://dns.google/resolve?name={domain}&type=A`.

**Rationale**:
- CORS-enabled — callable directly from browser
- No API key required
- Response format nearly identical to Cloudflare (RFC 8427 JSON) with `Status`, `Answer[]`, etc.
- Slightly different URL scheme (`/resolve` vs `/dns-query`), but same JSON shape
- Provides a second independent resolver for cross-verification (Phase 9)

**Alternatives considered**:
- Quad9 (`dns.quad9.net`) — also CORS-enabled DoH, but adding now is premature; can be added in Phase 9
- OpenDNS — no public DoH JSON API with CORS

### 3. Concurrency Pattern for Batch Resolution

**Decision**: Use a simple queue/pool pattern with `Promise.allSettled`. Maintain a pool of in-flight requests capped at `concurrency` (default 20). As each request completes, start the next queued domain. Return all results as a single array when the batch is done.

**Rationale**:
- `Promise.allSettled` ensures one failure doesn't reject the whole batch
- Queue pattern prevents overwhelming the browser's per-host connection limit (~6 per host)
- Concurrency of 20 works because we distribute across two hostnames (Cloudflare + Google), effectively getting ~12 concurrent connections total
- Single array return keeps the API simple — incremental streaming is delegated to Phase 8's UI hook calling `resolveDomain` individually

**Alternatives considered**:
- `Promise.all` with `.catch` on each — would require wrapping each promise, essentially reimplementing `allSettled`
- Async generator (`for await...of`) — adds complexity to the engine API; deferred to Phase 8
- Callback per result — couples the engine to a specific consumer pattern

### 4. AbortController Usage

**Decision**: `resolveDomain` accepts an optional `AbortSignal`. A 5-second timeout is achieved by combining a user-supplied signal with a timeout signal via `AbortSignal.any()` (or manual `AbortController` if `any` is unavailable). `resolveBatch` creates a single `AbortController` that aborts all in-flight requests when the batch is cancelled.

**Rationale**:
- `AbortSignal.any()` is a modern standard but not yet available in all environments (Safari added it in 2024)
- Fallback: create a parent `AbortController`, listen to both user signal and timeout, call `controller.abort()` when either fires
- Timeout maps to `status: "no_dns"` with `error: "Request timed out after 5000ms"`

**Alternatives considered**:
- `Promise.race` with a timer — doesn't actually cancel the `fetch`; the request continues consuming resources
- `AbortSignal.timeout()` — simpler but combines user cancellation and timeout into one signal (harder to distinguish error types)

### 5. Domain Name Validation

**Decision**: Use a regex-based hostname validator that checks:
- Total length ≤ 253 characters
- Each label 1–63 characters
- Labels contain only alphanumeric characters and hyphens
- Labels don't start or end with a hyphen
- At least one dot (no TLD validation, no punycode)

**Rationale**:
- RFC 952/1123 rules cover all valid public domain names
- No TLD validation — TLD list changes frequently and would require maintenance
- No punycode/IDN conversion — internationalized domains are edge cases for this audience
- "Basic" validation means reject obviously garbage input, not enforce perfect RFC compliance
- Invalid domains are silently discarded per FR-011

**Alternatives considered**:
- `new URL()` constructor — requires protocol prefix and rejects bare domains
- Full RFC 5890 (IDNA) validation — overkill for a tool whose users work with ASCII domains
- No validation at all — would cause confusing errors at the DoH API level

### 6. Error Classification

**Decision**: All non-success outcomes (timeout, 5xx, network error, malformed JSON, empty answer, NXDOMAIN) map to `status: "no_dns"`. The specific error reason is stored in `error` field of `DnsResult`. No retry logic — consumers retry if needed.

**Rationale**:
- Binary status model (`"ok"` | `"no_dns"`) keeps the data model simple and predictable
- Error details in `error` field enable the UI to differentiate (e.g., offer retry for timeout vs. show "no DNS" for NXDOMAIN)
- No automatic retry — the engine is a pure query tool; retry policy is a consumer concern
- One exception: HTTP 200 with `Status ≠ 0` in the DNS response (e.g., SERVFAIL) is NOT a network error — it's a valid DNS response indicating no answer

**Alternatives considered**:
- Three-state model (`"ok" | "no_dns" | "error"`) — rejected by the plan.md which explicitly chose binary status
- Automatic retry with exponential backoff — adds complexity and may cause duplicate requests against rate-limited endpoints
