# DomainVault — Master Plan (v2)
> Use this file with the `/constitution` command in SpecKit.
> It defines the full project: principles, tech stack, database schema, all phases, and every feature spec.
>
> ### How to read tags
> - `[DONE]` — implemented and shipped, do not touch
> - `[NEW]` — does not exist yet, must be built from scratch
> - `[UPDATED]` — exists but must be modified as described
> - `[DELETED]` — existed in v1, must be removed from codebase
> - No tag — unchanged reference spec, implement only if not already done

---

## 1. Project Identity

**DomainVault** is a professional domain portfolio management platform for domain investors and businesses. It lets users import their domain portfolio via CSV or manual entry, track expiry deadlines, promote domains, log sales, and visualize portfolio performance through a modern, high-density dashboard.

---

## 2. Core Principles

- **Data integrity first** — Validate all inputs before persisting. CSV imports must handle malformed rows gracefully (log errors, skip bad rows, never corrupt data). Every mutation is auditable.
- **UX excellence** — Modern, clean, professional UI inspired by best-in-class SaaS dashboards. Dark mode and light mode are both first-class. Hover effects, micro-interactions, and smooth transitions on all interactive elements.
- **Mobile-first responsiveness** — Every screen works from 375px to 1920px.
- **Performance** — Dashboard loads in under 2 seconds. CSV imports up to 10,000 rows must not freeze the UI. All Supabase queries use indexes on `expiration_date` and `status`.
- **Security** — RLS policies ensure users access only their own data. No credentials hardcoded. CSV file content is never stored — only the parsed domain records.
- **Accessibility** — WCAG 2.1 AA minimum. All interactive elements are keyboard navigable. Color contrast passes on both themes.
- **Phased delivery** — Features are delivered in independent, shippable phases. Each phase must be fully functional before the next begins.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript strict mode |
| Styling | Tailwind CSS v3 + shadcn/ui (customized) |
| State | TanStack Query v5 (server state) + Zustand (UI state) |
| Database | Supabase — PostgreSQL with RLS enabled on all tables |
| Auth | Supabase Auth (email/password + magic link) |
| Charts | Recharts |
| CSV Parsing | PapaParse |
| Dates | date-fns |
| Icons | Lucide React |
| Theme | next-themes |
| Deployment | Vercel |

---

## 4. Design System

### Design Direction
Modern SaaS dashboard aesthetic — clean, high-density, data-forward. Inspired by the reference screenshots: sidebar navigation with clear hierarchy, KPI cards with trend indicators, rich chart widgets with hover tooltips, and a right-column panel for alerts and contextual info. Both dark and light modes are fully resolved — not afterthoughts.

### Colors (CSS variables)
```css
/* Dark mode */
--bg-primary: #0a0a0f;
--bg-surface: #111118;
--bg-elevated: #1a1a24;
--accent-primary: #6366f1;
--accent-success: #10b981;
--accent-warning: #f59e0b;
--accent-danger: #ef4444;
--text-primary: #f1f5f9;
--text-muted: #64748b;
--border: #1e1e2e;

/* Light mode */
--bg-primary: #f8fafc;
--bg-surface: #ffffff;
--bg-elevated: #f1f5f9;
--accent-primary: #6366f1;
--accent-success: #10b981;
--accent-warning: #f59e0b;
--accent-danger: #ef4444;
--text-primary: #0f172a;
--text-muted: #64748b;
--border: #e2e8f0;
```

Both modes pass WCAG 2.1 AA contrast ratios.

### Chart Interaction Standard
Every chart must implement:
- Recharts `<Tooltip>` with custom styled content (domain list, counts, values).
- Hover state: bar/segment lifts with `opacity` change and cursor pointer.
- Animated entry on mount (`animationDuration={600}`).
- Clickable segments/bars navigate to filtered `/domains` view where specified.

### Typography
- **Display / headings**: Syne
- **Body / labels**: DM Sans
- **Domain names / codes**: JetBrains Mono

### Breakpoints
`sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`

---

## 5. Database Schema

All tables have RLS enabled. All policies enforce `user_id = auth.uid()`.

### 5.1 Migration 001 — Initial Schema `[DONE]`

```sql
-- ─── DOMAINS ───────────────────────────────────────────────────────────────
CREATE TABLE domains (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain          TEXT NOT NULL,
  tld             TEXT GENERATED ALWAYS AS (split_part(domain, '.', -1)) STORED,
  expiration_date DATE NOT NULL,
  purchase_price  DECIMAL(10,2),
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','expired','sold','pending')),
  registrar       TEXT,
  notes           TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);
CREATE INDEX idx_domains_user_id        ON domains(user_id);
CREATE INDEX idx_domains_expiration     ON domains(expiration_date);
CREATE INDEX idx_domains_status         ON domains(status);

-- ─── SALES ─────────────────────────────────────────────────────────────────
CREATE TABLE sales (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id   UUID REFERENCES domains(id) ON DELETE SET NULL,
  domain_name TEXT NOT NULL,
  sale_price  DECIMAL(10,2) NOT NULL,
  sold_at     DATE NOT NULL,
  buyer       TEXT,
  platform    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);

-- ─── IMPORT LOGS ───────────────────────────────────────────────────────────
CREATE TABLE import_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename   TEXT NOT NULL,
  total_rows INT NOT NULL,
  imported   INT NOT NULL,
  skipped    INT NOT NULL,
  errors     JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS POLICIES ──────────────────────────────────────────────────────────
ALTER TABLE domains     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own domains"      ON domains     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own sales"        ON sales       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own import_logs"  ON import_logs FOR ALL USING (auth.uid() = user_id);
```

### 5.2 Migration 002 — Promotions `[NEW]`

```sql
-- ─── PROMOTIONS ────────────────────────────────────────────────────────────
-- Tracks which domains have been promoted and when.
-- Each week a new promotion batch is generated; a domain can be promoted once per week.
CREATE TABLE promotions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id   UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  week_start  DATE NOT NULL,            -- Monday of the ISO week this batch belongs to
  promoted_at TIMESTAMPTZ,              -- NULL = pending, set when user confirms promotion
  UNIQUE(user_id, domain_id, week_start)
);
CREATE INDEX idx_promotions_user_week ON promotions(user_id, week_start);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own promotions" ON promotions FOR ALL USING (auth.uid() = user_id);
```

### 5.3 Migration 003 — Registrar index `[NEW]`

```sql
-- Speeds up the registrar breakdown chart query
CREATE INDEX idx_domains_registrar ON domains(registrar);
```

---

## 6. Application Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Redirect: `/dashboard` if authed, else `/login` | — |
| `/login` | Email + password login | Public |
| `/register` | Account creation | Public |
| `/reset-password` | Password reset request | Public |
| `/dashboard` | Main analytics dashboard | Protected |
| `/domains` | Full domain portfolio table | Protected |
| `/domains/[id]` | Single domain detail | Protected |
| `/import` | CSV import flow + manual entry + history | Protected |
| `/sales` | Sales log + earnings analytics | Protected |
| `/settings` | Account + preferences | Protected |

### Route Query Params (used for cross-page navigation)
- `/domains?expiry=1m` — show domains expiring within 1 month
- `/domains?expiry=3m` — show domains expiring within 3 months
- `/domains?expiry=6m` — show domains expiring within 6 months
- `/domains?expiry=9m` — show domains expiring within 9 months
- `/domains?registrar=GoDaddy` — filter by registrar

These params are read on page mount and applied to the filter state automatically.

---

## 7. Folder Structure

```
/app
  /(auth)/login          /register          /reset-password
  /(dashboard)/          /domains/          /import/          /sales/          /settings/
/components
  /ui/                   ← shadcn/ui base components
  /dashboard/            ← KPI cards, ExpiryDonutChart, RegistrarChart, PromotionTable
  /domains/              ← DomainTable, DomainSlideOver, ExpiryBadge, DomainFilters
  /import/               ← CsvDropzone, ManualDomainForm, ImportPreviewTable, ImportProgressModal
  /sales/                ← SalesTable, SalesKPICards, RevenueChart
/lib
  /supabase/             ← client, server, types
  /utils/                ← csv-parser, date-helpers, currency, promotion-picker
  /hooks/                ← useDomains, useSales, useDashboardStats, usePromotions
/types                   ← generated from Supabase schema
/supabase/migrations/    ← 001_initial_schema.sql · 002_promotions.sql · 003_registrar_index.sql
```

---

## 8. Feature Phases

### ─── PHASE 1 · Foundation ────────────────────────────────────────────────

**Goal**: Working auth flow, Supabase schema, app shell, navigation, theme switching.

> **Status**: Core features `[DONE]`. Database must be updated — run migrations 002 and 003.

#### User Stories

**US-001 — Registration** `[DONE]`
User fills email + password (min 8 chars, 1 number). On success → redirect to dashboard. Duplicate email shows inline error. Email verification sent via Supabase.

**US-002 — Login** `[DONE]`
Email + password form. On success → `/dashboard`. Wrong credentials → "Invalid email or password". "Forgot password" triggers Supabase reset email. Protected routes redirect unauthenticated users to `/login`.

**US-003 — App Shell & Navigation** `[DONE]`
Sidebar (desktop): Dashboard, Domains, Import, Sales, Settings. Bottom tab bar (mobile ≤768px). Active route highlighted. User avatar + email in sidebar footer. Logout accessible from sidebar (desktop) and settings (mobile).

**US-004 — Theme Switching** `[DONE]`
Toggle in sidebar/header. Persisted in localStorage. Defaults to OS preference. Instant — no flash or reload.

**US-005 — Database Init** `[UPDATED]`
Migration 001 already applied. Now also apply:
- Migration 002 — creates `promotions` table with RLS (see Section 5.2)
- Migration 003 — adds `idx_domains_registrar` index (see Section 5.3)

#### Definition of Done — Phase 1
- [x] Register → verify email → login → logout works end-to-end
- [x] Password reset flow works
- [x] Migration 001 applied (domains, sales, import_logs tables)
- [x] App shell renders on desktop and mobile
- [x] Dark/light mode persists
- [x] Deploys to Vercel with zero TS errors
- [ ] Migration 002 applied (`promotions` table + RLS) `[NEW]`
- [ ] Migration 003 applied (`idx_domains_registrar` index) `[NEW]`

---

### ─── PHASE 2 · CSV Import, Manual Entry & Domain Management ────────────

**Goal**: Upload CSV or enter domains manually → validate → preview → import. Full domain list CRUD with improved filters.

> **Status**: US-006 to US-012 `[DONE]`. New stories US-009b, US-009c, US-030, US-031 must be added. US-007 and US-009 need targeted updates.

#### CSV Format

```
Domain,Expiration Date,Price,Registrar
google.com,2025-12-31,5000,GoDaddy
example.org,2024-06-15,150.50,Namecheap
```

- Required columns: `Domain`, `Expiration Date` (case-insensitive; extra columns ignored).
- Optional columns: `Price`, `Registrar`, `Notes`, `Tags` (comma-separated within the cell, quoted).
- The CSV column header reference is shown prominently on the Import page (see US-030).
- Accepted date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, `MMM DD YYYY`, `YYYY/MM/DD`.
- Price: strip `$`, `€`, `£` before parsing. Empty price → NULL. Negative → error.
- File limit: `.csv` only, max 10 MB.

#### User Stories

**US-006 — CSV Upload** `[DONE]`
Drag-and-drop zone + "Browse files" button. Wrong file type or size → inline error. After selection, parsing begins immediately with a progress indicator.

**US-007 — Preview & Validation** `[UPDATED]`
Preview table: Domain, Expiration Date, Price, Registrar, Status (Valid / Error / Duplicate). Error types: invalid domain format, unparseable date, negative price, duplicate domain. Summary bar: X valid, Y errors, Z duplicates. User can deselect rows. "Import X domains" CTA disabled if 0 valid rows. Error rows downloadable as CSV.
> Change from v1: add `Registrar` column to the preview table.

**US-008 — Confirm Import** `[DONE]`
Confirmation modal → progress bar during import → success toast → redirect to Domains. Import log saved. Partial success handled. Duplicates skipped unless "Update existing records" checkbox is checked.

**US-009 — Domain List** `[UPDATED]`
Table columns: Domain, TLD, Registrar, Expiration Date, Days Until Expiry, Price, Status, Actions.
Expiry badge colors: 🔴 ≤30d · 🟠 31–90d · 🟡 91–180d · 🟢 >180d · ⚫ Expired.
Sortable columns. Filter behavior: search triggers only on Enter key press or search button click (not on every keystroke). Pagination (25/50/100). Export to CSV. Bulk select + delete. Empty state with import CTA.
> Changes from v1: add `Registrar` column; disable real-time search (Enter-key only); see US-009b and US-009c for new filter behavior.

**US-009b — Multi-Domain Search** `[NEW]`
The search input accepts multiple domain names separated by commas (e.g. `google.com, amazon.com, github.io`). Each token is trimmed and matched independently. Results show all domains matching any of the tokens. Placeholder text: `Search domains (comma-separate multiple)`.

**US-009c — Improved Filters** `[NEW]`
Filter bar contains:
1. **Expiry window** — segmented control or styled select: `All` · `≤1 month` · `≤3 months` · `≤6 months` · `≤9 months`. Selecting a value immediately filters without Enter.
2. **Registrar** — dropdown populated dynamically from distinct registrar values in the user's portfolio. Multi-select supported. Shows count per registrar.
3. **Status** — multi-select: Active / Expired / Sold / Pending.
4. **Clear all** link resets all filters.

Filter state is serialized to URL query params so filtered views are shareable and deep-linkable (used by dashboard chart navigation).

**US-010 — Add / Edit Domain (Manual)** `[DONE]`
"Add Domain" → slide-over panel. Fields: Domain*, Expiration Date*, Purchase Price, Status, Registrar (text input with autocomplete from existing registrar values), Tags (chip input), Notes. Domain validated on blur. Edit mode pre-populates fields. Optimistic UI update on save.

**US-011 — Delete Domain** `[DONE]`
Confirmation dialog per row. Bulk delete available. Deleted domains are not removed from sales history.

**US-012 — Import History** `[DONE]`
Section on Import page: Date, Filename/Source (CSV or Manual), Imported, Skipped, Errors. "View Details" modal shows full error report. Last 20 imports shown; "Load more" for older.

**US-030 — Manual Domain Entry** `[NEW]`
The Import page has two tabs: **"CSV Upload"** and **"Add Manually"**.

The **Add Manually** tab contains a clean form:
- Domain name* (validated on blur — must match valid domain regex)
- Expiration Date* (date picker)
- Purchase Price (number input, optional)
- Registrar (text input with autocomplete, optional)
- Notes (textarea, optional)
- Tags (chip input, optional)
- Submit button: "Add Domain"

On submit: insert into `domains`, show success inline, reset form for next entry. Error inline. No redirect — user can add multiple domains sequentially.

**US-031 — CSV Column Reference Banner** `[NEW]`
At the top of the CSV Upload tab, a styled info banner shows the expected CSV format:

```
Required: Domain, Expiration Date
Optional: Price, Registrar, Notes, Tags
```

A copy-to-clipboard button copies a ready-to-use header row: `Domain,Expiration Date,Price,Registrar,Notes,Tags`. A downloadable sample `.csv` file is available.

#### Definition of Done — Phase 2
- [ ] CSV upload (drag/drop + picker) works
- [ ] Parser handles all 5 date formats and currency symbols
- [ ] Preview shows valid/error/duplicate states with Registrar column
- [ ] Import completes, progress shown, log saved
- [ ] Domain list: sort, filter, paginate all work
- [ ] Search triggers only on Enter; supports comma-separated multi-domain search
- [ ] Expiry window filter: 1/3/6/9 month options work
- [ ] Registrar filter: dynamically populated, multi-select
- [ ] Filter state syncs to URL query params
- [ ] Add/edit/delete with optimistic updates
- [ ] Manual entry tab works; adds domain without redirect
- [ ] CSV column reference banner shown with copy + sample download
- [ ] Mobile: horizontal scroll on table, card layout on <480px
- [ ] Skeleton loaders on all async fetches

---

### ─── PHASE 3 · Dashboard & Analytics (REDESIGNED) ────────────────────

**Goal**: Modern, high-density dashboard. KPI cards, expiry donut chart, registrar breakdown bar chart, promotion table, critical renewals panel.

> **Status**: Full rebuild. Delete `[DELETED]` components before starting. All stories in this phase are `[NEW]` or `[UPDATED]` unless tagged otherwise.

#### Layout

```
Desktop ≥1024px:
┌─────────────────────────────────────────────────┬──────────────────┐
│  KPI Cards row (4 across)                        │                  │
├──────────────────────┬──────────────────────────┤  Critical        │
│  Expiry Donut Chart  │  Registrar Breakdown      │  Renewals        │
│                      │  Chart                    │  Panel           │
├──────────────────────┴──────────────────────────┤                  │
│  Promotion Table (full width left col)           │  Quick Stats     │
└──────────────────────────────────────────────────┴──────────────────┘

Tablet 768–1023px: single column, all sections stacked.
Mobile <768px: stacked cards, simplified chart variants.
```

#### User Stories

**US-013 — KPI Cards** `[UPDATED]`
4 cards: **Total Domains** · **Portfolio Value** · **Expiring in 90 Days** · **Sold This Year**.
- Each card has an icon, a large animated counter on load, a subtle trend indicator vs last month, and a colored accent stripe on the left border.
- Cards are clickable — Total Domains → `/domains`, Expiring in 90 Days → `/domains?expiry=3m`, Sold This Year → `/sales`.
- Hover: card lifts with shadow transition.
- Skeleton while loading.

**US-014 — Expiry Donut Chart** `[NEW]` *(replaces Expiry Timeline bar chart — see Section 9)*
A donut chart with 4 segments:
- **≤1 month** (red `#ef4444`)
- **≤3 months** (amber `#f59e0b`)
- **≤6 months** (yellow `#eab308`)
- **≤9 months** (green `#10b981`)

Each segment shows the **count of active domains expiring within that window** (counts are non-overlapping — a domain in ≤1 month is only counted there, not also in ≤3 months).

Center of donut: total domain count.

Legend below or beside chart: each row shows color swatch, label, count, and percentage.

**Hover behavior**: hovering a segment brightens it and shows a tooltip listing the domain names and their expiry dates.

**Click behavior**: clicking a segment navigates to `/domains?expiry=1m` (or `3m`, `6m`, `9m`) which activates the corresponding expiry filter.

**Empty state**: if all segments are 0, show "No expiring domains — your portfolio is in great shape 🎉".

**US-015 — Registrar Breakdown Chart** `[NEW]` *(replaces TLD Distribution chart — see Section 9)*
A horizontal bar chart showing domains grouped by registrar.
- X-axis: domain count.
- Y-axis: registrar name (sorted by count descending, top 10).
- Bar color: accent-primary with opacity gradient.
- Each bar has a hover tooltip showing: registrar name, domain count, % of total portfolio.
- Clicking a bar navigates to `/domains?registrar=<name>`.
- If `registrar` is null/empty for a domain, it appears under "Unknown".
- Empty state shown if no registrar data exists.

**US-016 — Critical Renewals Alert Panel** `[UPDATED]`
Lists up to 10 domains expiring within 30 days, sorted ascending. Badge per row shows days remaining. "Mark as Renewed" → inline date picker to update expiration. "All clear" state when nothing urgent. "View All" → `/domains?expiry=1m`.
> Change from v1: "View All" link now uses the new URL param format `?expiry=1m`.

**US-017 — Promotion Table** `[NEW]`
A dedicated dashboard widget: **"Domains to Promote This Week"**.

**Logic**:
- Each ISO week (Monday–Sunday), 10 domains are selected for promotion from the user's active portfolio.
- Default pool: active domains expiring within 3 months.
- User can change the pool via a styled dropdown (see below).
- Selection is random but deterministic per `(user_id, week_start)` — stored in the `promotions` table so the list stays stable across page reloads.
- On page load: check if a promotion batch exists for the current week. If not, generate one and insert it.

**Pool Selector Dropdown**:
- A modern styled `<Select>` component positioned top-right of the widget.
- Options: `Expiring in 1 month` · `Expiring in 3 months` (default) · `Expiring in 6 months` · `Expiring in 9 months` · `All active domains`.
- Changing the option re-generates the batch for the current week (replaces existing rows for this week).

**Table columns**: Domain · Registrar · Expiration Date · Days Until Expiry · Promoted?

**"Promote" button behavior** (inline confirm — no dialog/popup):
1. Each row has a "Promote" button (ghost/outline, small).
2. Clicking "Promote" transitions that row into a confirmation state: the button area becomes an inline bar below the domain name showing: `✓ Mark as promoted?  [Yes]  [Cancel]` — styled as a soft colored banner within the row, not a separate element.
3. Clicking **Yes**: sets `promoted_at = NOW()` in the `promotions` table, updates the row UI to show a green "Promoted ✓" badge, button disappears.
4. Clicking **Cancel**: collapses the confirmation bar, returns row to normal.
5. Already-promoted domains show the "Promoted ✓" badge and no button.

**Empty state**: "Not enough active domains to fill a promotion list."

**US-018 — Portfolio Value Over Time** `[DONE]`
Area chart: cumulative portfolio value per month. Toggle: last 12 months / all time. Tooltip: date, count, total value. Empty state if < 2 data points.

**US-019 — Quick Stats Widget** `[UPDATED]`
Compact widget: Average price · Most common Registrar (updated from TLD) · Oldest domain · Newest domain · Total expired · Total earnings. Sidebar column on ≥1024px, horizontal scroll chips on mobile.
> Change from v1: replace "Most common TLD" with "Most common Registrar".

#### Dashboard Supabase Queries

```sql
-- Stats summary
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS total_active,
  SUM(purchase_price) FILTER (WHERE status = 'active') AS portfolio_value,
  COUNT(*) FILTER (WHERE status = 'active'
    AND expiration_date <= NOW() + INTERVAL '90 days') AS expiring_90d,
  COUNT(*) FILTER (WHERE status = 'active'
    AND expiration_date <= NOW() + INTERVAL '30 days') AS expiring_30d
FROM domains WHERE user_id = auth.uid();

-- Expiry donut segments (non-overlapping)
SELECT
  COUNT(*) FILTER (WHERE expiration_date <= NOW() + INTERVAL '1 month')  AS exp_1m,
  COUNT(*) FILTER (WHERE expiration_date >  NOW() + INTERVAL '1 month'
                     AND expiration_date <= NOW() + INTERVAL '3 months') AS exp_3m,
  COUNT(*) FILTER (WHERE expiration_date >  NOW() + INTERVAL '3 months'
                     AND expiration_date <= NOW() + INTERVAL '6 months') AS exp_6m,
  COUNT(*) FILTER (WHERE expiration_date >  NOW() + INTERVAL '6 months'
                     AND expiration_date <= NOW() + INTERVAL '9 months') AS exp_9m
FROM domains
WHERE user_id = auth.uid() AND status = 'active';

-- Registrar breakdown
SELECT
  COALESCE(registrar, 'Unknown') AS registrar,
  COUNT(*) AS domain_count
FROM domains
WHERE user_id = auth.uid() AND status = 'active'
GROUP BY registrar
ORDER BY domain_count DESC
LIMIT 10;

-- Current week promotions
SELECT p.*, d.domain, d.registrar, d.expiration_date
FROM promotions p
JOIN domains d ON p.domain_id = d.id
WHERE p.user_id = auth.uid()
  AND p.week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;
```

#### Definition of Done — Phase 3
- [ ] All 4 KPI cards render with real data + hover lift + skeleton
- [ ] Expiry donut chart: 4 segments, hover tooltip with domain list, click navigates to filtered domains
- [ ] Registrar chart: horizontal bars, hover tooltip, click navigates to filtered domains
- [ ] Critical renewals panel shows correct domains urgency-sorted
- [ ] Promotion table generates weekly batch on load; dropdown changes pool; inline confirm works; promoted_at persisted
- [ ] Portfolio value chart renders or shows empty state
- [ ] Quick stats shows "Most common Registrar" (not TLD)
- [ ] Fully responsive across all 3 breakpoints
- [ ] Max 4 Supabase calls to render full dashboard (no N+1)
- [ ] All charts have hover effects per Chart Interaction Standard

---

### ─── PHASE 4 · Sales Tracking & Earnings ────────────────────────────────

**Goal**: Log domain sales, calculate ROI, visualize revenue over time, platform breakdown.

> **Status**: Will be update; not All stories below are new, only stories tagged with [DONE] need to be implemented as written.

#### User Stories

**US-021 — Log a Sale** `[DONE]`
"Mark as Sold" in domain row Actions → slide-over: Sale Price*, Sale Date* (defaults today), Buyer, Platform (dropdown: Sedo / Afternic / Dan.com / Flippa / GoDaddy Auctions / Direct / Other), Notes. On save: domain status → `'sold'`, row inserted in `sales`. Sales can also be added manually from the Sales page.

**US-022 — Sales List** `[DONE]`
Table: Domain, Sale Price, Purchase Price, Profit, ROI %, Sale Date, Platform, Buyer, Actions.
ROI = `((sale_price - purchase_price) / purchase_price) * 100` — green positive, red negative.
Profit = `sale_price - purchase_price`. If purchase_price NULL → show "—".
Sortable, searchable, filterable (platform, date range, min price). Export CSV. Edit + delete per row (delete does NOT delete the domain; sets status back to `'active'`).

**US-023 — Sales KPI Cards** `[DONE]`
4 cards: Total Revenue · Total Profit · Average Sale Price · Domains Sold.
Toggle: "This year" / "All time". Animate on mount.

The next feature are new charts in in Dashbord page, you need to analyse before the Dashbord page to organize the size & position of each new stat view.

**US-024 — Revenue Over Time Chart** `[NEW]`
in Dashbord page, Bar chart: revenue per month. Toggle: 12M / 24M / All time. Overlaid cumulative line (secondary Y-axis). Tooltip: month, revenue, # of sales, cumulative. Zero-height bar (not gap) for months with no sales.

**US-025 — Top Sales Leaderboard** `[NEW]`
in Dashbord page, Top 5 sales by sale price. Columns: rank, domain, sale price, ROI %, date. Expandable to top 10. "Best ROI" toggle re-sorts by ROI %.

**US-026 — Platform Performance** `[NEW]`
in Dashbord page, Horizontal bar chart or table: platform, # of sales, total revenue, average sale price. Sorted by total revenue desc.

**US-027 — ROI Analysis per Domain** `[NEW]`
in Dashbord page, Detail view (expandable row / modal): domain, purchase price, sale price, gross profit, ROI %, hold duration ("Held for X days / Y months"), platform.

#### Dashboard Integration
- "Sold This Year" KPI card links to Sales page filtered by current year.
- Total earnings added to Quick Stats widget.

#### Sales Supabase Queries

```sql
-- Summary
SELECT COUNT(*) AS total_sales, SUM(sale_price) AS total_revenue,
       AVG(sale_price) AS avg_sale_price,
       SUM(sale_price - COALESCE(d.purchase_price, 0)) AS total_profit
FROM sales s LEFT JOIN domains d ON s.domain_id = d.id
WHERE s.user_id = auth.uid();

-- Revenue by month (12M)
SELECT DATE_TRUNC('month', sold_at) AS month,
       COUNT(*) AS sales_count, SUM(sale_price) AS revenue
FROM sales
WHERE user_id = auth.uid() AND sold_at >= NOW() - INTERVAL '12 months'
GROUP BY month ORDER BY month;
```

#### Definition of Done — Phase 4
- [ ] "Mark as Sold" flow works end-to-end from domain list
- [ ] Sales can be added manually from Sales page
- [ ] Sales list: sort, filter, search, export all work
- [ ] All 4 KPI cards correct (year / all-time toggle)
- [ ] Revenue chart works for 12M / 24M / all-time
- [ ] Top Sales and Platform Breakdown widgets render
- [ ] ROI calculated correctly; N/A when purchase price missing
- [ ] Dashboard updated with sales data integration
- [ ] Delete sale → domain status reverts to `'active'`
- [ ] Fully responsive

---

## 9. Deleted Features `[DELETED]`

The following components from v1 **must be removed** from the codebase before implementing Phase 3. Do not leave dead code.

| Component | Was | Action |
|---|---|---|
| Expiry Timeline 3-Month bar chart | US-014 v1 | `[DELETED]` — remove component + query |
| Expiry Timeline 6-Month toggle | US-015 v1 | `[DELETED]` — remove component + query |
| TLD Distribution Donut Chart | US-017 v1 | `[DELETED]` — remove component + query |

---

## 10. Non-Goals (v1 — unchanged)

- No multi-user / team features
- No registrar API integrations (manual CSV only)
- No email / SMS renewal alerts
- No mobile native app

---

## 11. Future Backlog (Phase 5+)

- Email renewal alerts via Supabase Edge Functions + Resend
- Domain watchlist with WHOIS polling
- Registrar API integration (Namecheap, GoDaddy, Spaceship)
- Portfolio valuation via external APIs
- Team / multi-user with role-based access
- React Native mobile companion app
- Auction tracker with bid history