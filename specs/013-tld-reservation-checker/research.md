# Research: TLD Reservation Checker

**Date**: 2026-07-30 | **Feature**: TLD Reservation Checker

## Decision: DNS-based NS Record Heuristic via DoH

### What we chose

Check domain availability by querying Cloudflare (and optionally Google) DNS-over-HTTPS for NS (Name Server) records. Interpret the response:

| DoH Response | Status | Meaning |
|---|---|---|
| `Status: 0` + NS records in `Answer[]` | **Registered** | Domain has name servers → actively registered |
| `Status: 3` (NXDOMAIN) | **Available** | Domain does not exist in DNS → likely available for registration |
| `Status: 0` but no NS records | **Error** | Indeterminate — could be parked, inactive, or atypical config |
| HTTP error / timeout | **Error** | Network issue or rate limiting |

### Rationale

1. **Zero new infrastructure**: Reuses the exact same `fetch()` → DoH → JSON pattern as the existing DNS Checker (`lib/dns/`). Change `type=A` to `type=NS` — that's it.
2. **Universal TLD coverage**: NS records are a DNS primitive supported by every TLD registry. Unlike RDAP, there are no coverage gaps (.io, .co, and others have no RDAP servers).
3. **Client-side only**: No API keys, no server routes, no database. Matches project constitution exactly.
4. **Fast**: ~30ms per query — same latency as existing A-record lookups. 20 concurrent, 5s timeout.
5. **Simple implementation**: Core resolve logic is ~50 lines. The concurrency pool, abort handling, and progress tracking are already implemented and can be copied from `lib/dns/resolve.ts`.

### Alternatives considered

| Approach | Why rejected |
|---|---|
| **RDAP (HTTP-based WHOIS)** | Critical TLD coverage gaps — .io, .co, and many ccTLDs absent from IANA bootstrap. Requires 2 HTTP calls per domain. Explicit rate-limiting warnings in ToS. |
| **WhoisXML API** | Requires API key → would need a server-side Route Handler to hide the secret. Violates the client-side-only pattern. Free tier rate-limited (~500 queries/month). |
| **Server-side WHOIS proxy** | Requires Node.js TCP socket (`net`) on port 43 per domain. Vercel serverless functions have 10s timeout — often insufficient for WHOIS TCP handshake. WHOIS response parsing is unstructured (no standard format). Violates constitution's avoidance of Route Handlers for non-auth operations. |

### Limitations (documented for user)

- **Reserved/premium domains**: Show NXDOMAIN → false positive for "Available". These are rare and the spec acknowledges Reserved detection is best-effort. Help copy will note this.
- **Registered domains without NS records**: Rare edge case (registrar holds, redirect-only configs). Would also false-positive for "Available". Acceptable for a discovery tool.
- **"Reserved" status**: Cannot be distinguished from "Registered" via NS lookup alone. The spec allows collapsing Reserved → Registered when the data source can't differentiate.

## Decision: Code Architecture — Mirror lib/dns/

### What we chose

Create `lib/tld/` as a sibling module to `lib/dns/` with identical structure:

```
lib/dns/          (existing)         lib/tld/          (new)
├── types.ts      Resolver, DnsResult → types.ts      TldCheckStatus, TldCheckResult
├── providers.ts  DoH endpoints      → providers.ts    Same DoH endpoints, type=NS
├── resolve.ts    resolveDomain      → resolve.ts      checkAvailability
│                 resolveBatch       →                 checkAvailabilityBatch
│                 runWithConcurrency →                 (copied utility)
└── parseInput.ts parseDomainList    → parseInput.ts   parseBaseWords
```

### Rationale

- Proven architecture already established and tested in Phases 7-13
- Developers familiar with the pattern can understand `lib/tld/` instantly
- Abort handling, concurrency pool, timeout logic all copyable
- No new patterns to learn or document

### What differs from `lib/dns/`

| Aspect | DNS Checker | TLD Checker |
|--------|-------------|-------------|
| Input | Full domains (google.com) | Base words + TLDs (mybrand × .com) |
| Query type | A records (type=1) | NS records (type=2) |
| Statuses | ok / no_dns | available / registered / error |
| Status determination | Has A records? | Has NS records? + NXDOMAIN check |
| Result output | IP addresses | Availability status |

## Decision: Component Architecture — Mirror DNS Checker UI

### What we chose

Create `components/tld-checker/` mirroring `components/dns-checker/` with analogous components:

| DNS Checker | TLD Checker | Difference |
|-------------|-------------|------------|
| `DomainInput` | `DomainInput` | Parses base words instead of full domains |
| `ResolverSelector` | `TldPicker` | TLD chip grid instead of 2-button toggle |
| `ResultsTable` | `ResultsTable` | Single resolver, status-focused columns |
| `StatCards` | `StatCards` | Available/Registered/Reserved/Error counts |
| `SummaryBar` | `FilterPills` | Filter by TLD status |
| `ExportButton` | `ExportButton` | Columns: word, tld, domain, status |
| `CompareToggle` | N/A | Single-provider only (Cloudflare default) |
| `HelpSection` | `HelpSection` | TLD-specific FAQ |
| N/A | `SkeletonRow` | Loading placeholder for results |

### Rationale

- Visual consistency with the restyled DNS Checker (terminal/code-editor aesthetic)
- Component API contracts can be lifted directly from existing components
- Same CSS variable usage, same monospace/handwriting pattern, same theme awareness

## Decision: TLD Selection Persistence

### What we chose

Store TLD selection (including custom TLDs) in `sessionStorage` via a Zustand-style state initialized from a storage read. Reset on browser session end.

### Rationale

- Simple — no database, no API endpoint
- Matches the project's pattern of localStorage/sessionStorage for UI preferences
- Privacy-respecting — data never leaves the browser
- Custom TLDs survive page reloads within the same session per FR-006

## Decision: Default TLD Set

### What we chose

Default TLDs: `.com`, `.net`, `.org`, `.io`, `.ai`, `.co`, `.app`, `.dev`

### Rationale

- Covers the top gTLDs by registration volume (.com, .net, .org)
- Covers popular startup/investor TLDs (.io, .ai, .co)
- Covers modern tech/product TLDs (.app, .dev)
- Curated set is small enough to be manageable (8 items) but broad enough to be useful
- Users can remove any they don't want and add unlimited custom TLDs

## Decision: Single Provider (Cloudflare), No Compare Mode

### What we chose

Use only Cloudflare DoH by default. No "Compare Providers" mode (unlike the DNS Checker).

### Rationale

- NS check results should be identical between Cloudflare and Google (same DNS root zone data)
- Unlike A records (which can differ due to GeoDNS/CDN routing), NS delegation is authoritative
- Adding a compare mode for identical data adds complexity with no user benefit
- Simplifies the UI and data model

### If needed later

Google DoH can be added as an optional secondary provider with a toggle — the `providers.ts` already supports both. The resolution logic is identical regardless of provider.
