# Research: DNS Tool Finalize

**Feature**: 012-dns-tool-finalize | **Date**: 2026-07-28

## Research Tasks

### 1. CSV Export Strategy

**Decision**: Build CSV string using template literals with proper escaping. Write to `navigator.clipboard.writeText()`. If clipboard is unavailable (HTTP context, older browser), fall back to a Blob download via `URL.createObjectURL` + `<a download>`.

**Rationale**:
- `navigator.clipboard.writeText()` is the standard, non-deprecated API — supported in all modern browsers over HTTPS
- The app runs on Vercel with HTTPS by default, so the happy path covers nearly all users
- Blob download fallback: create a `Blob` with MIME type `text/csv`, generate an object URL, trigger download via a temporary `<a>` element, then revoke the URL
- CSV escaping: wrap fields containing commas or quotes in double quotes, double any internal quotes (RFC 4180 standard)

**Alternatives considered**:
- `execCommand('copy')` — deprecated, requires text selection workaround, inconsistent across browsers
- Server-side CSV generation — unnecessary for client-side data; adds latency and backend complexity
- XLSX export — requires a library dependency; CSV is universally compatible with spreadsheets

### 2. Compare Providers Mode Architecture

**Decision**: Add a `compareMode` boolean to the `useDnsChecker` hook. When true, disable the resolver selector and run the concurrency pool twice — once per resolver. Store results as a separate array `compareResults: (ComparisonResult | null)[]` where `ComparisonResult` has `cloudflare: DnsResult` and `google: DnsResult`. The ResultsTable detects `compareMode` via a new prop and renders side-by-side columns.

**Rationale**:
- Separate state for comparison results avoids conflating with single-resolver results
- Running two pools sequentially (or interleaved) is simpler than modifying `resolveDomain` to accept multiple resolvers
- The toggle being a simple checkbox next to the resolver selector follows the clarification decision (Option A)
- Mismatch detection: compare IP arrays between the two results; if they differ, flag the row with a visual indicator

**Alternatives considered**:
- Run both resolvers simultaneously with a 2x concurrency pool — more complex to implement, minimal performance gain since we're capped by per-host browser connections (~6 per host for each resolver)
- Merge two `resolveBatch` calls — simpler but results arrive in two waves rather than interleaved per-domain

### 3. Navigation Link Placement

**Decision**: Add a "DNS Checker" link to both the desktop sidebar (`components/layout/sidebar.tsx`) and the mobile bottom tab bar (`components/layout/bottom-tab-bar.tsx`). Place it after "Domains" and before "Import" in the nav order. Use the `Search` icon from `lucide-react`.

**Rationale**:
- Both nav components have a centralized `NAV_ITEMS` array — adding one item is straightforward
- Placing after "Domains" groups it naturally with domain-related tools
- The `Search` icon conveys lookup/resolution conceptually
- Consistent placement across desktop and mobile ensures discoverability regardless of viewport

**Alternatives considered**:
- `Globe` icon — already used for "Domains"
- `Server` or `Network` icon — less intuitive for non-technical users
- Separate "Tools" submenu — over-engineering for a single tool

### 4. Analytics Integration

**Decision**: Dispatch a custom DOM event `dns_lookup_run` on `window` with payload `{ resolver: string, compareMode: boolean, domainCount: number, timestamp: number }`. No domain names or IPs are included. If no listener exists (analytics service absent), the event simply fires with no consumer — tool functionality is unaffected.

**Rationale**:
- Custom events are a lightweight, framework-agnostic way to hook into any analytics service (Google Analytics, PostHog, Plausible, etc.)
- Payload contains only aggregate metadata — domain count and resolver choice, never actual data
- Non-blocking: `dispatchEvent` is synchronous and tiny; no async analytics SDK calls in the critical path
- If the app later adds a dedicated analytics module, it can listen for this event without changing the DNS Checker code

**Alternatives considered**:
- Direct `window.gtag` call — couples the tool to Google Analytics specifically
- No analytics — misses the opportunity to measure tool adoption and usage patterns
- Server-side analytics — requires API route and sends data to backend, violating the "we never see your lookups" privacy stance

### 5. Help Copy Content

**Decision**: Add a collapsible/disclosure section below the input area containing:
- **How it works**: 3-step flow (paste → choose resolver → resolve)
- **Supported formats**: URLs, commas, newlines, spaces — with examples
- **FAQ**: Why results differ between Cloudflare and Google (DNS propagation), what "No DNS" means, concurrency limits (200 domains max, 20 at a time)
- Uses shadcn/ui `Collapsible` or a simple `<details>` element

**Rationale**:
- Inline help keeps users on the page — no external link
- Collapsible prevents visual clutter for returning users
- FAQ addresses the most common questions preemptively, reducing support burden
- Single source of truth — help copy lives in the component, not a separate docs page

**Alternatives considered**:
- Dedicated `/dns-checker/help` page — fragments the tool UX, harder to maintain
- Tooltip-based help — insufficient for multi-step workflows
- External docs/wiki link — breaks the in-app flow

### 6. Changelog Format

**Decision**: Create `CHANGELOG.md` at repo root if it doesn't exist. Add a `## [Unreleased]` section with a bullet list entry for the DNS Checker Tool. Use Keep a Changelog format (`## [version] - YYYY-MM-DD`).

**Rationale**:
- Keep a Changelog is the de facto standard for open-source projects
- Single file at repo root is discoverable by contributors and automated release tools
- "Unreleased" section accumulates features until a version tag is cut

**Alternatives considered**:
- GitHub Releases only — not version-controlled, tied to GitHub platform
- Inline comments in code — not user-facing
