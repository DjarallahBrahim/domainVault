<!--
Sync Impact Report
==================
Version change: none (template) → 1.0.0 (initial ratification)
New principles (5): I. Data Integrity & Security, II. Architecture Discipline,
  III. UX Excellence & Accessibility, IV. Code Quality & Performance,
  V. Phased Delivery & Verification
Added sections: Technical Standards, Development Workflow & Quality Gates
Removed sections: none (all template placeholders replaced)
Templates checked:
  ✅ plan-template.md — "Constitution Check" gate is dynamic; no changes needed
  ✅ spec-template.md — no direct constitution references; no changes needed
  ✅ tasks-template.md — phase structure aligns; no changes needed
  ✅ checklist-template.md — generic; no changes needed
  ✅ commands/ — no command templates exist yet (glob returned empty)
  ✅ AGENTS.md — references plan.md; consistent
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
permitted server-side secret boundary.

**Rationale**: Domain portfolios are financial assets. Data corruption or
unauthorized access directly harms the user's business.

### II. Architecture Discipline

Server Components are the default for all data fetching. Client Components
(`"use client"`) MUST only be introduced when interactivity (state, effects,
event handlers) is required. Standard CRUD operations MUST go through the
Supabase client with RLS — never through Route Handlers. Route Handlers are
reserved exclusively for server-side secrets (webhooks, signed URLs).
TanStack Query MUST handle all client-side fetches with centralized query
keys in `/lib/query-keys.ts`. All database calls MUST use typed helpers
in `/lib/supabase/queries/`; raw Supabase calls inside components are not
permitted. Optimistic updates MUST be applied on every mutation.

**Rationale**: The separation between server-centric rendering, typed data
access, and secret-aware routing prevents silent security regressions and
ensures the codebase scales predictably across phases.

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

Features MUST be delivered in 4 independent, shippable phases as defined
in `plan.md`. Each phase MUST pass its full Definition of Done checklist
before the next phase begins. Every push MUST produce a clean Vercel build
with zero TypeScript errors. Phases are: (1) Foundation — auth, schema,
shell, theme; (2) CSV Import & Domain Management; (3) Dashboard &
Analytics; (4) Sales Tracking & Earnings. Non-goals for v1 (multi-user,
registrar APIs, email alerts, native app) MUST NOT be implemented in any
phase.

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

## Governance

This constitution supersedes all other project practices and conventions.
Amendments require:

1. Documentation of the proposed change with rationale
2. Review against all affected phases and user stories in `plan.md`
3. Version increment per semantic versioning:
   - **MAJOR**: Principle removal or backward-incompatible redefinition
   - **MINOR**: New principle, section, or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes
4. Propagation of changes to dependent templates and AGENTS.md

All PRs and code reviews MUST verify compliance with the principles above.
Any deviation from a principle MUST be explicitly justified in the
implementation plan's "Complexity Tracking" section.

**Version**: 1.0.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-21
