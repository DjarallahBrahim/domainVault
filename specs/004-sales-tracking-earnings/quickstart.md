# Quickstart: Phase 4 — Sales Tracking & Earnings

**Date**: 2026-05-22

## Prerequisites

- Phase 1, 2, 3 complete
- Sales table exists from Phase 1 migration
- Node.js 18+ and npm 9+

## Quick Start

```bash
# 1. Ensure you're on the Phase 4 branch
git checkout 004-sales-tracking-earnings

# 2. No new dependencies needed — all already installed

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
# Navigate to Sales → should show empty state
```

## No New Dependencies

Phase 4 uses only existing packages:
- React Hook Form + Zod (Phase 1)
- TanStack Query (Phase 2)
- date-fns (Phase 1)
- shadcn/ui (Phase 1/2)

## New Files

```text
lib/supabase/queries/sales.ts           # Server-side sales queries
lib/supabase/queries/sales-client.ts    # Client-side sales mutations
lib/validations/sales.ts                # Sale form Zod schema
components/sales/                       # Sales feature components (5 files)
app/(dashboard)/sales/page.tsx          # Sales page (replaces Phase 1 placeholder)
```

## Verification Checklist

1. **Build**: `npm run build` — zero errors
2. **TypeScript**: `npx tsc --noEmit` — passes
3. **Sales page**: Navigate to `/sales` — empty state visible
4. **Log sale**: From domain detail or Sales page — form works, sale appears in list
5. **Earnings summary**: Log 3+ sales — summary shows correct total, avg, highest
6. **Auto-association**: Log sale for existing domain — domain status → "sold"
7. **Expired warning**: Log sale for expired domain — warning appears, confirm works
8. **Edit sale**: Edit a sale — price changes reflected in summary
9. **Delete sale**: Delete a sale — removed from list, domain status reverts if last sale
10. **Phase 1/2/3 regression**: Login, domains, import, dashboard all still functional
