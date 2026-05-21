# Research: Phase 1 — Foundation

**Date**: 2026-05-21

## Decisions

### 1. Supabase Auth in Next.js App Router

**Decision**: Use `@supabase/ssr` package with cookie-based auth for server-side session
verification and the standard Supabase client for client-side auth interactions.

**Rationale**: The `@supabase/ssr` package is Supabase's official solution for Next.js
App Router. It handles cookie management for both server and client components via
`createServerClient` and `createBrowserClient`, avoiding the need for manual cookie
handling. It supports middleware-based route protection out of the box.

**Alternatives considered**:
- `supabase-helpers` (deprecated) — superseded by `@supabase/ssr`
- Custom cookie management — error-prone, duplicates Supabase's official approach
- NextAuth.js with Supabase adapter — adds unnecessary abstraction layer for a single
  auth provider

### 2. Form Validation Strategy

**Decision**: React Hook Form v7 + Zod v3, with shared schemas between client and
server validation.

**Rationale**: React Hook Form is the most performant form library for React (minimizes
re-renders via uncontrolled inputs). Zod provides type-safe validation with TypeScript
inference. Sharing schemas ensures server-side validation matches client-side, satisfying
the constitution's data integrity principle.

**Alternatives considered**:
- Formik — heavier, more re-renders, less TypeScript-native
- Server Actions with `useFormState` — server-only validation means slower feedback;
  fails the "inline errors" UX requirement

### 3. Theme Management

**Decision**: `next-themes` v0.3+ with `attribute="class"` strategy and
`enableSystem={true}`.

**Rationale**: `next-themes` is the de facto standard for Next.js theme switching.
Using `attribute="class"` maps to Tailwind's `darkMode: "class"` configuration.
The `enableSystem` option respects OS `prefers-color-scheme` on first visit.
Theme is persisted in localStorage automatically. The library handles SSR flash
prevention via a script injection in `<head>`.

**Alternatives considered**:
- Manual localStorage + CSS class toggling — reimplements what next-themes already
  solves (flash prevention, SSR, OS preference detection)
- Tailwind's `media` strategy — cannot persist user override across sessions

### 4. Route Protection Pattern

**Decision**: Next.js `middleware.ts` at root level reads the Supabase session cookie
and redirects unauthenticated users to `/login`. A separate server-side check in the
dashboard layout verifies the session is still valid.

**Rationale**: Middleware provides fast, edge-level redirects before any page renders.
The server-side layout check is the second line of defense — it verifies the session
hasn't been revoked since the middleware check. This dual-check pattern prevents flash
of protected content.

**Alternatives considered**:
- Client-side redirect only — causes flash of protected content before redirect
- Per-page server checks without middleware — more code duplication, slower redirects
- Only middleware — cannot verify session validity (only presence of cookie)

### 5. Database Migration Strategy

**Decision**: Single idempotent SQL file (`supabase/migrations/001_initial_schema.sql`)
applied via Supabase CLI `supabase db push` or manual execution in the Supabase SQL Editor.

**Rationale**: Simplicity for Phase 1. The migration uses `IF NOT EXISTS`-style
constructs where possible and is safe to run multiple times. Supabase CLI migration
tooling can be adopted in a later phase if needed.

**Alternatives considered**:
- Supabase CLI-managed migrations — adds tooling complexity for a single migration
- Multiple incremental migrations — unnecessary for initial schema creation

### 6. Avatar Generation for Empty State

**Decision**: Use `ui-avatars.com`-style generated SVG avatars with user initials,
falling back to a default user icon.

**Rationale**: Zero-dependency approach — generate an inline SVG or use a simple
component that creates a colored circle with initials. No API calls, no external
services, no image loading. Matches the constitution's performance and simplicity
goals.

**Alternatives considered**:
- Gravatar — requires email hashing and API call; adds latency
- DiceBear — external dependency, adds bundle size for features not yet needed
- Empty avatar slot — poor UX; violates "all shell components render correctly"

### 7. Supabase Type Generation

**Decision**: Run `supabase gen types typescript` against the provisioned project
and commit the output to `types/supabase.ts`. Regenerate after each schema change.

**Rationale**: Auto-generated types provide type safety for all database queries
without manual maintenance. Committing the file ensures all team members and CI
have consistent types without needing access to the Supabase CLI.

**Alternatives considered**:
- Manual types — drift from actual schema is inevitable
- Generate on build — adds build time and requires Supabase CLI in CI

### 8. Error Message Mapping

**Decision**: Create a centralized `lib/errors/supabase.ts` that maps Supabase
error codes and messages to human-readable strings. All components display errors
through this mapper.

**Rationale**: Constitution requires human-readable error messages. Supabase returns
raw error codes (e.g., "User already registered", "Invalid login credentials") that
are sometimes too technical or inconsistent. A single mapper ensures consistency
and makes i18n possible in the future.

**Alternatives considered**:
- Display Supabase errors directly — inconsistent wording, sometimes exposes
  internal details
- Per-component error handling — duplicate logic, inconsistent messages
