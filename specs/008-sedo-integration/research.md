# Research: Sedo Integration

**Date**: 2026-06-08

## Decision 1: XML Parsing Library

**Decision**: Use `@xmldom/xmldom` for server-side XML parsing.

**Rationale**: The Sedo API responds in XML (`output_method=xml`). `@xmldom/xmldom` is a standards-compliant DOM parser that works in Node.js runtime (Next.js API routes). It's lightweight and has no browser dependencies. The parsing occurs exclusively in server-side Route Handlers — no XML reaches the client.

**Alternatives considered**:
- `fast-xml-parser` — Valid alternative with JSON conversion, but introduces schema mapping complexity. DOM-based parsing is simpler for Sedo's flat `<item>` child structure.
- `xml2js` — Older library with less active maintenance. `@xmldom/xmldom` is a more modern and actively maintained fork of `xmldom`.

## Decision 2: Sedo API Client Architecture

**Decision**: Single `callSedo(fn, params)` function in `lib/sedo/client.ts` handling URL construction, fetch, and XML parsing. Each API route calls this function after auth and credential retrieval.

**Rationale**: Centralises the Sedo API contract — base URL, auth param injection (`partnerid`, `signkey`, `username`, `password`), XML fault detection (`SEDOFAULT` root tag), and response mapping. Route handlers stay thin (auth → credentials → callSedo → return).

**Fault handling**:
- Root tag `SEDOFAULT` → extract `faultcode` and `faultstring` → throw as structured error
- Network/HTTP errors → throw with status 500
- Success responses (e.g., `SEDODOMAINLIST`) → map `<item>` children to plain objects → return

**Alternatives considered**:
- Per-route fetch logic — Code duplication across 5 routes; rejected.
- Full Sedo SDK — No official SDK exists; XML-based HTTP GET API is the only interface.

## Decision 3: Pricing Utility Separation

**Decision**: Pricing logic lives in `lib/sedo/pricing.ts` with three exports:
- `computeSedoPricing(price, minprice, fixedprice)` — builds the full Sedo payload (adds currency=1, forsale=1)
- `askingPriceSuggestions(bin)` — generates BIN / BIN−20% / BIN−30% suggestion chips
- `minPriceSuggestions(askingPrice)` — generates 20% / 30% / 40% / 50% suggestion chips

**Rationale**: Pricing computation is shared between `insert` and `edit` routes and the overlay's client-side suggestion chip logic. Server-side routes compute the final Sedo payload (ensuring correct `currency` and `forsale` flags). Client-side uses suggestion functions for UI chip rendering only — actual pricing is computed server-side.

**Alternatives considered**:
- Client-side pricing computation — Rejected: server must own the final payload to ensure data integrity. Client computes suggestions for UX only.
- Inline pricing in each route — Rejected: duplication across insert/edit routes.

## Decision 4: Sedo Listings Cache Strategy

**Decision**: Write-through cache pattern on `sedo_listings` table keyed by `domain_id`:
- **Insert/Edit**: On successful Sedo API response → upsert `sedo_listings` row → invalidate TanStack Query cache
- **Delete**: On successful Sedo API response → delete `sedo_listings` row → invalidate
- **Sync**: Fetch all Sedo listings (paginated, 100/request) → upsert returned domains → delete rows for domains NOT returned by Sedo (externally delisted)

**Rationale**: The cache ensures the Sedo column reads from a local source (no per-row API calls). The write-through pattern keeps the cache consistent with Sedo's state. Stale-row cleanup during sync handles the case where users delist domains directly on Sedo's website.

**Alternatives considered**:
- On-demand per-row API calls — Rejected: violates performance goal (SC-003 — no per-row API calls).
- Periodic background sync — Rejected: clarified that sync is manual-only, no automatic sync on any trigger.

## Decision 5: TanStack Query Key Strategy

**Decision**:
- `['sedo-listings']` — reads all `sedo_listings` rows for the current user (returns `Map<domain_id, SedoListing>`)
- `['user-settings']` — reads `user_settings` row for the current user
- Sync mutation invalidates `['sedo-listings']` on success
- Overlay mutations (insert/edit/delete) invalidate `['sedo-listings']` plus `['domains']`

**Rationale**: Follows the existing project pattern of centralized query keys in `/lib/query-keys.ts`. The `Map` return type enables O(1) lookup per domain row — critical for table rendering performance.

**Alternatives considered**:
- Array-based listing return — Rejected: O(n) lookup per row would degrade table performance with large portfolios.
- Multiple granular query keys per domain — Rejected: unnecessary complexity; a single query with a Map is sufficient.
