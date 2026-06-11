# Quickstart: Spaceship SellerHub Integration

**Date**: 2026-06-08

## Prerequisites

- Node.js 18+
- Supabase project with existing schema
- Spaceship account with API Key + Secret (from Spaceship API Manager)

## Database Setup

```sql
-- Extend user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS spaceship_api_key TEXT,
  ADD COLUMN IF NOT EXISTS spaceship_api_secret TEXT;

-- Create listings cache
CREATE TABLE IF NOT EXISTS spaceship_listings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id             UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
  domain_name           TEXT NOT NULL,
  spaceship_domain_id   TEXT,
  spaceship_price       DECIMAL(10,2) NOT NULL,
  spaceship_currency    TEXT NOT NULL DEFAULT 'USD',
  last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaceship_listings_user_id   ON spaceship_listings(user_id);
CREATE INDEX idx_spaceship_listings_domain_id ON spaceship_listings(domain_id);

ALTER TABLE spaceship_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own spaceship_listings" ON spaceship_listings
  FOR ALL USING (auth.uid() = user_id);
```

## No New Dependencies

Spaceship uses REST/JSON — no new npm packages needed.

## Development Order

### 1. Database + Types
- Run migration SQL
- Add `spaceship_listings` to `types/supabase.ts`
- Add Spaceship columns to `user_settings` types
- Create `types/spaceship.ts`

### 2. Spaceship Client (`lib/spaceship/client.ts`)
- Build REST client with header auth
- Handle 401, 429, 5xx responses
- JSON response parsing

### 3. Supabase Queries
- `lib/supabase/queries/spaceship-listings.ts` (server)
- `lib/supabase/queries/spaceship-listings-client.ts` (client)
- `lib/supabase/queries/settings.ts` — add Spaceship fields

### 4. Query Keys
- Add `['spaceship-listings']` to `lib/query-keys.ts`

### 5. API Routes
- Build in order: `list → get → create → update → delete`

### 6. Settings Page
- Add Spaceship credentials form to `SettingsPage.tsx`

### 7. Hooks
- `useSpaceshipListings` — read cache as Map
- `useSpaceshipSync` — full sync mutation
- `useSpaceshipRefreshOne` — per-domain sync

### 8. Domains Page
- Add SpaceshipCell, SpaceshipOverlay, SpaceshipSyncButton
- Add column to table + cards
- Wire hooks in domain-list-client
- Update filters dropdown

## Testing Checklist

- [ ] Settings: save/toggle test/get credentials
- [ ] Domains: Spaceship column renders "Not Listed" (empty cache)
- [ ] Sync: click → cache populates → prices show
- [ ] List: + → overlay → submit → price appears
- [ ] Edit: ✏️ → overlay → change price → updates
- [ ] Remove: ✏️ → "Remove" → confirm → "Not Listed"
- [ ] Per-domain sync: ↻ → price refreshes
- [ ] Mobile: overlay bottom sheet, all flows
- [ ] Filters: "Not listed on Spaceship" works
- [ ] Sedo column coexists without layout issues
- [ ] Zero TypeScript errors
