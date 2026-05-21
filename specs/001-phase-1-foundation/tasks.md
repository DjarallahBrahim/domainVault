# Tasks: Phase 1 — Foundation

**Input**: Design documents from `/specs/001-phase-1-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Pages**: `app/` with route groups `(auth)/` and `(dashboard)/`
- **Components**: `components/<feature>/`
- **Utilities**: `lib/`
- **Database**: `supabase/migrations/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the Next.js project, install dependencies, configure toolchain.

- [ ] T001 Initialize Next.js 14+ App Router project with TypeScript strict mode, Tailwind CSS, ESLint, and App Router enabled
- [ ] T002 [P] Install npm packages: @supabase/supabase-js, @supabase/ssr, @hookform/resolvers, react-hook-form, zod, next-themes, date-fns, zustand, lucide-react
- [ ] T003 [P] Initialize shadcn/ui and add components: button, input, label, card, separator, dropdown-menu, avatar, sheet, sonner (toast)
- [ ] T004 [P] Configure ESLint in eslint.config.mjs with no-unused-vars as error and zero-warnings policy; configure Prettier in .prettierrc with singleQuote, trailingComma, printWidth 100
- [ ] T005 [P] Create .env.example with NEXT_PUBLIC_SUPABASE_URL= and NEXT_PUBLIC_SUPABASE_ANON_KEY= placeholders
- [ ] T006 [P] Configure tsconfig.json: strict mode, noUnusedLocals true, noUnusedParameters true, paths alias @/* to ./*
- [ ] T007 [P] Configure tailwind.config.ts: darkMode "class", extend theme with constitution colors (bg-primary #0a0a0f, bg-surface #111118, bg-elevated #1a1a24, accent-primary #6366f1, accent-success #10b981, accent-warning #f59e0b, accent-danger #ef4444, text-primary #f1f5f9, text-muted #64748b, border #1e1e2e), fonts (Syne for headings, DM Sans for body, JetBrains Mono for mono), breakpoints (sm 640px, md 768px, lg 1024px, xl 1280px)

**Checkpoint**: npm run dev starts; shadcn/ui components importable; Tailwind has dark mode + custom tokens.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by all user stories. MUST complete before any user story work begins.

- [ ] T008 Create lib/supabase/client.ts: export createClient() using createBrowserClient from @supabase/ssr with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; single instance pattern
- [ ] T009 [P] Create lib/supabase/server.ts: export createClient() using createServerClient from @supabase/ssr reading env vars and managing cookies via next/headers cookies(); for server components
- [ ] T010 [P] Create lib/validations/auth.ts: Zod schemas — registerSchema (email valid, password min 8 chars + at least 1 digit via .regex()), loginSchema (email valid, password min 1 char), resetPasswordSchema (email valid); export inferred TypeScript types
- [ ] T011 [P] Create lib/validations/index.ts: re-export all schemas from auth.ts
- [ ] T012 [P] Create lib/errors/supabase.ts: export function mapAuthError(error) that maps Supabase auth error codes to human-readable strings (e.g., "User already registered" -> "An account with this email already exists", "Invalid login credentials" -> "Invalid email or password")
- [ ] T013 [P] Create lib/hooks/use-auth.ts: Zustand store useAuthStore with user, loading, setUser(), clearUser(), setLoading(); export the hook
- [ ] T014 Create middleware.ts at project root: import createServerClient, check Supabase session for protected routes (/dashboard, /domains, /import, /sales, /settings); redirect unauthenticated requests to /login; add matcher config excluding static assets, _next, favicon
- [ ] T015 [P] Create types/supabase.ts stub: empty Database interface; will be regenerated after schema migration (T044)

**Checkpoint**: Supabase clients connect, middleware protects routes, Zod schemas validate forms, error mapper returns readable strings, auth store manages state.

---

## Phase 3: User Story 1 & 2 — Registration + Login + Password Reset (Priority: P1)

**Goal**: Users register, verify email, log in, reset password, log out. Unauthenticated blocked. Unverified redirected to verification screen.

**Independent Test**: Register with valid email + password (8+ chars, 1+ number), verify email, login, confirm dashboard redirect. Test bad credentials -> "Invalid email or password". Test duplicate email -> inline error. Test weak password -> inline error. Test forgot password flow -> email received -> reset -> login with new password.

### US1 — Registration

- [ ] T016 [P] [US1] Create app/(auth)/register/page.tsx: server component rendering RegisterForm; metadata title "Register — DomainVault"
- [ ] T017 [US1] Create components/auth/register-form.tsx: client component with React Hook Form + Zod registerSchema; email, password, confirm-password fields; submit calls supabase.auth.signUp() with emailRedirectTo set to origin/auth/callback; inline Zod validation errors; Supabase errors via mapAuthError() displayed inline; on success show toast "Check your email for a verification link" and redirect to /login; link "Already have an account? Sign in"
- [ ] T018 [P] [US1] Create app/verify-email/page.tsx: server component; displays "Please verify your email — check your inbox" with "Resend verification" button (client component calling supabase.auth.resend())
- [ ] T019 [P] [US1] Create app/auth/callback/route.ts: Route Handler for Supabase email callback; reads code from URL, exchanges for session via supabase.auth.exchangeCodeForSession(), redirects to /dashboard on success (only Route Handler in Phase 1, required by Supabase)

### US2 — Login & Password Reset

- [ ] T020 [P] [US2] Create app/(auth)/login/page.tsx: server component rendering LoginForm; metadata title "Login — DomainVault"
- [ ] T021 [US2] Create components/auth/login-form.tsx: client component with React Hook Form + Zod loginSchema; email, password fields; submit calls supabase.auth.signInWithPassword(); success -> redirect /dashboard; failure -> mapAuthError() inline; link "Forgot password?" and "Don't have an account? Register"
- [ ] T022 [P] [US2] Create app/(auth)/reset-password/page.tsx: server component rendering ResetPasswordForm; metadata title "Reset Password — DomainVault"
- [ ] T023 [US2] Create components/auth/reset-password-form.tsx: client component with React Hook Form + Zod resetPasswordSchema; email field; submit calls supabase.auth.resetPasswordForEmail() with redirectTo set to origin/auth/callback; on success show toast "Password reset email sent" with disabled state; link back to /login

**Checkpoint**: Register -> verify email -> login -> logout works end-to-end. Password reset delivers email. Protected routes redirect to /login. Unverified users blocked.

---

## Phase 4: User Story 3 — App Shell & Navigation (Priority: P2)

**Goal**: Authenticated users see sidebar (desktop >=768px) or bottom tab bar (mobile <=768px) with all 5 sections. Active route highlighted. Sidebar footer: avatar + email + logout. Mobile logout from Settings. Root / redirects correctly.

**Independent Test**: Login, verify sidebar on desktop with all 5 links + active highlight + footer with avatar/email/logout. Resize to mobile, verify bottom tab bar with icon nav + active tab highlight. Settings page has logout. Navigate all 5 sections. Verify / redirects correctly for auth/unauth.

### US3 Implementation

- [ ] T024 [P] [US3] Create components/layout/sidebar.tsx: client component; fixed left sidebar (w-64); nav links — Dashboard (LayoutDashboard icon), Domains (Globe), Import (Upload), Sales (DollarSign), Settings (Settings) — all Lucide React; usePathname() highlights active link with accent-primary bg; visible on md: and above, hidden below
- [ ] T025 [P] [US3] Create components/layout/bottom-tab-bar.tsx: client component; fixed bottom bar (h-16); 5 icon-only tabs with same Lucide icons; active tab gets accent-primary color + label shown; other tabs text-muted no label; visible below md, hidden md: and above; usePathname() for active detection
- [ ] T026 [P] [US3] Create components/layout/sidebar-footer.tsx: client component at sidebar bottom; reads user from useAuthStore (Zustand); SVG avatar circle with initials (first letter of email, color from deterministic palette based on email hash); email with truncate overflow; LogOut button calls supabase.auth.signOut() -> router.push('/login') -> clearUser()
- [ ] T027 [P] [US3] Create app/(dashboard)/settings/page.tsx: client component; displays user email and Logout button (needed on mobile where sidebar logout hidden); logout calls signOut() -> router.push('/login') -> clearUser(); placeholder for future account settings
- [ ] T028 [US3] Create app/(dashboard)/layout.tsx: server component; verifies session via createClient() — redirects unverified to /verify-email, unauthenticated to /login; wraps children in responsive shell: Sidebar (desktop), BottomTabBar (mobile), main with p-4 md:p-6 lg:p-8; includes Toaster from sonner for toast notifications
- [ ] T029 [P] [US3] Create app/(dashboard)/dashboard/page.tsx: server component placeholder; heading "Dashboard" + "Your analytics will appear here in Phase 3"
- [ ] T030 [P] [US3] Create app/(dashboard)/domains/page.tsx: server component placeholder; heading "Domains" + "Domain management coming in Phase 2"
- [ ] T031 [P] [US3] Create app/(dashboard)/domains/[id]/page.tsx: server component placeholder; heading "Domain Detail" + "Coming in Phase 2"
- [ ] T032 [P] [US3] Create app/(dashboard)/import/page.tsx: server component placeholder; heading "Import" + "CSV import coming in Phase 2"
- [ ] T033 [P] [US3] Create app/(dashboard)/sales/page.tsx: server component placeholder; heading "Sales" + "Sales tracking coming in Phase 4"
- [ ] T034 [US3] Create app/page.tsx: server component; reads session via createClient(); redirect() to /dashboard if authenticated, /login if not

**Checkpoint**: Sidebar on desktop, bottom tabs on mobile, all 5 sections navigable, active routes highlighted, logout works on both viewports, / redirects correctly.

---

## Phase 5: User Story 4 — Theme Switching (Priority: P2)

**Goal**: Dark/light toggle in sidebar, persisted, defaults to OS preference, instant transition with no flash.

**Independent Test**: First visit theme matches OS preference. Toggle theme switches instantly without reload. Reload page theme persists. Change OS pref and reload theme follows (unless user explicitly overridden). Inspect all shell components in both themes — correct colors, WCAG 2.1 AA contrast.

### US4 Implementation

- [ ] T035 [US4] Create components/providers/theme-provider.tsx: wraps next-themes ThemeProvider with attribute="class", defaultTheme="system", enableSystem=true, disableTransitionOnChange=false; export as ThemeProvider
- [ ] T036 [P] [US4] Create components/layout/theme-toggle.tsx: client component using useTheme() from next-themes; toggle button with Sun/Moon Lucide icons in sidebar header; onClick calls setTheme(theme === 'dark' ? 'light' : 'dark'); shows opposite icon based on current theme
- [ ] T037 [US4] Create app/layout.tsx: root layout; import Syne, DM Sans, JetBrains Mono via next/font/google with variable CSS variable names; wrap children in ThemeProvider; suppressHydrationWarning on html tag; className font variables + Tailwind classes; metadata title "DomainVault" description "Professional domain portfolio management"

**Checkpoint**: Theme toggle works from sidebar. Persists on reload. OS preference respected on first visit. No flash of unstyled content.

---

## Phase 6: User Story 5 — Database Initialization (Priority: P3)

**Goal**: Migration creates domains, sales, import_logs tables with columns, constraints, indexes, and RLS policies. Migration is idempotent.

**Independent Test**: Run migration against fresh Supabase project. Verify 3 tables exist with correct columns/indexes. Insert data as 2 different users — each sees only own rows. Rerun migration — no errors. Delete user — data cascade-deletes.

### US5 Implementation

- [ ] T038 [US5] Create supabase/migrations/001_initial_schema.sql with the following in order:
  1. CREATE TABLE IF NOT EXISTS public.domains with columns: id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, domain TEXT NOT NULL, tld TEXT GENERATED ALWAYS AS (split_part(domain, '.', -1)) STORED, expiration_date DATE NOT NULL, purchase_price DECIMAL(10,2), status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','sold','pending')), registrar TEXT, notes TEXT, tags TEXT[], created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, domain)
  2. CREATE TABLE IF NOT EXISTS public.sales with columns: id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, domain_id UUID REFERENCES domains(id) ON DELETE SET NULL, domain_name TEXT NOT NULL, sale_price DECIMAL(10,2) NOT NULL, sold_at DATE NOT NULL, buyer TEXT, platform TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
  3. CREATE TABLE IF NOT EXISTS public.import_logs with columns: id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, filename TEXT NOT NULL, total_rows INT NOT NULL, imported INT NOT NULL, skipped INT NOT NULL, errors JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
  4. CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id), idx_domains_expiration ON domains(expiration_date), idx_domains_status ON domains(status), idx_sales_user_id ON sales(user_id), idx_sales_sold_at ON sales(sold_at)
  5. ALTER TABLE domains ENABLE ROW LEVEL SECURITY (same for sales, import_logs)
  6. DROP POLICY IF EXISTS then CREATE POLICY for "own domains" ON domains FOR ALL USING (auth.uid() = user_id) (same pattern for sales "own sales", import_logs "own import_logs")
  7. CREATE OR REPLACE FUNCTION update_updated_at_column() returning trigger setting updated_at = NOW(); CREATE TRIGGER before_update ON domains before each row update

**Checkpoint**: All 3 tables exist with RLS. Migration reruns without errors. Row-level data isolation confirmed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Loading states, error handling, scripts, final verification.

- [ ] T039 [P] Create app/(auth)/loading.tsx: skeleton loader for auth pages — centered card with pulsing content blocks matching auth form dimensions
- [ ] T040 [P] Create app/(dashboard)/loading.tsx: skeleton loader for dashboard pages — sidebar skeleton (desktop) / bottom tab skeleton (mobile) with pulsing main content area
- [ ] T041 [P] Create components/shared/supabase-error-boundary.tsx: client component error boundary catching Supabase auth errors; displays human-readable message with retry button
- [ ] T042 Configure next.config.mjs: set images.remotePatterns for Supabase avatar images if needed; ensure serverActions enabled
- [ ] T043 Update package.json scripts: "dev", "build", "start", "lint", "typecheck": "tsc --noEmit", "types:generate": "supabase gen types typescript > types/supabase.ts", "format": "prettier --write .", "format:check": "prettier --check ."
- [ ] T044 Run npm run types:generate against provisioned Supabase project to update types/supabase.ts with actual schema types (requires T038 complete and DB provisioned)
- [ ] T045 Run npm run lint && npm run typecheck; fix any errors; zero warnings, zero any types, zero unused imports required
- [ ] T046 Full DoD walkthrough per quickstart.md: register -> verify email -> login -> navigate all 5 sections -> toggle theme -> logout -> password reset -> protected URLs unauth -> confirm redirect to /login

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs packages, configs) — BLOCKS all user stories
- **US1 & US2 — Auth (Phase 3)**: Depends on Foundational; US2 (login) testing needs US1 (registered account), but code is independent
- **US3 — App Shell (Phase 4)**: Depends on Foundational; code-independent of auth, practical testing needs auth
- **US4 — Theme (Phase 5)**: Depends on Foundational + US3 (sidebar exists for theme toggle placement)
- **US5 — Database (Phase 6)**: Depends only on Foundational; completely independent; needs Supabase project provisioned
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Registration)**: After Foundational. No story dependencies.
- **US2 (Login)**: After Foundational. Code independent of US1.
- **US3 (App Shell)**: After Foundational. Independent of US1/US2 for code.
- **US4 (Theme)**: After Foundational + US3. Independent of auth stories.
- **US5 (Database)**: After Foundational. Independent of all other stories.

### Within Each Phase

- Utilities before components; shared components before pages that use them
- Server component pages parallel with client component implementations
- Core implementation before integration
- Story complete before next priority

### Parallel Opportunities

- T002-T007: All setup configs (different files, no deps)
- T008, T009, T010, T011, T012, T013, T015: All foundational utilities (different files)
- T016, T018, T019: US1 server pages (different files)
- T020, T022: US2 server pages (different files)
- T017, T021, T023: US1+US2 client components (different files)
- T024, T025, T026, T027: US3 layout components (different files)
- T029, T030, T031, T032, T033: US3 placeholder pages (different files)
- T035, T036: US4 components (different files)
- T039, T040, T041: Polish loading/error components (different files)
- US3 + US4 + US5 can be built in parallel after Foundational

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 + US2 — Registration, Login, Password Reset
4. STOP and VALIDATE: Full auth flow works end-to-end
5. User can register, verify email, login, logout

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 + US2 -> Test independently -> Deploy (MVP: auth working!)
3. Add US3 -> Test independently -> Deploy (app shell with navigation)
4. Add US4 -> Test independently -> Deploy (theme switching)
5. Add US5 -> Test independently -> Deploy (database schema provisioned)
6. Polish -> Final verification -> Phase 1 complete

### Single Developer Strategy

Execute phases in order (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7). Within each phase, parallelize tasks marked [P] by opening multiple files and working on them in rapid succession.

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US5 (database) can be done anytime after Foundational — consider doing it early so types/supabase.ts is available
- The only Route Handler in Phase 1 is app/auth/callback/route.ts (required by Supabase auth flow)
- All other operations use direct Supabase client (no custom API routes)
- Commit after each phase or logical group of tasks
- Run npm run lint && npm run typecheck after each phase
