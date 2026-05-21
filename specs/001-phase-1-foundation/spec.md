# Feature Specification: Phase 1 — Foundation

**Feature Branch**: `001-phase-1-foundation`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "read plan.md and create specification for the phase 1: PHASE 1 · Foundation"

## Clarifications

### Session 2026-05-21

- Q: Should login, registration, and password-reset endpoints have rate limiting or throttling? → A: No rate limiting in Phase 1 — deferred to a future security hardening iteration.
- Q: Can an unverified user access the dashboard and other protected pages, or are they completely blocked until verification? → A: Hard-gate — unverified users are blocked from all protected pages and redirected to a "please verify your email" screen.
- Q: How long should an authenticated session last before requiring re-login? → A: Indefinite session — Supabase default token refresh and expiry behavior is used with no custom expiry configured.
- Q: How does the application connect to Supabase — direct client or through custom API routes? → A: Direct Supabase client using the public `anon` key via `@supabase/ssr`; no custom Next.js API routes are used for auth or CRUD in Phase 1. RLS policies provide data isolation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Registration (Priority: P1)

A new domain investor visits DomainVault for the first time. They fill in their email
address and choose a password (minimum 8 characters, at least 1 number) and submit.
The system creates their account, sends an email verification message, and redirects
them to the dashboard. If the email is already registered, an inline error message
appears next to the email field without clearing the form.

**Why this priority**: Registration is the entry point — no other stories are accessible
without an account. It is the critical first step in the user lifecycle.

**Independent Test**: Can be fully tested by opening the registration page, submitting
valid credentials, checking the email inbox for verification, then attempting a
duplicate registration to confirm the error handling. Delivers a verified user account
ready for login.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit an email and a
   password (8+ chars, 1+ number), **Then** their account is created, a verification
   email is sent, and they are redirected to the dashboard.
2. **Given** a visitor on the registration page, **When** they submit a password
   shorter than 8 characters or without a number, **Then** an inline validation error
   appears below the password field and no account is created.
3. **Given** a visitor on the registration page, **When** they submit an email that
   already exists in the system, **Then** an inline error appears ("An account with
   this email already exists") and the form remains filled.
4. **Given** a registered user with an unverified email, **When** they attempt to
   access any protected page, **Then** they are blocked from all protected routes
   and redirected to a "Please verify your email" screen until verification is
   complete.

---

### User Story 2 — Login & Password Reset (Priority: P1)

A returning user enters their email and password. On success they are redirected to the
dashboard. If credentials are wrong, a generic "Invalid email or password" message
appears. From the login page, users can trigger a password reset flow that sends a
reset link to their email. Unauthenticated visitors who attempt to access any protected
route (dashboard, domains, import, sales, settings) are redirected to the login page.

**Why this priority**: Login is the authentication gate for the entire application.
Without it, no portfolio data is accessible. It is co-equal with registration as the
entry point.

**Independent Test**: Can be fully tested by logging in with valid credentials,
attempting login with bad credentials, requesting a password reset, and attempting
direct URL access to /dashboard while unauthenticated. Delivers session access to
the dashboard.

**Acceptance Scenarios**:

1. **Given** a registered user with a verified email, **When** they submit correct
   email and password, **Then** they are authenticated and redirected to the dashboard.
2. **Given** any visitor on the login page, **When** they submit incorrect
   credentials, **Then** the message "Invalid email or password" appears and no
   session is created.
3. **Given** a user on the login page, **When** they click "Forgot password" and
   submit their email, **Then** a password reset email is sent and a confirmation
   message is displayed.
4. **Given** an unauthenticated visitor, **When** they navigate directly to
   `/dashboard`, `/domains`, `/import`, `/sales`, or `/settings`, **Then** they are
   redirected to `/login`.
5. **Given** an authenticated user on any page, **When** they click logout,
   **Then** their session ends and they are redirected to `/login`.

---

### User Story 3 — App Shell & Navigation (Priority: P2)

Once authenticated, users see a consistent application shell with navigation.
On desktop (≥768px), a collapsible sidebar lists all sections: Dashboard, Domains,
Import, Sales, Settings — with the active route visually highlighted. The sidebar
footer shows the user's avatar and email address. A logout button is accessible from
the sidebar. On mobile (≤768px), navigation moves to a bottom tab bar with the same
sections as icons. The route `/` redirects authenticated users to `/dashboard` and
unauthenticated users to `/login`.

**Why this priority**: The app shell is the structural container for every subsequent
phase. It must exist before any feature pages can be built, but does not depend on
phase 1 user stories being complete — it can be built in parallel.

**Independent Test**: Can be fully tested by logging in and navigating between all
five sections using both sidebar (desktop) and bottom tab bar (mobile), verifying
active route highlighting, checking the sidebar footer shows user info, and confirming
the logout button works. Delivers a fully navigable application skeleton.

**Acceptance Scenarios**:

1. **Given** an authenticated user on a desktop viewport (≥768px), **When** they view
   any page, **Then** a sidebar is visible with Dashboard, Domains, Import, Sales, and
   Settings links, and the current route is highlighted.
2. **Given** an authenticated user on a mobile viewport (≤768px), **When** they view
   any page, **Then** a bottom tab bar is visible with all five navigation items as
   icons, and the active tab is highlighted.
3. **Given** an authenticated user, **When** they view the sidebar footer, **Then**
   their avatar and email address are displayed.
4. **Given** an authenticated user on desktop, **When** they click logout in the
   sidebar, **Then** their session ends and they return to `/login`.
5. **Given** an authenticated user on mobile, **When** they navigate to Settings,
   **Then** a logout option is available.
6. **Given** any visitor navigating to `/`, **When** the page loads, **Then** they are
   redirected to `/dashboard` if authenticated, or `/login` if not.

---

### User Story 4 — Theme Switching (Priority: P2)

Users can toggle between dark mode and light mode using a switch in the sidebar header.
The choice is persisted so it survives page reloads and return visits. On first visit,
the theme defaults to the operating system preference. The transition between themes is
instantaneous — no flash of unstyled content or page reload. Both themes meet WCAG 2.1
AA contrast ratios and are visually polished (no half-themed components).

**Why this priority**: Theme support is required by the constitution as a first-class
feature, and the entire visual design depends on both themes being correct. It is
independent of data features and can be built in parallel with the app shell.

**Independent Test**: Can be fully tested by toggling the theme switch, reloading the
page to verify persistence, changing the OS preference and refreshing, and visually
inspecting all shell components in both themes. Delivers theme parity across the
application.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** the app loads, **Then** the theme matches
   the operating system preference (dark if OS is dark, light if OS is light).
2. **Given** a user on any page, **When** they click the theme toggle, **Then** the
   theme switches instantly between dark and light with no page reload or flash.
3. **Given** a user who switched to light mode, **When** they reload the page or close
   and reopen the browser, **Then** light mode persists.
4. **Given** any page in either theme, **When** inspected, **Then** all components
   (sidebar, navigation, text, inputs) render correctly in the selected theme and pass
   WCAG 2.1 AA contrast ratios.

---

### User Story 5 — Database Initialization (Priority: P3)

The project includes a database migration that creates all three core tables (domains,
sales, import_logs) with their columns, constraints, indexes, and Row Level Security
policies. The migration is idempotent — running it multiple times does not fail or
duplicate. All tables enforce per-user data isolation via RLS policies that match
`user_id = auth.uid()`.

**Why this priority**: The database schema underpins every subsequent data feature
(CSV import, domain management, dashboard, sales). It is a prerequisite for Phase 2,
but has no user-facing UI — making it lower priority than auth and navigation.

**Independent Test**: Can be fully tested by running the migration against a fresh
Supabase instance, verifying all three tables exist with correct columns and indexes,
inserting test data, and confirming that RLS prevents users from accessing another
user's rows. Delivers a fully provisioned database ready for Phase 2.

**Acceptance Scenarios**:

1. **Given** a fresh Supabase project, **When** the migration is applied, **Then**
   the `domains`, `sales`, and `import_logs` tables are created with all columns,
   constraints, and indexes as defined in the schema.
2. **Given** the migration has run, **When** two different authenticated users insert
   rows into `domains`, **Then** each user can only see their own rows.
3. **Given** the migration has run, **When** applied again, **Then** it completes
   without errors or duplicate objects (idempotent).
4. **Given** the migration has run, **When** a user is deleted, **Then** all their
   domains, sales, and import logs are cascade-deleted.

---

### Edge Cases

- What happens when a user submits the registration form with JavaScript disabled?
- What happens when the Supabase auth service is unreachable during login or
  registration?
- How does the app behave when localStorage is full or blocked (theme persistence)?
- What happens when a user opens the app in a browser that doesn't support
  `prefers-color-scheme` (older browsers)?
- How does the sidebar/navigation handle very long email addresses (overflow)?
- What happens when a user is on a mobile device (≤768px) and rotates to landscape
  (width may exceed 768px)?
- How are concurrent password reset requests handled (user clicks "send reset email"
  multiple times)?
- What happens if a user registers but never verifies their email — how long until the
  unverified account is cleaned up?
- Rate limiting on auth endpoints (login, registration, password reset) is explicitly
  deferred to a future phase — Phase 1 has no brute-force or abuse prevention beyond
  Supabase defaults.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to create an account with an email address
  and a password of at least 8 characters containing at least 1 number.
- **FR-002**: System MUST send an email verification message upon successful
  registration.
- **FR-003**: System MUST display an inline error when registration is attempted
  with an already-registered email address, without clearing the form.
- **FR-004**: System MUST display inline validation errors for passwords that do not
  meet the minimum length or complexity requirements.
- **FR-005**: System MUST authenticate users via email and password and redirect to
  the dashboard on success.
- **FR-006**: System MUST display a generic "Invalid email or password" message when
  login credentials are incorrect, without revealing whether the email exists.
- **FR-007**: System MUST provide a "Forgot password" flow that sends a password
  reset email to the user's registered address.
- **FR-008**: System MUST redirect unauthenticated visitors to `/login` when they
  attempt to access any protected route (`/dashboard`, `/domains`, `/import`,
  `/sales`, `/settings`).
- **FR-008a**: System MUST block unverified users from accessing any protected route
  and redirect them to a "verify your email" screen.
- **FR-009**: System MUST render a sidebar navigation on viewports ≥768px with links
  to Dashboard, Domains, Import, Sales, and Settings.
- **FR-010**: System MUST render a bottom tab bar navigation on viewports ≤768px
  with icon-based links to all five sections.
- **FR-011**: System MUST highlight the currently active navigation item in both
  sidebar and bottom tab bar.
- **FR-012**: System MUST display the authenticated user's avatar and email address
  in the sidebar footer on desktop.
- **FR-013**: System MUST provide a logout action accessible from the sidebar on
  desktop and from the Settings page on mobile.
- **FR-014**: System MUST redirect `/` to `/dashboard` for authenticated users and
  to `/login` for unauthenticated visitors.
- **FR-015**: System MUST default to the operating system's color scheme preference
  on first visit.
- **FR-016**: System MUST persist the user's theme choice across page reloads and
  browser sessions.
- **FR-017**: System MUST switch between dark and light themes instantly, without
  page reload or flash of unstyled content.
- **FR-018**: System MUST render all shell components correctly in both dark and
  light themes, meeting WCAG 2.1 AA contrast ratios.
- **FR-019**: System MUST include a database migration that creates the `domains`,
  `sales`, and `import_logs` tables with all columns, constraints, and indexes as
  defined in the project schema.
- **FR-020**: System MUST enable Row Level Security on all three tables with policies
  restricting access to rows where `user_id` matches the authenticated user.
- **FR-021**: System MUST ensure the database migration is idempotent — applying it
  multiple times does not produce errors or duplicate objects.
- **FR-022**: System MUST cascade-delete all user data (domains, sales, import_logs)
  when the user account is deleted.

### Key Entities

- **User Account**: Represents a registered domain investor. Attributes include email
  address (unique), password hash, email verification status, and creation timestamp.
  Owns all domains, sales, and import logs.
- **Domain**: Represents a domain name in the user's portfolio. Attributes include
  domain name, TLD (derived), expiration date, purchase price, status, registrar,
  notes, and tags. Belongs to exactly one user.
- **Sale**: Represents a logged sale of a domain. Attributes include domain reference,
  sale price, sale date, buyer, platform, and notes. Belongs to exactly one user.
- **Import Log**: Records each CSV import attempt. Attributes include filename, total
  row count, number imported, number skipped, and structured error details. Belongs to
  exactly one user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can complete account registration (email + password entry)
  in under 60 seconds.
- **SC-002**: A registered user can log in and reach the dashboard in under 5 seconds
  from submitting credentials.
- **SC-003**: The password reset flow delivers a reset email within 30 seconds of
  request submission.
- **SC-004**: All five navigation sections are reachable within 2 clicks/taps from any
  page on both desktop and mobile.
- **SC-005**: Theme toggle produces a visible change within 200ms with no page reload.
- **SC-006**: The database migration completes in under 30 seconds on a fresh
  Supabase instance.
- **SC-007**: 100% of shell components render correctly in both dark and light themes
  when tested across viewport widths of 375px, 768px, 1024px, and 1920px.
- **SC-008**: All protected routes return a redirect (not a blank page or error) when
  accessed without authentication.

## Assumptions

- Users have a modern browser with JavaScript enabled and local storage available.
- The Supabase project is provisioned and the connection URL and anon key are available
  as environment variables.
- Email delivery (verification and password reset) is handled by Supabase's built-in
  email service — no custom email templates are required for Phase 1.
- The application is deployed on Vercel and the build process supports Next.js 14+
  App Router.
- Fonts (Syne, DM Sans, JetBrains Mono) are loaded from Google Fonts via
  `next/font/google`.
- User avatars default to a generated identicon or initial-based placeholder until
  a custom avatar feature is added in a future phase.
- The bottom tab bar on mobile shows icon-only navigation items with labels on active
  tab only, to conserve space on small screens.
- The database migration is a SQL file managed manually during Phase 1; automated
  migration tooling (e.g., Supabase CLI migrations) is acceptable but not required.
- Session management uses Supabase's default token refresh and expiry behavior — no
  custom session duration or inactivity timeout is configured in Phase 1.
- The application connects to Supabase directly via the Supabase JS client using the
  public `anon` key — no custom Next.js API routes are needed for auth or CRUD. RLS
  policies enforce data isolation. The `service_role` key is never used in Phase 1.
