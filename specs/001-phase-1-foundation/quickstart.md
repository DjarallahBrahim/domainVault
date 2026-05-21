# Quickstart: Phase 1 — Foundation

**Audience**: Developers setting up DomainVault locally for the first time.

## Prerequisites

- Node.js 20+ and npm 10+
- Git
- A Supabase project (free tier is sufficient)
- (Optional) Supabase CLI for local development

## 1. Clone & Install

```bash
git clone <repo-url> domainvault
cd domainvault
npm install
```

## 2. Environment Variables

Copy the example env file and fill in your Supabase project credentials:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-dashboard>
```

The `anon` key is designed to be public — it is safe to expose in the browser because
Row Level Security (RLS) policies restrict all data access to the authenticated user.
The secret `service_role` key is NOT used in Phase 1.

**Important**: Never commit `.env.local`. It is in `.gitignore`.

## 3. Database Setup

Apply the migration to your Supabase project:

**Option A — Supabase CLI (recommended):**
```bash
npx supabase db push
```

**Option B — Manual (Supabase SQL Editor):**
1. Open your Supabase project → SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run

Verify the migration:
- Tables `domains`, `sales`, `import_logs` should exist in the `public` schema
- RLS should be enabled on all three tables
- Indexes should exist on `user_id`, `expiration_date`, and `status`

## 4. Generate Supabase Types

```bash
npx supabase gen types typescript --db-url <connection-string> > types/supabase.ts
```

Or use the npm script:
```bash
npm run types:generate
```

## 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 6. Verify Phase 1

Walk through the Definition of Done:

- [ ] Navigate to `/` — should redirect to `/login` (unauthenticated)
- [ ] Click "Register" — create an account (email + 8-char password with number)
- [ ] Check email for verification link — click it
- [ ] Return to app — login with verified credentials
- [ ] Dashboard loads with sidebar (desktop) or bottom tab bar (mobile)
- [ ] Navigate to all 5 sections (Dashboard, Domains, Import, Sales, Settings)
- [ ] Toggle theme — dark ↔ light, persists on reload
- [ ] Logout from sidebar (desktop) or Settings (mobile) — redirects to `/login`
- [ ] Request password reset — email received, reset link works

## 7. Lint & Type Check

```bash
npm run lint        # ESLint — must pass with zero warnings
npm run typecheck   # TypeScript — must pass with zero errors
```

## Project Structure Reference

```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout (fonts, theme provider)
  page.tsx              # Redirect handler
  (auth)/               # Unauthenticated pages
  (dashboard)/          # Protected pages (shell wrapper)
components/             # Reusable components
  ui/                   # shadcn/ui primitives
  auth/                 # Auth form components
  layout/               # Sidebar, bottom tab bar, theme toggle
  providers/            # React context providers
lib/                    # Shared utilities
  supabase/             # Supabase client (browser + server)
  validations/          # Zod schemas
  errors/               # Error mappers
  hooks/                # Custom React hooks
middleware.ts           # Route protection
types/supabase.ts       # Auto-generated Supabase types
supabase/migrations/    # SQL migration files
```

## Common Issues

| Issue | Solution |
|---|---|
| "Invalid login credentials" on first login | Verify email first (check inbox/spam) |
| Theme flash on reload | Ensure `<ThemeProvider>` wraps root layout and `suppressHydrationWarning` is on `<html>` |
| Sidebar shows on mobile | Viewport ≤768px triggers bottom tab bar; check your browser DevTools device emulation |
| Migration fails "relation already exists" | The migration is idempotent — the error is informational unless followed by data loss |
| TypeScript errors in `types/supabase.ts` | Regenerate after schema changes: `npm run types:generate` |

## Next Steps

After Phase 1 is verified, proceed to Phase 2:

- `/speckit.specify Phase 2 — CSV Import & Domain Management`
- Or run `npx supabase migration new` if schema changes are needed
