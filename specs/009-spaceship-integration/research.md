# Research: Spaceship SellerHub Integration

**Date**: 2026-06-08

## Decision 1: API Client Architecture

**Decision**: Dedicated `lib/spaceship/client.ts` module using native `fetch` with header-based auth (`X-Api-Key`, `X-Api-Secret`). No XML parsing needed — Spaceship uses JSON.

**Rationale**: Spaceship's API differs fundamentally from Sedo — REST/JSON vs XML/HTTP GET. A separate client module avoids coupling and keeps each integration self-contained. `fetch` is natively available in Next.js 14+ API routes.

**Alternatives considered**:
- Extend `callSedo` to handle REST — Rejected: fundamental protocol difference (headers vs query params, JSON vs XML parsing), would create an overly complex abstraction.
- Use a shared base client — Rejected: premature abstraction. The two integrations have different auth mechanisms, different request patterns, and different response parsing. A shared base would add complexity without value until 3+ integrations exist.

## Decision 2: Credential Storage

**Decision**: Extend `user_settings` table with `spaceship_api_key` (TEXT) and `spaceship_api_secret` (TEXT) columns. Follow the same RLS-protected plain-text pattern used for Sedo.

**Rationale**: One row per user for all settings. Adding columns is simpler than creating a separate credentials table. Same security model as Sedo — RLS enforces per-user isolation.

**Alternatives considered**:
- Separate `spaceship_credentials` table — Rejected: unnecessary table proliferation when `user_settings` is designed for per-platform credential columns.
- Encrypted storage — Deferred: follows constitution guidance (plain text behind RLS acceptable, `pgcrypto` optional later).

## Decision 3: Cache Table Design

**Decision**: Create `spaceship_listings` table mirroring `sedo_listings` schema — write-through cache keyed by `domain_id`, with platform-specific columns (price, currency, status), RLS, cascade-delete.

**Rationale**: Proven pattern from Phase 5. Each platform gets its own cache table for isolation — a domain can be listed on both Sedo and Spaceship simultaneously with different prices.

**Key differences from `sedo_listings`**:
- No `sedo_minprice`, `sedo_fixedprice`, `sedo_forsale` columns (Spaceship SellerHub doesn't have min-offer/fixed-price concepts)
- Replaced with simpler schema: `spaceship_price`, `spaceship_currency`, `spaceship_domain_id` (Spaceship's own ID for the listing)
- Same `last_synced_at`, `created_at`, `updated_at` audit columns

**Alternatives considered**:
- Single `platform_listings` table with platform enum — Rejected: different platforms have different schemas (Sedo needs minprice/fixedprice/forsale; Spaceship doesn't). Separate tables keep schemas clean.
- No caching — Rejected: violates SC-003 (no per-row API calls).

## Decision 4: Connection Testing

**Decision**: Test Spaceship credentials by calling `GET /v1/sellerhub/domains?take=1` with auth headers. A 200 response means connected; 401 means invalid.

**Rationale**: Spaceship has no dedicated "check auth" endpoint. Fetching a minimal page (1 item) from the SellerHub list validates both the API key/secret and the `sellerhub:read` permission. Lightweight — 1 item response.

**Alternatives considered**:
- Use `GET /v1/domains` (domain management) — Rejected: requires `domains:read` permission which may not be granted if user only enabled SellerHub permissions.
- Use `GET /v1/sellerhub/domains/{domain}` with a known domain — Rejected: requires knowing a domain name upfront.

## Decision 5: TanStack Query Integration

**Decision**: Follow the Phase 5 pattern exactly — `useSpaceshipListings` returns `Map<domain_id, SpaceshipListing>`, `useSpaceshipSync` handles full sync with stale cleanup, `useSpaceshipRefreshOne` handles per-domain sync with direct cache update via `setQueryData`.

**Rationale**: Proven pattern. The Map return type enables O(1) per-row lookup. Direct cache manipulation avoids unnecessary Supabase refetches during per-domain sync.

**Key**: `['spaceship-listings']`

**Alternatives considered**:
- Array-based cache — Rejected: O(n) lookup degrades table performance with large portfolios.
