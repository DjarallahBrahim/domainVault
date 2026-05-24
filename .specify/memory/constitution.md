<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 (MINOR)
Modified principles:
  I. Data Integrity & Security — added cross-table mutation integrity rule
  II. Architecture Discipline — documented server/client query split pattern;
      clarified that standard CRUD uses direct Supabase client (no Route Handlers)
  V. Phased Delivery & Verification — marked v1 (4 phases) complete; expanded
      to cover ongoing feature work beyond v1
Added sections: none
Removed sections: none
Templates checked:
  ✅ plan-template.md — generic; no changes needed
  ✅ spec-template.md — no direct constitution references; no changes needed
  ✅ tasks-template.md — phase structure aligns; no changes needed
  ✅ constitution-template.md — not applicable (this IS the constitution)
  ✅ README.md — features list matches constitution phases; no changes needed
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
such as webhooks or signed URLs).

**Cross-table mutation integrity**: Mutations that span multiple tables MUST
maintain referential integrity as a single logical operation. When a sale
is created, the associated domain's status MUST be updated to "sold". When
the last sale for a domain is deleted, the domain's status MUST revert to
"active". These cross-table state transitions MUST occur within the same
mutation flow and MUST NOT leave orphaned or inconsistent state.

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

**Rationale**: A codebase with 10,000-row CSVs and real-time dashboards will
degrade catastrophically without upfront performance discipline. Strict
typing prevents runtime errors at scale.

### V. Phased Delivery & Verification

Features MUST be delivered in independent, shippable phases as defined in
each phase's `plan.md`. Each phase MUST pass its full Definition of Done
checklist before the next phase begins. Every push MUST produce a clean
Vercel build with zero TypeScript errors.

**v1 phases (complete)**:
1. Foundation — auth, schema, shell, theme
2. CSV Import & Domain Management
3. Dashboard & Analytics
4. Sales Tracking & Earnings

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
| Query Keys | Centralized in `/lib/query-keys.ts` |
| Typed DB | Supabase helpers in `/lib/supabase/queries/` |
| Types | Auto-generated via `supabase gen types typescript > types/supabase.ts` |

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
- **≥ 1024px**: 2-column grid (charts left, alerts/stats right)
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

**Version**: 1.1.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-24
