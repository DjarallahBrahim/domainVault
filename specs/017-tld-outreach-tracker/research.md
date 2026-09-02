# Research: Promoting (TLD Outreach Tracker)

**Date**: 2026-08-19 | **Feature**: Phase 23

No external unknowns required web research — the master plan (`plan.md` §Phase 23) and the existing codebase (Phases 14–22) fully determine the design. The decisions below consolidate verified facts from the code and resolve the few local design choices.

## Decision: Reuse Phase 18 Extensions Route As-Is

### What we chose

`useReservedTlds` calls the existing `GET /api/tld-checker/domains/:domainId/extensions` and uses the response directly. Verified in `app/api/tld-checker/domains/[domainId]/extensions/route.ts`: the route already filters `is_reserved = true`, enforces ownership server-side (404 if the domain is not the caller's), and returns `{ data: [{ tld, fullDomain, isLive }] }` sorted by `tld`.

### Rationale

- No client-side re-filtering needed — `isReserved` is always true in the response.
- Ownership enforcement is already done server-side (defense in depth alongside RLS).
- No new route to write or maintain.

### Alternatives considered

- Writing a dedicated `/api/promoting/...` route: rejected — duplicate ownership checks, duplicate fetch, no added value.
- Reading `domain_extension_checks` directly from the browser client: rejected — violates the "no raw Supabase calls in components" rule and skips the ownership check the route provides.

## Decision: Reuse Single-Domain Refresh; Gate on Empty TLD List

### What we chose

The "Run TLD Check" / "Re-check" button calls the existing `POST /api/tld-checker/domains/:domainId/refresh` (verified: returns `{ data: { reservedTldsCount, results: [...], ... } }` and persists results). The `RunTldCheckPrompt` additionally fetches the active TLD list (existing `fetchActiveTlds` helper with the browser client) to implement the spec's FR-025: if the list is empty, the button is disabled with tooltip "No TLD list configured yet."

### Rationale

- The refresh route already persists results and recomputes the summary columns — reusing it means zero new DNS logic.
- FR-025 (and Phase 22's known state) requires a visible "no list configured" state rather than silently running against the route's internal default list. Gating the button from the UI is the lightest way to honor that intent without touching the route.

### Alternatives considered

- Relying on the route's `DEFAULT_TLDS` fallback and never disabling: rejected — contradicts the explicit Phase 22/23 requirement and would confuse users.
- Adding a dedicated "is list empty" API route: rejected — `fetchActiveTlds` already exists and is usable with the browser client.

## Decision: Lazy Row Creation + Upsert on `(domain_id, tld)`

### What we chose

No `tld_outreach` row is created until the user toggles a checkbox or changes a reply. Writes are a single upsert keyed on `domain_id, tld` (matching the table's `UNIQUE` constraint). `contacted_at` / `reply_at` are set by the mutation logic at write time:
- `contacted` flips `false → true` → `contacted_at = now()`; flips `true → false` → `contacted_at = null`.
- `reply_status` changes away from `'pending'` → `reply_at = now()` (set only when status first leaves pending).

### Rationale

- "No row" is a legitimate state meaning "not contacted, pending" — pre-seeding rows for every reserved TLD is wasted writes and drift risk.
- The table's `UNIQUE(domain_id, tld)` makes a single upsert idempotent — rapid toggles can't create duplicates.
- The migration defines the columns but no DB trigger; the application sets the timestamps, consistent with how the rest of the codebase writes rows through the Supabase client.

### Alternatives considered

- DB triggers to manage timestamps: rejected — the codebase has no trigger precedent and the client mutation is a single well-defined place.
- One-row-per-TLD-per-interaction history table: rejected — out of scope; the spec tracks current state only.

## Decision: Optimistic Updates with Rollback (Established Pattern)

### What we chose

`toggleContacted` and `setReplyStatus` follow the domain-slide-over optimistic pattern (US-010): update the TanStack Query cache immediately, fire the upsert, on error roll back the cache and show an error toast. Both invalidate `['promoting','outreach', domainId]` and `['promoting','domains']` so the summary cards and picker counts stay consistent.

### Rationale

- Constitution Principle III requires optimistic updates on every mutation; Principle II requires typed helpers (`outreach-client.ts`) and centralized query keys.
- Immediate feedback matches the spec's SC-002 (toggle reflects instantly).

## Decision: Reply Select Disabled Until Contacted

### What we chose

`ReplyStatusSelect` renders disabled (with tooltip "Mark as contacted first") until the row's `contacted` is true. It is a shadcn `Select` styled as a status pill: neutral for Pending, success-tinted for Positive, danger-tinted for Negative, with a smooth color transition.

### Rationale

- Spec FR-017 mandates the disabled-until-contacted behavior — prevents nonsensical "reply" on never-contacted outreach.
- The pill styling makes the table read as a pipeline at a glance (spec FR-016/FR-018).

## Decision: Mobile Layout — Stacked Cards + Scroll Chips

### What we chose

Below `md` (768px): the domain picker becomes a full-width control, summary cards become horizontal scroll chips (same pattern as the dashboard Quick Stats widget), and the TLD table becomes stacked cards via `ReservedTldCardRow` — one card per TLD showing the full domain link, live dot, contacted checkbox, and reply pill.

### Rationale

- Matches the established dashboard/domains responsive patterns (plan.md §4 breakpoints).
- Reuses the same data and handlers as the desktop table — layout is the only difference, no logic duplication.

## Decision: Navigation + Deep Link

### What we chose

`/promoting` is added to the desktop sidebar and mobile bottom tab bar (Megaphone icon, matching US-003). The selected domain is synced to `?domain=<domain_id>` via `router.replace` (no full navigation), read on mount to pre-select, matching the URL-sync convention already used for domain filters (US-009c).

### Rationale

- Deep-linking is a hard requirement (FR-002/FR-003) and the app already owns this pattern.

## Decision: No Query-File Split Needed

### What we chose

All new reads/writes use the browser Supabase client (client components with interactivity). No server component needs the server client for this feature, so `next/headers` / `createServerClient` never enters the new code — the constitution's query-file split pattern is not triggered. The single new query file is `lib/supabase/queries/outreach-client.ts`.

### Rationale

- The `/promoting` page is inherently interactive; SSR hydration fetches aren't required, so introducing a server variant would be dead weight.
- The split pattern exists to prevent `next/headers` leakage — that risk is absent here.