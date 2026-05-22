# Quickstart: Phase 2 — CSV Import & Domain Management

**Date**: 2026-05-22

## Prerequisites

- Phase 1 complete: auth flow, app shell, theme, and database migration applied
- Node.js 18+ and npm 9+
- Supabase project with `001_initial_schema.sql` migration applied
- Environment variables set (`.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Quick Start

```bash
# 1. Ensure you're on the Phase 2 branch
git checkout 002-csv-import-domain-management

# 2. Install new dependencies (added in Phase 2)
npm install @tanstack/react-query@5 @tanstack/react-query-devtools@5 papaparse@5 sonner@1
npm install -D @types/papaparse@5

# 3. Add new shadcn/ui components (npx shadcn-ui add)
npx shadcn@latest add table dialog select badge sonner skeleton

# 4. Start the dev server
npm run dev

# 5. Open http://localhost:3000
# Login with a verified account, navigate to Domains and Import
```

## New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-query` | ^5 | Server state management, cache, optimistic updates |
| `@tanstack/react-query-devtools` | ^5 | Devtools for debugging queries (dev only) |
| `papaparse` | ^5 | Client-side CSV parsing |
| `sonner` | ^1 | Toast notifications for async operation feedback |

## New shadcn/ui Components

| Component | Command | Purpose |
|---|---|---|
| `table` | `npx shadcn@latest add table` | Domain list and import history tables |
| `dialog` | `npx shadcn@latest add dialog` | Delete confirmation, error details |
| `select` | `npx shadcn@latest add select` | Status filter, status edit dropdown |
| `badge` | `npx shadcn@latest add badge` | Status and expiry badges |
| `sonner` | `npx shadcn@latest add sonner` | Toast notification system |
| `skeleton` | `npx shadcn@latest add skeleton` | Loading placeholders for tables and forms |

## Project Structure (New Files)

```
lib/
├── query-keys.ts              # TanStack Query centralized keys
├── supabase/
│   └── queries/
│       ├── domains.ts          # Typed domain CRUD helpers
│       └── import-logs.ts      # Typed import log read helpers
└── validations/
    └── domain.ts               # Zod schemas (edit form, CSV row, filters)

components/
├── domains/                    # Domain feature components
├── import/                     # CSV import feature components
├── history/                    # Import log history components
└── ui/                         # New shadcn/ui primitives

app/(dashboard)/
├── domains/
│   ├── page.tsx                # Domain list (server component + hydration)
│   └── [id]/page.tsx           # Domain detail + edit (client component)
├── import/
│   └── page.tsx                # CSV import (client component)
└── import/history/
    └── page.tsx                # Import log history (client component)
```

## Verification Checklist

After setup, verify everything works:

1. **Dependencies**: `npm ls @tanstack/react-query papaparse sonner` — all installed
2. **Components**: `ls components/ui/table.tsx components/ui/dialog.tsx` — all exist
3. **Build**: `npm run build` — zero errors, zero warnings
4. **TypeScript**: `npx tsc --noEmit` — passes
5. **Dev server**: `npm run dev` starts and all Phase 1 pages still work
6. **Auth**: Login/logout still functional
7. **Theme**: Dark/light toggle still works
8. **Navigation**: All 5 sections (Dashboard, Domains, Import, Sales, Settings) are
   reachable; Domains and Import show placeholder content in Phase 1 (replaced by
   Phase 2 components during implementation)

## Environment Variables

No new environment variables are needed for Phase 2. The existing Supabase
credentials from Phase 1 are sufficient — domain CRUD uses the same anon key
and RLS policies.
