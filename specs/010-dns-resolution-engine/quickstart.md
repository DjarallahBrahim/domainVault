# Quickstart: Core DNS Resolution Engine

**Feature**: 010-dns-resolution-engine | **Date**: 2026-07-28

## Overview

The DNS resolution engine is a pure TypeScript module at `lib/dns/` that resolves domain A records via public DNS-over-HTTPS providers. No database, no server, no UI — just functions.

## Files

```
lib/dns/
├── types.ts         # Resolver, DnsStatus, DnsResult types
├── providers.ts     # Cloudflare + Google endpoint configs (internal)
├── resolve.ts       # resolveDomain(), resolveBatch()
└── parseInput.ts    # parseDomainList(rawText)
```

## Quick Usage

### Single Domain Resolution

```typescript
import { resolveDomain } from "@/lib/dns/resolve";

const result = await resolveDomain("google.com", "cloudflare");

if (result.status === "ok") {
  console.log(`Resolved to: ${result.ips.join(", ")}`);
  console.log(`Took ${result.tookMs}ms`);
} else {
  console.log(`Failed: ${result.error ?? "No A record found"}`);
}
```

### Batch Resolution

```typescript
import { resolveBatch } from "@/lib/dns/resolve";

const domains = ["google.com", "cloudflare.com", "github.com"];
const results = await resolveBatch(domains, "cloudflare", { concurrency: 10 });

for (const r of results) {
  console.log(`${r.domain}: ${r.status === "ok" ? r.ips[0] : "NO DNS"}`);
}
```

### Parse User Input

```typescript
import { parseDomainList } from "@/lib/dns/parseInput";

const rawInput = `https://example.com/path
google.com, cloudflare.com
www.test.com`;

const parsed = parseDomainList(rawInput);

if ("error" in parsed) {
  console.error(parsed.error);
} else {
  console.log(`Parsed ${parsed.domains.length} domains:`, parsed.domains);
  // ["example.com", "google.com", "cloudflare.com", "www.test.com"]
}
```

## TypeScript Types (reference)

```typescript
type Resolver = "cloudflare" | "google";
type DnsStatus = "ok" | "no_dns";

interface DnsResult {
  domain: string;
  resolver: Resolver;
  status: DnsStatus;
  ips: string[];
  error?: string;
  tookMs?: number;
}
```

## Development

```bash
# TypeScript check only (no UI, no server)
npx tsc --noEmit

# Or use the project's typecheck command
npm run typecheck
```

## Verification (Exit Criteria)

Open browser console on any page that imports the module:

```javascript
const { resolveBatch } = await import("/_next/static/...");

const results = await resolveBatch(["google.com"], "cloudflare");
console.assert(results[0].status === "ok", "Should resolve google.com");
console.assert(results[0].ips.length > 0, "Should have at least one IP");
console.log("PASS:", results[0].ips);
```

## No Dependencies

This module has zero npm dependencies. It uses only:
- `fetch()` — standard web API (available in Node 18+, all modern browsers)
- `AbortController` — standard web API
- `Promise.allSettled` — ES2020
