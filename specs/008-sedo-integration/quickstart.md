# Quickstart: Sedo Integration

**Date**: 2026-06-08

## Prerequisites

- Node.js 18+
- Supabase project with existing schema (domains, sales, import_logs, promotion_events)
- Sedo Partner Program account (Partner ID + Sign Key)

## Database Setup

The tables (`user_settings`, `sedo_listings`) and `domains.bin` column already exist in the Supabase project. Migration files are for history only.

```bash
# No action needed — tables exist. Files are documentation:
ls supabase/migrations/
# 004_bin_column.sql      — history/documentation only
# 005_user_settings.sql   — history/documentation only
# 006_sedo_listings.sql   — history/documentation only
```

## Install Dependencies

```bash
npm install @xmldom/xmldom
npm install --save-dev @types/xmldom
```

## Environment Variables

No new environment variables required. Sedo credentials are stored per-user in `user_settings` (not in `.env`).

## Development Order

### 1. Types (`types/sedo.ts`)
Create shared TypeScript types: `SedoCredentials`, `SedoListing`, `SedoInsertPayload`, `SedoUserSettings`.

### 2. Sedo Client (`lib/sedo/client.ts`)
Build `callSedo(fn, params)`:
- Construct URL with auth params
- Fetch + parse XML
- Handle `SEDOFAULT` and errors

### 3. Pricing Utilities (`lib/sedo/pricing.ts`)
Build `computeSedoPricing()`, `askingPriceSuggestions()`, `minPriceSuggestions()`.

### 4. Database Queries
Create query files for `user_settings` and `sedo_listings` (server + client variants):
- `lib/supabase/queries/settings.ts` / `settings-client.ts`
- `lib/supabase/queries/sedo-listings.ts` / `sedo-listings-client.ts`

Update `lib/query-keys.ts` with new keys: `['user-settings']`, `['sedo-listings']`.

### 5. API Routes
Build in order: `check → list → insert → edit → delete`.
Each route follows the shared pattern: auth → credentials → callSedo → return.

### 6. Settings Page
Build `SettingsPage.tsx` (layout) and `SedoCredentialsForm.tsx` (form with test + save).
Update `app/(dashboard)/settings/page.tsx` to use new components.

### 7. Hooks
Build `useSedoListings` (read cache as Map) and `useSedoSync` (sync mutation).

### 8. Domains Page — Table Columns
Build `SedoCell.tsx` (desktop) and `SedoCardRow.tsx` (mobile).
Add `BIN` and `Sedo` columns to existing `DomainTable` and `DomainMobileCard`.

### 9. Sedo Overlay
Build `SedoOverlay.tsx` — unified component for create/edit/delete.
Integrate asking price chips (from `bin`) and min offer chips (live recalculation).

### 10. Sync Button
Build `SedoSyncButton.tsx` — placed in Domains page toolbar.

## Testing Checklist

- [ ] Settings page: Save credentials → Test Connection → badge updates
- [ ] Settings page: Password masked on reload, toggle visibility works
- [ ] Settings page: Change password flow works
- [ ] Domains page: BIN column visible + editable
- [ ] Domains page: Sedo column shows "Not Listed" (empty cache)
- [ ] Sync: Click Sync → cache populates → prices show
- [ ] List: Actions → "List on Sedo" → overlay → submit → price appears
- [ ] Edit: Click ✏️ → overlay → change price → update → price updates
- [ ] Remove: Click ✏️ → "Remove from Sedo" → confirm → "Not Listed"
- [ ] Sync: Delist on Sedo.com → sync → row reverts to "Not Listed"
- [ ] Mobile: All flows work at 375px (bottom sheet overlay)
- [ ] Errors: Sedo fault → inline error in overlay
- [ ] Errors: Network failure → toast
- [ ] No credentials: Sync disabled, overlay blocked
- [ ] Zero TypeScript errors: `npm run typecheck`
