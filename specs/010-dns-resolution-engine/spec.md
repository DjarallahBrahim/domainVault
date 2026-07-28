# Feature Specification: Core DNS Resolution Engine

**Feature Branch**: `010-dns-resolution-engine`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "DNS Checker Tool — Build Plan -> Phase 7 — Core DNS Resolution Engine"

## Clarifications

### Session 2026-07-28

- Q: Should `resolveBatch` return all results at once or support incremental/streaming delivery? → A: Return all results at once via a single Promise (array after all resolve).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resolve a Single Domain's IPv4 Address (Priority: P1)

A user needs to check whether a domain resolves to any IPv4 address. They provide a single domain name, select a DNS resolver (Cloudflare or Google), and receive back either the resolved IP addresses or an indication that the domain has no A record.

**Why this priority**: This is the atomic unit of the entire DNS Checker Tool. Without reliable single-domain resolution, no other feature (batching, UI, export) can function.

**Independent Test**: Can be fully tested by calling the resolution function with a known domain (e.g. `"google.com"`) against Cloudflare and verifying the returned list contains at least one valid IPv4 address.

**Acceptance Scenarios**:

1. **Given** a domain with one or more A records (e.g. `"google.com"`), **When** a user resolves it via any supported resolver, **Then** the result status is `"ok"` and `ips` contains at least one valid IPv4 address.
2. **Given** a domain with NO A records (e.g. a non-existent domain or one without DNS), **When** a user resolves it, **Then** the result status is `"no_dns"` and `ips` is empty.
3. **Given** a valid domain, **When** the DNS resolver takes longer than 5 seconds to respond, **Then** the request is aborted and the result status is `"no_dns"` with an appropriate error message.
4. **Given** a resolver endpoint that returns a server error (5xx), **When** a user resolves a domain, **Then** the result status is `"no_dns"` and the error is captured (no crash or unhandled exception).

---

### User Story 2 - Resolve Multiple Domains in Bulk (Priority: P2)

A user needs to check the DNS status of many domains at once. They provide a list of domains, and the system resolves them in parallel with a controlled concurrency limit to avoid overwhelming the browser or resolvers.

**Why this priority**: Bulk resolution is the primary use case for the tool — users check entire portfolios, not just single domains. It builds directly on P1.

**Independent Test**: Can be tested by providing a batch of mixed domains (some resolvable, some not) and confirming all return correctly classified results within a reasonable time.

**Acceptance Scenarios**:

1. **Given** a list of 50 domains, **When** a user resolves them in bulk with a concurrency cap of 20, **Then** all 50 results are returned together as a single array after all resolutions complete, with correct statuses and no more than 20 concurrent requests in-flight at any time.
2. **Given** a batch containing both resolvable and non-resolvable domains, **When** bulk resolution completes, **Then** each domain has its correct individual status (`"ok"` or `"no_dns"`) — one failed domain does not block the rest.
3. **Given** a batch resolution in progress, **When** the user aborts the operation (via an AbortSignal), **Then** all in-flight requests are cancelled and no further requests are made.

---

### User Story 3 - Parse Raw Domain Input into Clean Domain List (Priority: P3)

A user pastes raw text containing domains in various formats — full URLs, comma-separated lists, mixed line endings, duplicates — and the system produces a clean, deduplicated, validated list of domain names ready for resolution.

**Why this priority**: Users rarely have perfectly formatted domain lists. Input parsing is the bridge between raw user paste and the resolution engine. Without it, users must manually clean their input, creating friction.

**Independent Test**: Can be tested by providing messy input text (URLs, duplicates, invalid entries) and confirming the output is a clean, deduplicated list of valid hostnames with invalid entries discarded.

**Acceptance Scenarios**:

1. **Given** raw input containing full URLs (e.g. `"https://example.com/path?q=1"`), **When** parsed, **Then** only the domain portion (`"example.com"`) is extracted.
2. **Given** input containing duplicate domains, mixed casing, and whitespace, **When** parsed, **Then** duplicates are removed and all domains are lowercased.
3. **Given** input with invalid hostnames (malformed characters, empty strings), **When** parsed, **Then** invalid entries are silently discarded.
4. **Given** input exceeding 200 domains, **When** parsed, **Then** the parser signals an error indicating the limit has been exceeded.
5. **Given** input separated by newlines, commas, or spaces, **When** parsed, **Then** domains are correctly split regardless of the separator used.

---

### Edge Cases

- What happens when a resolver returns malformed JSON or an unexpected response shape?
- What happens when a domain name is technically valid but the resolver returns no `Answer` section (empty response)?
- How does the system handle domains with only IPv6 (AAAA) records when queried for A records?
- What happens when the user's network blocks or throttles connections to the DoH endpoints?
- How does the system handle very large batches (e.g., 10,000 domains) if the cap is artificially bypassed?
- What happens when the AbortController timeout fires mid-request transfer (partial response)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support resolving a single domain's A (IPv4) records via DNS-over-HTTPS (DoH) against configured providers.
- **FR-002**: The system MUST support two DoH providers: Cloudflare (`cloudflare-dns.com`) and Google (`dns.google`).
- **FR-003**: Each resolution MUST return a typed result containing the domain, the resolver used, a status indicator (`"ok"` or `"no_dns"`), the list of resolved IPv4 addresses, and optional error/timing metadata.
- **FR-004**: The system MUST enforce a per-request timeout of 5 seconds and treat timeouts as `"no_dns"` status.
- **FR-005**: The system MUST support bulk resolution of multiple domains in parallel with a configurable concurrency cap (default: 20), returning all results at once as a single array after every domain in the batch has resolved.
- **FR-006**: Bulk resolution MUST use a mechanism that ensures one domain's failure does not block resolution of other domains in the batch.
- **FR-007**: Bulk resolution MUST allow cancellation via an external AbortSignal.
- **FR-008**: The system MUST provide an input parser that accepts raw text and produces a clean, deduplicated, lowercased list of valid domain names.
- **FR-009**: The input parser MUST strip protocol prefixes, paths, ports, and trailing slashes from URLs.
- **FR-010**: The input parser MUST reject inputs exceeding a maximum list length (200 domains) with a clear error.
- **FR-011**: The input parser MUST perform basic hostname validation and discard invalid entries.
- **FR-012**: All DNS resolution functions MUST be framework-agnostic modules with no UI framework dependencies, relying only on standard platform HTTP and cancellation APIs.
- **FR-013**: The system MUST handle resolver errors (5xx, network failures, malformed JSON) by mapping them to `"no_dns"` status with an error string, never by throwing uncaught exceptions.

### Key Entities

- **Resolver**: Represents a DNS-over-HTTPS provider. Key attributes: name (Cloudflare or Google), endpoint URL template, required headers.
- **DnsResult**: The outcome of resolving a single domain. Key attributes: domain name, resolver used, status (`"ok"` or `"no_dns"`), list of IPv4 addresses, optional error message, optional latency in milliseconds.
- **DnsStatus**: A discriminated status for a resolution attempt — either `"ok"` (at least one A record found) or `"no_dns"` (no records, error, or timeout).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A single domain resolution against a healthy resolver completes within 5 seconds under normal network conditions.
- **SC-002**: A batch of 50 domains resolves completely within 30 seconds using the default concurrency cap.
- **SC-003**: 100% of resolver errors (network failures, 5xx, malformed JSON) are mapped to `"no_dns"` status with no uncaught exceptions.
- **SC-004**: The input parser correctly handles all common input formats (URLs, newlines, commas, spaces, mixed casing) with 100% accuracy on valid inputs.
- **SC-005**: The resolution module passes static analysis verification with zero errors and requires no UI framework to function.
- **SC-006**: When tested with `resolveBatch(["google.com"], "cloudflare")`, the function returns at least one valid IPv4 address for `google.com` with status `"ok"`.

## Assumptions

- The resolution engine is a pure, framework-agnostic TypeScript module — it depends only on standard `fetch` and `AbortController` APIs available in modern browsers and Node.js.
- Only A (IPv4) record lookups are in scope. AAAA (IPv6), MX, CNAME, and other record types are out of scope.
- The provider endpoints (Cloudflare and Google DoH) are CORS-enabled and require no API keys, allowing direct client-side `fetch()` calls.
- The module will be used in a browser environment, but its API should be callable from any JavaScript runtime with `fetch` and `AbortController`.
- The input parser's domain validation is "basic" — it rejects obviously malformed hostnames but does not enforce TLD existence or IDN/punycode conversion.
- The 200-domain input cap is a client-side guard against abuse, not a hard technical limit of the resolution engine itself.
- This phase delivers only the core engine module; UI integration, export features, and app wiring are handled in subsequent phases (Phase 8+).
- Incremental/streaming result display in the UI is the responsibility of the Phase 8 hook layer, which can call `resolveDomain` individually with its own concurrency control rather than relying on `resolveBatch` for streaming.
