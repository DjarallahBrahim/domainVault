<!--
Sync Impact Report
==================
Version change: 1.2.0 → 1.3.0 (MINOR)
Rationale: Material expansion of Phase 5 (Sedo Integration) guidance — new
database tables, columns, API route pattern, cache sync rules, and error
handling matrix codified from plan.md §Phase 5.

Modified principles:
  I. Data Integrity & Security — added "Sedo Listing Cache Integrity"
     sub-section covering sedo_listings as a write-through cache, sync
     cleanup rules (stale row deletion), and cross-table consistency
     between sedo_listings and domains.bin

  V. Phased Delivery & Verification — expanded Phase 5 description to
     reference plan.md as the authoritative implementation spec; noted
     new infrastructure (migrations 004–006, API routes, hooks, types)

Added sections:
  Technical Standards — new rows for user_settings table, sedo_listings
     cache table, domains.bin column, lib/sedo/ utilities, and Sedo API
     route conventions

Removed sections: none

Templates checked:
  ✅ plan-template.md — Constitution Check gate aligns with all principles;
     no changes needed
  ✅ spec-template.md — no direct constitution references; no changes needed
  ✅ tasks-template.md — phase structure aligns; no changes needed
  ✅ commands/ — no commands directory exists; not applicable
  ✅ README.md — features list reflects current state; no Phase 5 content
     to align yet
  ✅ AGENTS.md — points to spec 007; no changes needed

Follow-up TODOs: none
-->

# DomainVault Constitution

## Core Principles

### I. Data Integrity & Security

All user inputs MUST be validated before persistence — Zod schemas shared
client and server side. CSV imports MUST handle malformed rows gracefully:
log errors, skip bad rows, never corrupt existing data. Every mutation MUST
be traceable through the database (auditability via timestamps and user_id
foreign keys). Row Level Security (RLS) MUST be enabled on every table
with policies enforcing `user_id = auth.uid()`. The Supabase `service_role`
key MUST never be exposed to the client; Route Handlers are the only
permitted server-side secret boundary (used only when absolutely necessary,
such as webhooks, signed URLs, or third-party API proxying).

**Cross-table mutation integrity**: Mutations that span multiple tables MUST
maintain referential integrity as a single logical operation. When a sale
is created, the associated domain's status MUST be updated to "sold". When
the last sale for a domain is deleted, the domain's status MUST revert to
"active". These cross-table state transitions MUST occur within the same
mutation flow and MUST NOT leave orphaned or inconsistent state.

**Third-party API credential storage**: Per-user credentials for external
APIs (e.g., Sedo) MUST be stored in `user_settings` protected by RLS.
Plain-text storage behind RLS is acceptable for initial integration;
column-level encryption (e.g., `pgcrypto`) is optional for later hardening.
Credentials MUST never be serialized to client-side state or logged.

**Sedo listing cache integrity**: The `sedo_listings` table is a
write-through cache of Sedo's listing data, keyed by `domain_id`. Cache
entries MUST be created/updated on successful `insert`/`edit` responses
from Sedo and deleted on successful `delete` responses. On global sync
(`GET /api/sedo/list`), any `sedo_listings` row whose domain was NOT
returned by Sedo MUST be deleted — this handles domains delisted directly
on Sedo's website. The `sedo_price` displayed in the Sedo table column
MUST be read from `sedo_listings`, NOT from `domains.bin`. The `bin` column
represents the user's desired Buy-It-Now price; it is distinct from the
active Sedo listing price and MUST NOT be conflated.

**Rationale**: Domain portfolios are financial assets. Data corruption,
unauthorized access, or inconsistent cross-table state directly harms the
user's business.

### II. Architecture Discipline

Server Components are the default for all data fetching. Client Components
(`"use client"`) MUST only be introduced when interactivity (state, effects,
event handlers) is required. Standard CRUD operations MUST go through the
Supabase client with RLS — never through Route Handlers. The application uses
the direct Supabase client pattern: browser clients for client-side mutations,
server clients for SSR data fetching.

**Query file split pattern**: When a server-only dependency (e.g.,
`next/headers` from `createServerClient`) would leak into the client bundle,
queries MUST be split into two files:
- `lib/supabase/queries/<feature>.ts` — server-safe queries (SSR hydration,
  `fetch*` functions using the server client)
- `lib/supabase/queries/<feature>-client.ts` — client-safe queries
  (mutations, browser-side `fetch*` functions using the browser client)

Client components that need fetch functions MUST import from the `-client`
variant to prevent server-only code from reaching the browser bundle.

TanStack Query MUST handle all client-side fetches with centralized query
keys in `/lib/query-keys.ts`. All database calls MUST use typed helpers
in `/lib/supabase/queries/`; raw Supabase calls inside components are not
permitted. Optimistic updates MUST be applied on every mutation.

**Third-party API routes**: Route Handlers under `app/api/sedo/` proxy
Sedo API calls because they require server-side secrets (`partnerid`,
`signkey`, `username`, `password`). Every route MUST:
1. Authenticate the user via Supabase server client
2. Fetch `user_settings` — return `401` if Sedo credentials are missing
3. Call the Sedo API via `lib/sedo/client.ts`
4. Return `{ data }` on success, `{ error }` on Sedo fault, `500` on
   network error
Sedo API faults MUST be returned to the client for inline display (forms)
or toast notification (sync). The `@xmldom/xmldom` library is used for
XML parsing on the server side only.

**Rationale**: The separation between server-centric rendering, typed data
access, and the query-file split pattern prevents silent security regressions
and `next/headers` build failures while ensuring the codebase scales
predictably across phases.

### III. UX Excellence & Accessibility

Both dark and light themes are first-class — every component MUST look
correct and pass WCAG 2.1 AA contrast ratios in both modes. Skeleton
loaders MUST render on every async fetch; the UI MUST never block with a
full-page spinner. Async operation results MUST surface via toast
notifications; form field errors MUST appear inline. All Supabase error
codes MUST be mapped to human-readable strings before display. The entire
application MUST be fully responsive from 375px mobile through 1920px
desktop. Every interactive element MUST be keyboard-navigable.

**Rationale**: Domain investors manage portfolios across devices and
lighting conditions. Poor UX leads to missed renewals and lost revenue.

### IV. Code Quality & Performance

TypeScript strict mode MUST be enabled with zero `any` types and zero
unused imports. ESLint and Prettier MUST be enforced; no warnings allowed
in CI. Supabase types MUST be auto-generated via `supabase gen types
typescript > types/supabase.ts`. All forms MUST use React Hook Form with
Zod validation schemas living in `/lib/validations/`. CSV imports MUST use
batch inserts — individual-row loop inserts are prohibited regardless of
row count. Database queries MUST leverage indexes on `expiration_date` and
`status` columns. The dashboard MUST load in under 2 seconds, and CSV
imports up to 10,000 rows MUST not freeze the UI.

**Deleted feature cleanup**: When a feature is replaced or removed per
`plan.md`, all associated components, queries, and dead code MUST be
removed from the codebase before implementing its replacement. No dead
code or commented-out blocks may remain.

**Rationale**: A codebase with 10,000-row CSVs and real-time dashboards will
degrade catastrophically without upfront performance discipline. Strict
typing prevents runtime errors at scale.

### V. Phased Delivery & Verification

Features MUST be delivered in independent, shippable phases as defined in
`plan.md`. Each phase MUST pass its full Definition of Done checklist
before the next phase begins. Every push MUST produce a clean Vercel build
with zero TypeScript errors.

**v1 phases**:

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation — auth, schema, shell, theme | Complete |
| 2 | CSV Import, Manual Entry & Domain Management | Complete |
| 3 | Dashboard & Analytics | Complete |
| 4 | Sales Tracking, Earnings & Dashboard Sales Analytics | In progress (spec 007) |
| 5 | Sedo Integration | Specified — see `plan.md` §Phase 5 |

**Phase 5 — Sedo Integration** (full spec in `plan.md` §Phase 5):
- **Migrations**: 004 (`domains.bin` column), 005 (`user_settings` table
  + RLS), 006 (`sedo_listings` cache table + RLS)
- **Settings page**: Account section (email, member since, change password)
  plus Sedo API Credentials form (partner ID, sign key, username, password)
  with Test Connection + Save, inline connection status badge
- **API routes** (`app/api/sedo/`): `check`, `list`, `insert`, `edit`,
  `delete` — all proxy Sedo XML API via `lib/sedo/client.ts`
- **Pricing utilities** (`lib/sedo/pricing.ts`): `computeSedoPricing()`,
  `askingPriceSuggestions()`, `minPriceSuggestions()` — suggestion chips
  for overlay form; currency always USD
- **Domains page**: `SedoColumn` (desktop + mobile), `SedoOverlay` (unified
  create/edit/delete form with inline confirm), `SedoSyncButton` (global
  sync with stale-row cleanup), `useSedoListings` and `useSedoSync` hooks
- **Error handling**: credentials missing → disabled controls + tooltip;
  Sedo API fault → inline error (forms) or toast (sync); network error →
  500 toast; stale cache rows cleared on sync
- **Pricing rules**: Fixed/Negotiable toggle; asking price chips from
  `domains.bin`; min offer chips recomputed live off asking price

**Ongoing work**: Post-v1 feature work (updating existing features, creating
new features) MUST follow the same phased delivery discipline. Each new
feature or major update MUST have its own specification, plan, and tasks
under `specs/`, with a dedicated feature branch following the same naming
convention (`###-feature-name`). The Constitution Check gate in each plan
MUST pass before implementation begins.

Non-goals for v1 (multi-user, registrar APIs, email alerts, native app) MUST
NOT be implemented without an explicit specification and plan that passes
the Constitution Check.

**Rationale**: Phased delivery ensures each increment is independently
valuable, shippable, and verifiable — preventing the accumulation of
unverified work that blocks the entire project.

## Technical Standards

| Standard | Requirement |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript strict |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Server State | TanStack Query v5 |
| UI State | Zustand |
| Database | Supabase PostgreSQL, RLS on all tables |
| Auth | Supabase Auth (email/password + magic link) |
| Charts | Recharts |
| CSV | PapaParse with batch upsert |
| Dates | date-fns |
| Icons | Lucide React |
| Theme | next-themes |
| Forms | React Hook Form + Zod (`/lib/validations/`) |
| XML Parsing | `@xmldom/xmldom` (Node runtime, for Sedo API) |
| Query Keys | Centralized in `/lib/query-keys.ts` |
| Typed DB | Supabase helpers in `/lib/supabase/queries/` |
| Types | Auto-generated via `supabase gen types typescript > types/supabase.ts` |
| Sedo Client | `lib/sedo/client.ts` — XML fetch + parse; `lib/sedo/pricing.ts` — pricing utils |
| API Routes | `app/api/sedo/{check,list,insert,edit,delete}/route.ts` — server-side secret boundary |
| Auth Tables | `domains`, `sales`, `import_logs`, `promotions`, `user_settings`, `sedo_listings` |
| Domains Column | `bin DECIMAL(10,2)` — user's desired Buy-It-Now price (distinct from `sedo_listings.sedo_price`) |

## Design System

All visual decisions MUST reference the design tokens defined in `plan.md` §4.
Deviations require justification in the implementation plan.

### Colors (CSS Variables)

Dark mode is the default theme. Light mode mirrors the same variable names
with inverted luminance values. Both themes MUST pass WCAG 2.1 AA contrast
ratios for all text/background combinations.

```css
/* Dark mode */
--bg-primary:    #0a0a0f;   /* Page background */
--bg-surface:    #111118;   /* Card / panel background */
--bg-elevated:   #1a1a24;   /* Modal / dropdown background */
--accent-primary: #6366f1;  /* Buttons, links, active states */
--accent-success: #10b981;  /* Positive indicators (renewed, sold, profit) */
--accent-warning: #f59e0b;  /* Expiring-soon warnings */
--accent-danger:  #ef4444;  /* Expired / delete / critical */
--text-primary:  #f1f5f9;   /* Body text */
--text-muted:    #64748b;   /* Secondary / placeholder text */
--border:        #1e1e2e;   /* Dividers, input borders, card strokes */
```

Domain expiry badge colors MUST use the following threshold mapping:
- 🔴 `#ef4444` (danger): ≤ 30 days until expiry or already expired
- 🟠 `#f59e0b` (warning): 31–90 days
- 🟡 `#eab308` (caution): 91–180 days
- 🟢 `#10b981` (success): > 180 days

### Chart Interaction Standard

Every chart MUST implement the following behaviors (per plan.md §4):

- **Tooltip**: Recharts `<Tooltip>` with custom styled content showing
  domain lists, counts, values, or percentages as appropriate.
- **Hover state**: Bar/segment lifts with `opacity` change and cursor
  pointer on hover.
- **Animated entry**: `animationDuration={600}` on mount.
- **Click navigation**: Clickable segments/bars MUST navigate to filtered
  `/domains` view where specified (e.g., expiry donut segments navigate to
  `/domains?expiry=1m`; registrar bars navigate to `/domains?registrar=<name>`).
- **Empty state**: Every chart MUST render a meaningful empty state when
  no data is available.

### Typography

All text MUST use one of three typefaces; no other font families permitted:

| Role | Font | Weight |
|---|---|---|
| Display / headings | **Syne** | 600–800 |
| Body / labels / UI | **DM Sans** | 400–500 |
| Domain names / codes | **JetBrains Mono** | 400–500 |

Fonts MUST be loaded via `next/font/google` to eliminate layout shift.

### Breakpoints

All layouts MUST be tested at the Tailwind breakpoints defined below.
Every screen MUST function correctly from 375px mobile through 1920px desktop.

| Breakpoint | Width | Typical Target |
|---|---|---|
| `sm` | 640px | Large phones, landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops / iPad Pro |
| `xl` | 1280px | Desktop monitors |

Dashboard layout rules per breakpoint:
- **≥ 1024px**: 2-column grid (charts left, alerts/stats right), followed by
  full-width rows for promotion, revenue, leaderboard, platform breakdown
- **768–1023px**: single column
- **< 768px**: stacked cards with simplified chart variants; KPIs collapse from 4-across → 2×2 → 1-column

Domain table rules per breakpoint:
- **≥ 768px**: standard `<table>` with all columns visible
- **480–767px**: horizontal-scrollable table
- **< 480px**: card layout (one card per domain, stacked vertically)

## Development Workflow & Quality Gates

**Before any phase begins**:
- Previous phase MUST pass its full Definition of Done from `plan.md`

**During development**:
- Skeleton loaders on every async fetch — no full-page spinners
- Toast notifications for all async operation results
- Inline errors for all form fields
- Optimistic updates on every mutation

**Pre-merge requirements**:
- Clean Vercel build with zero TypeScript errors
- ESLint + Prettier pass with zero warnings
- No `any` types, no unused imports
- All Supabase errors mapped to human-readable strings before display
- No `service_role` key exposed to client bundle
- No `next/headers` or `createServerClient` imports in files that reach the browser bundle (enforce query file split pattern)
- No dead code or commented-out blocks from deleted features (reference `plan.md` §9)
- No Sedo credentials (`partnerid`, `signkey`, `username`, `password`) serialized to client-side state or logs

## Governance

This constitution supersedes all other project practices and conventions.
Amendments require:

1. Documentation of the proposed change with rationale
2. Review against all affected phases and user stories in the relevant `plan.md`
3. Version increment per semantic versioning:
   - **MAJOR**: Principle removal or backward-incompatible redefinition
   - **MINOR**: New principle, section, or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes
4. Propagation of changes to dependent templates and AGENTS.md

All PRs and code reviews MUST verify compliance with the principles above.
Any deviation from a principle MUST be explicitly justified in the
implementation plan's "Complexity Tracking" section.

**Version**: 1.3.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-06-08