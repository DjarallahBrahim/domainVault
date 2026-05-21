# Implementation Plan: Phase 1 — Foundation

**Branch**: `001-phase-1-foundation` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-phase-1-foundation/spec.md`

## Summary

Deliver a working authentication flow (register, login, email verification, password
reset), the Supabase database schema with RLS policies, the application shell
(sidebar + bottom tab bar), dark/light theme switching, and navigation across all
five route sections. This is the foundation upon which all subsequent phases build.

Technical approach: Next.js 14+ App Router with Supabase Auth for session management,
Tailwind CSS + shadcn/ui for the component layer, next-themes for theme persistence,
and React Hook Form + Zod for auth form validation. The database migration is a
single idempotent SQL file applied manually or via Supabase CLI.

**Supabase connection**: All auth and database operations go through the Supabase JS
client (`@supabase/ssr`) using the public `anon` key exposed as
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. The client connects directly to Supabase's REST API
from both server components (`createServerClient`) and client components
(`createBrowserClient`). No custom Next.js Route Handlers (API routes) are created
for auth or CRUD — RLS policies on all three tables enforce data isolation. The
`service_role` key is never exposed to the client and is not used in Phase 1.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+

**Primary Dependencies**: Supabase JS client v2, React Hook Form v7, Zod v3,
next-themes v0.3, Tailwind CSS v3, shadcn/ui (Radix primitives), Lucide React,
date-fns v3, Zustand v4

**Storage**: Supabase PostgreSQL — tables `domains`, `sales`, `import_logs` with RLS

**Testing**: Manual E2E verification per Definition of Done (test framework TBD
in a future phase)

**Target Platform**: Vercel (serverless), modern browsers (Chrome, Firefox, Safari,
Edge — latest 2 versions)

**Project Type**: Web application (Next.js App Router), single frontend project

**Performance Goals**: Dashboard auth redirect <5s, theme toggle <200ms, migration
<30s on fresh instance

**Constraints**: No `service_role` key on client, no Route Handlers for standard
CRUD, batch inserts only for CSV (Phase 2), server components by default

**Scale/Scope**: Single-user portfolios, 5 routes, 3 DB tables, 2 themes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Phase 1 Status |
|---|---|---|
| I. Data Integrity & Security | Zod validation on all inputs, RLS on all tables | ✅ Registration/login forms use Zod, migration enables RLS on 3 tables |
| I. Data Integrity & Security | Service role never exposed to client | ✅ Phase 1 uses Supabase anon key + RLS; no Route Handlers needed |
| II. Architecture Discipline | Server Components default, Client only for interactivity | ✅ Auth pages are server-rendered; theme toggle uses client component |
| II. Architecture Discipline | TanStack Query for client fetches, typed helpers | ⚠️ Not applicable (no DB queries in Phase 1) — will be introduced in Phase 2 |
| III. UX Excellence | Skeleton loaders, toast notifications, inline errors | ✅ Auth check loading states, form errors inline, Supabase errors mapped to readable strings |
| III. UX Excellence | WCAG 2.1 AA, responsive 375px–1920px | ✅ Both themes tested at all breakpoints; keyboard navigation for all interactive elements |
| IV. Code Quality | TypeScript strict, ESLint + Prettier, no `any` | ✅ Configured at project init; enforced in CI |
| IV. Code Quality | React Hook Form + Zod for forms | ✅ Registration, login, password reset forms |
| V. Phased Delivery | Phase DoD must pass before Phase 2 | ✅ All 6 DoD items verified before proceeding |

**GATE RESULT**: PASS — zero violations, zero unjustified deviations.

## Project Structure

### Documentation (this feature)

```text
specs/001-phase-1-foundation/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technology decisions & best practices
├── data-model.md        # Phase 1 — entity models & database schema
├── quickstart.md        # Phase 1 — developer onboarding guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                      # Root layout: fonts, theme provider, metadata
├── page.tsx                        # Redirect: / → /dashboard or /login
├── (auth)/
│   ├── login/page.tsx              # Login form (email + password)
│   ├── register/page.tsx           # Registration form (email + password)
│   └── reset-password/page.tsx     # Password reset request form
├── (dashboard)/
│   ├── layout.tsx                  # Shell: sidebar (desktop) + bottom tab (mobile)
│   ├── dashboard/page.tsx          # Placeholder dashboard (Phase 3 fills it in)
│   ├── domains/page.tsx            # Placeholder domain list (Phase 2 fills it in)
│   ├── domains/[id]/page.tsx       # Placeholder domain detail (Phase 2)
│   ├── import/page.tsx             # Placeholder CSV import (Phase 2)
│   ├── sales/page.tsx              # Placeholder sales (Phase 4)
│   └── settings/page.tsx           # Account settings + mobile logout
components/
├── ui/                             # shadcn/ui primitives (button, input, label, ...)
├── auth/
│   ├── login-form.tsx              # Login form component
│   ├── register-form.tsx           # Registration form component
│   └── reset-password-form.tsx     # Password reset form component
├── layout/
│   ├── sidebar.tsx                 # Desktop sidebar navigation
│   ├── bottom-tab-bar.tsx          # Mobile bottom tab bar
│   ├── sidebar-footer.tsx          # User avatar + email + logout
│   └── theme-toggle.tsx            # Dark/light mode switch
├── providers/
│   └── theme-provider.tsx          # next-themes wrapper
└── auth/
    └── auth-guard.tsx              # Protected route wrapper (server)
lib/
├── supabase/
│   ├── client.ts                   # Browser Supabase client (singleton)
│   ├── server.ts                   # Server Supabase client (cookie-based)
│   └── middleware.ts               # Route protection middleware
├── validations/
│   ├── auth.ts                     # Login, register, reset-password Zod schemas
│   └── index.ts                    # Re-exports
├── errors/
│   └── supabase.ts                 # Supabase error → human-readable string mapper
└── hooks/
    └── use-auth.ts                 # Client-side auth hook (Zustand store)
middleware.ts                       # Next.js middleware for auth redirects
types/
└── supabase.ts                     # Auto-generated Supabase types
supabase/
└── migrations/
    └── 001_initial_schema.sql      # DomainVault core schema + RLS policies
```

**Structure Decision**: Single Next.js App Router project — no separate backend.
The `(auth)` route group serves unauthenticated pages; `(dashboard)` wraps all
protected pages in a shared shell layout. shadcn/ui components live under
`components/ui/`; feature-specific components are colocated under `components/<feature>/`.

## Complexity Tracking

> No violations to justify — all constitution gates pass for Phase 1.
