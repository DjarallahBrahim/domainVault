# Quickstart: Phase 3 — Dashboard & Analytics

**Date**: 2026-05-22

## Prerequisites

- Phase 1 & 2 complete: auth, app shell, theme, database, CSV import, domain management
- Node.js 18+ and npm 9+
- Supabase project with domains table populated (test data from Phase 2 imports)

## Quick Start

```bash
# 1. Ensure you're on the Phase 3 branch
git checkout 003-dashboard-analytics

# 2. Install new dependency
npm install recharts@2

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
# Login → Dashboard should show portfolio analytics
```

## New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `recharts` | ^2 | Bar charts for TLD distribution, expiration timeline, value distribution |

## New Files

```text
lib/supabase/queries/dashboard.ts    # Dashboard aggregate queries
components/dashboard/                 # Dashboard feature components (7 files)
app/(dashboard)/dashboard/page.tsx    # Dashboard page (replaces Phase 1 placeholder)
```

## Existing Dependencies Used

| Package | Already Installed (Phase) | Used For |
|---|---|---|
| `@tanstack/react-query` | Phase 2 | Optional client hydration |
| `date-fns` | Phase 1 | Date calculations (daysUntil, formatting) |
| `shadcn/ui Card` | Phase 1 | Summary cards |
| `shadcn/ui Table` | Phase 2 | Expiring domains table |
| `shadcn/ui Badge` | Phase 2 | Expiry status badges |
| `shadcn/ui Skeleton` | Phase 2 | Loading states |

## Verification Checklist

1. **Dependencies**: `npm ls recharts` — installed
2. **Build**: `npm run build` — zero errors
3. **TypeScript**: `npx tsc --noEmit` — passes
4. **Dashboard loads**: Navigate to `/dashboard` — summary cards visible
5. **Charts render**: TLD distribution and expiration timeline charts visible
6. **Auto-transition**: Set a domain's expiration date to yesterday, status to "active", reload dashboard — status changes to "expired"
7. **Empty state**: Create a user with no domains — empty state with import CTA visible
8. **Responsive**: Test dashboard at 375px, 768px, 1024px, 1920px — charts resize
9. **Theme**: Toggle dark/light mode — charts and cards render correctly in both themes
10. **Phase 1/2 regression**: Login, domains list, import page all still functional
