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
# DomainVault — Phase 5 · Sedo Integration

> Extracted spec for Phase 5 only. Build order is top-to-bottom:
> **Step 1 — Migrations → Step 2 — Settings Page → Step 3 — API Routes → Step 4 — Domains Page**
>
> ### Tags
> - `[NEW]` — does not exist yet, must be built from scratch
> - `[UPDATED]` — exists but must be modified as described

---

## Goal

Users can list, edit price, and delist their domains on Sedo directly from DomainVault.
The Sedo column in the Domains page shows cached prices. A global Sync button refreshes
all listings at once. Credentials are configured in the Settings page.

---

## Sedo API Overview

- **Protocol**: HTTP GET with `output_method=xml`
- **Base URL**: `https://api.sedo.com/api/v1/`
- **Auth params** (every call): `partnerid` · `signkey` · `username` · `password`
- **Functions used**: `DomainList` · `DomainInsert` · `DomainEdit` · `DomainDelete` · `CheckMember`
- **Sync strategy**: `DomainList` with no `$domain` filter returns all domains listed on the
  account. Paginate via `startfrom` in batches of 100. This also catches domains the user
  listed directly on Sedo's website (not via DomainVault).

## Pricing Rules

- Currency: always USD (`currency = 1`)
- Fixed price: user-controlled toggle (`Fixed` / `Negotiable`), defaults to `Fixed` (`fixedprice = 1`)
- Asking price: user-entered. Suggestion chips pre-filled from `domains.bin`: `BIN` · `BIN −20%` · `BIN −30%`. Chips only shown if `bin` is not null. Defaults to `bin` value if set.
- Min offer: user-entered. Suggestion chips computed from current asking price: `20%` · `30%` · `40%` · `50%`. Chips recalculate live as asking price changes.

## How to get Sedo credentials

Users must register at `https://sedo.com/services/sedos-partner-program/` and email
`[email protected]` to request a `partnerid` and `signkey`. `username` and `password`
are their regular Sedo login credentials.

---

## Step 1 — Migrations

### Migration 004 — BIN column `[NEW]`

```sql
-- purchase_price = what the user paid (do not touch)
-- bin = asking / Buy It Now price when listing for sale
ALTER TABLE domains ADD COLUMN bin DECIMAL(10,2);
```

### Migration 005 — User Settings `[NEW]`

```sql
CREATE TABLE user_settings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sedo_partner_id  INTEGER,
  sedo_signkey     TEXT,
  sedo_username    TEXT CHECK (char_length(sedo_username) <= 25),
  sedo_password    TEXT CHECK (char_length(sedo_password) <= 16),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
```

> `sedo_password` stored plain text, protected by RLS. Upgrade path: `pgcrypto` if needed.

### Migration 006 — Sedo Listings Cache `[NEW]`

```sql
CREATE TABLE sedo_listings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id        UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
  domain_name      TEXT NOT NULL,
  sedo_price       DECIMAL(10,2) NOT NULL,
  sedo_minprice    DECIMAL(10,2) NOT NULL DEFAULT 0,
  sedo_fixedprice  INTEGER NOT NULL DEFAULT 1,
  sedo_currency    INTEGER NOT NULL DEFAULT 1,
  sedo_forsale     INTEGER NOT NULL DEFAULT 1,
  last_synced_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sedo_listings_user_id   ON sedo_listings(user_id);
CREATE INDEX idx_sedo_listings_domain_id ON sedo_listings(domain_id);

ALTER TABLE sedo_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sedo_listings" ON sedo_listings FOR ALL USING (auth.uid() = user_id);
```

---

## Step 2 — Settings Page `[NEW]`

**File**: `app/(dashboard)/settings/page.tsx`
**Components**: `components/settings/SettingsPage.tsx` · `components/settings/SedoCredentialsForm.tsx`

Build this first — credentials must exist before any Sedo API call can work.

### Section 1 — Account

| Field | Source | Editable |
|---|---|---|
| Email | `supabase.auth.getUser()` | No — read-only |
| Member since | `user.created_at` | No — read-only |
| Change Password | — | Yes — inline sub-form |

**Change Password sub-form**:
- New password (min 8 chars, 1 number)
- Confirm new password
- `Save Password` → `supabase.auth.updateUser({ password })`
- Success/error toast

### Section 2 — Sedo API Credentials

```
┌─────────────────────────────────────────────────────┐
│  Sedo API Credentials                               │
│  ─────────────────────────────────────────────────  │
│  Partner ID      [________________]                 │
│  Sign Key        [________________]                 │
│  Username        [________________]  (max 25 chars) │
│  Password        [••••••••]  👁        (max 16 chars) │
│  ─────────────────────────────────────────────────  │
│  [Test Connection]              [Save Credentials]  │
│                                                     │
│  ✅ Connected  /  ❌ Invalid credentials             │
└─────────────────────────────────────────────────────┘
```

Helper text below the form:
> "Partner ID and Sign Key are provided by Sedo upon request.
> Register at sedo.com/services/sedos-partner-program/ then email [email protected]."

**On page load**: fetch `user_settings` for current user, pre-fill all fields.
Password field shows `••••••••` placeholder if a value exists — never exposes the actual value.

**Test Connection**: `GET /api/sedo/check` → inline ✅ `Connected` or ❌ `Invalid credentials` badge below buttons. Does NOT save.

**Save Credentials**: validates all 4 fields required + length constraints → upsert `user_settings` → success toast `"Sedo credentials saved"`.

---

## Step 3 — API Routes + Lib `[NEW]`

### Folder additions

```
app/api/sedo/
  list/route.ts
  insert/route.ts
  edit/route.ts
  delete/route.ts
  check/route.ts

lib/sedo/
  client.ts
  pricing.ts
```

### `lib/sedo/client.ts` — `callSedo(fn, params)`

- Build URL: `${SEDO_BASE}/${fn}?output_method=xml&${flattenedParams}`
- Fetch with `node-fetch` or native `fetch` (Next.js 14 supports it)
- Parse XML with `@xmldom/xmldom` → `npm install @xmldom/xmldom`
- Root tag `SEDOFAULT` → throw `{ faultcode, faultstring }`
- Root tag `SEDODOMAINLIST` or other → map `<item>` children to plain objects and return

### `lib/sedo/pricing.ts`

```ts
export function computeSedoPricing(
  price: number,
  minprice: number,
  fixedprice: 0 | 1
) {
  return { price, minprice, fixedprice, currency: 1 as const, forsale: 1 as const }
}

// Chips for Asking Price field — only shown when bin is set
export function askingPriceSuggestions(bin: number | null) {
  if (!bin) return []
  return [
    { label: 'BIN',      value: bin },
    { label: 'BIN −20%', value: Math.round(bin * 0.80 * 100) / 100 },
    { label: 'BIN −30%', value: Math.round(bin * 0.70 * 100) / 100 },
  ]
}

// Chips for Min Offer field — recomputed whenever asking price changes
export function minPriceSuggestions(askingPrice: number) {
  return [
    { label: '20%', value: Math.round(askingPrice * 0.20 * 100) / 100 },
    { label: '30%', value: Math.round(askingPrice * 0.30 * 100) / 100 },
    { label: '40%', value: Math.round(askingPrice * 0.40 * 100) / 100 },
    { label: '50%', value: Math.round(askingPrice * 0.50 * 100) / 100 },
  ]
}
```

### Shared pattern in every route

```ts
// 1. Get authenticated user via Supabase server client
// 2. Fetch user_settings — return 401 if credentials missing/incomplete
// 3. Call callSedo() — return { error: faultstring } on Sedo fault, 500 on network error
// 4. Return { data } on success
```

### Route table

| Method | Route | Sedo fn | Body / Params |
|---|---|---|---|
| GET | `/api/sedo/list` | `DomainList` | — (no filter; returns all account listings) |
| POST | `/api/sedo/insert` | `DomainInsert` | `{ domain, price, minprice, fixedprice }` |
| POST | `/api/sedo/edit` | `DomainEdit` | `{ domain, price, minprice, fixedprice }` |
| POST | `/api/sedo/delete` | `DomainDelete` | `{ domain }` |
| GET | `/api/sedo/check` | `CheckMember` | — |

`insert` and `edit` both call `computeSedoPricing(price, minprice, fixedprice)` server-side
to build the final Sedo payload.

---

## Step 4 — Domains Page `[UPDATED]`

### New files

```
components/domains/
  SedoCell.tsx       ← desktop table cell
  SedoCardRow.tsx    ← mobile card row
  SedoOverlay.tsx    ← unified create / edit / delete overlay

lib/hooks/
  useSedoListings.ts
  useSedoSync.ts

types/
  sedo.ts
```

### TypeScript Types — `types/sedo.ts`

```ts
export interface SedoCredentials {
  partnerid: number
  signkey: string
  username: string
  password: string
}

export interface SedoListing {
  id: string
  user_id: string
  domain_id: string
  domain_name: string
  sedo_price: number
  sedo_minprice: number
  sedo_fixedprice: 0 | 1
  sedo_currency: 0 | 1 | 2
  sedo_forsale: 0 | 1
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface SedoInsertPayload {
  domain: string
  price: number       // user-chosen asking price
  minprice: number    // user-chosen min offer
  fixedprice: 0 | 1  // 1 = fixed, 0 = negotiable
  currency: 1         // always USD
  forsale: 1
}

export interface SedoUserSettings {
  sedo_partner_id: number | null
  sedo_signkey: string | null
  sedo_username: string | null
  sedo_password: string | null
}
```

### Hooks

**`lib/hooks/useSedoListings.ts`**
```ts
// TanStack Query key: ['sedo-listings']
// Reads sedo_listings from Supabase for the current user.
// Returns Map<domain_id, SedoListing> for O(1) lookup per table row.
export function useSedoListings(): {
  listings: Map<string, SedoListing>
  isLoading: boolean
}
```

**`lib/hooks/useSedoSync.ts`**
```ts
// Mutation: GET /api/sedo/list → upsert results into sedo_listings
// → delete rows for domains Sedo no longer returns (delisted externally).
// On success: invalidates ['sedo-listings'].
export function useSedoSync(): {
  sync: () => Promise<void>
  isSyncing: boolean
  lastSyncedAt: Date | null   // MAX(last_synced_at) from sedo_listings
  error: string | null
}
```

---

### US-041 — Sedo Column in Desktop Table `[NEW]`

Column position: immediately after `BIN`.

Column header: `Sedo` with a small `RefreshCw` icon → tooltip `"Last synced: X min ago"`.

Data source: `useSedoListings()` map — no API call on page load.

**State A — not listed** (`listing === undefined`)
```
Not Listed     ← text-muted
```

**State B — listed** (`listing` exists)
```
$[sedo_price]   ✏️
```
- Price: `accent-success` color, JetBrains Mono
- `sedo_price` is from `sedo_listings` cache — NOT `domains.bin`
- ✏️ opens `SedoOverlay` in edit mode

---

### US-042 — Sedo Row in Mobile Cards `[NEW]`

Each domain card gets a Sedo row at the bottom separated by `border-t`:

```
State A:   Sedo   Not Listed
State B:   Sedo   $[price]   ✏️
```

Tapping ✏️ opens `SedoOverlay` as a full-screen bottom sheet.

---

### US-043 — SedoOverlay `[NEW]`

**File**: `components/domains/SedoOverlay.tsx`

Single component for both **create** (listing a domain) and **edit** (updating an existing listing).

**Triggers**:
- Desktop: ✏️ in Sedo column (edit mode) · "List on Sedo" in Actions menu (create mode)
- Mobile: same, rendered as bottom sheet (`fixed bottom-0 w-full rounded-t-2xl`)

**Data on open**: pre-populated from the domain row already loaded in the table — **no extra DB fetch**.

#### Form layout

```
┌─────────────────────────────────────────────────────┐
│  List on Sedo — example.com               ✕         │  ← title changes for edit mode
│  ─────────────────────────────────────────────────  │
│  Domain          example.com    (read-only)         │
│  Registrar       GoDaddy        (read-only)         │
│  Expires         2026-08-15     (read-only)         │
│  ─────────────────────────────────────────────────  │
│  Asking Price *                                     │
│  [ $500.00 __________________ ] USD                 │
│  [ BIN $500 ] [ BIN−20% $400 ] [ BIN−30% $350 ]    │  ← chips hidden if bin is null
│                                                     │
│  Min Offer *                                        │
│  [ $200.00 __________________ ] USD                 │
│  [ 20% $100 ] [ 30% $150 ] [ 40% $200 ] [ 50% $250]│  ← recalculate on asking price change
│                                                     │
│  Fixed Price                                        │
│  [ Fixed  ●──────────○  Negotiable ]                │
│  ─────────────────────────────────────────────────  │
│  [Cancel]                     [List on Sedo →]      │  ← create mode footer
└─────────────────────────────────────────────────────┘

Edit mode footer:
│  [🗑 Remove from Sedo]     [Cancel]    [Update →]   │
│                                                     │
│  "Remove from Sedo? [Yes] [Cancel]"  ← inline       │  ← shown on 🗑 click
```

#### Field spec

| Field | Source | Editable | Required |
|---|---|---|---|
| Domain | `domains.domain` | No | — |
| Registrar | `domains.registrar` | No | — |
| Expiration Date | `domains.expiration_date` | No | — |
| Asking Price | `domains.bin` (default) or `sedo_listings.sedo_price` (edit) | **Yes** | ✅ |
| Min Offer | blank by default, or `sedo_listings.sedo_minprice` (edit) | **Yes** | ✅ |
| Fixed Price | `Fixed` by default, or existing value (edit) | **Yes** — toggle | ✅ |
| Currency | always USD | No | — |

#### On submit (create or update)
1. If `bin` was null and user entered an asking price → `PATCH domains` to save `bin`.
2. `POST /api/sedo/insert` or `POST /api/sedo/edit` with `{ domain, price, minprice, fixedprice }`.
3. On success → upsert row in `sedo_listings` via Supabase client.
4. Invalidate `['sedo-listings']` + `['domains']`.
5. Close overlay. Toast: `"[domain] listed on Sedo"` or `"Sedo price updated"`.

#### On remove
1. Inline confirm in footer: `"Remove from Sedo? [Yes] [Cancel]"`
2. `Yes` → `POST /api/sedo/delete` with `{ domain }`.
3. Delete `sedo_listings` row.
4. Invalidate `['sedo-listings']`.
5. Close overlay. Toast: `"[domain] removed from Sedo"`.
6. Cell reverts to State A.

**Loading**: CTA spinner + inputs disabled during call.
**Error**: Sedo fault shown inline above footer — not a toast.

---

### US-044 — Sedo Sync Button `[NEW]`

**File**: `components/domains/SedoSyncButton.tsx`

Placed in the Domains page toolbar, right of existing controls.

```
<RefreshCw />  Sync Sedo
               Last synced: 4 min ago
```

**On click**:
1. `GET /api/sedo/list` — no `$domain` filter, returns all listings in the account.
   Paginate: `startfrom=0`, `startfrom=100`, … until empty result.
2. Upsert all returned domains into `sedo_listings`.
3. Delete `sedo_listings` rows for domains Sedo did not return (delisted externally) → cells revert to State A.
4. Invalidate `['sedo-listings']` → table re-renders.

**UI states**:
- Syncing: `RefreshCw` spins (`animate-spin`), button disabled.
- "Last synced" reads `MAX(last_synced_at)` from `sedo_listings`.
- Success: toast `"Sedo listings synced"`.
- Error: toast with `faultstring`.
- No credentials: button disabled + tooltip `"Add Sedo credentials in Settings"`.

---

## Error Handling Matrix

| Scenario | Where | Behavior |
|---|---|---|
| No credentials saved | Domains page | Sync button disabled + tooltip pointing to Settings |
| No credentials saved | SedoOverlay | Inline error: "Add Sedo credentials in Settings first" |
| `bin` is NULL | SedoOverlay | Asking Price input empty — user must fill before submit |
| Sedo API fault | SedoOverlay | Error inline above footer (not toast) |
| Sedo API fault | Sync | Error toast with `faultstring` |
| Domain gone from Sedo on sync | useSedoSync | Delete row → cell shows `Not Listed` |
| Network error | Any route | `500` → toast `"Could not reach Sedo. Try again."` |
| Supabase write failure | Any mutation | Toast with error, no UI change |
| Invalid credentials | Settings | Inline badge `❌ Invalid credentials` |

---

## Definition of Done — Phase 5

### Step 1 — Migrations
- [ ] Migration 004 applied (`bin` column on `domains`)
- [ ] Migration 005 applied (`user_settings` table + RLS)
- [ ] Migration 006 applied (`sedo_listings` table + RLS)

### Step 2 — Settings Page
- [ ] Account section: email read-only, member since, change password flow
- [ ] Sedo section: all 4 fields visible, show/hide password toggle works
- [ ] Page loads existing credentials pre-filled (password masked)
- [ ] Test Connection shows inline ✅ / ❌ without saving
- [ ] Save Credentials upserts + success toast
- [ ] Helper text with link to Sedo partner program

### Step 3 — API Routes
- [ ] `GET /api/sedo/check` — credential validation
- [ ] `GET /api/sedo/list` — returns all account listings as JSON, paginated
- [ ] `POST /api/sedo/insert` — lists domain, pricing computed server-side
- [ ] `POST /api/sedo/edit` — updates price, pricing computed server-side
- [ ] `POST /api/sedo/delete` — delists domain
- [ ] All routes return `401` when credentials missing, `{ error }` on Sedo fault, `500` on network error

### Step 4 — Domains Page
- [ ] `BIN` column visible (desktop table + mobile card)
- [ ] `Sedo` column visible immediately after `BIN` (desktop table + mobile card)
- [ ] State A: `Not Listed` shown for unlisted domains
- [ ] State B: `$price ✏️` shown for listed domains (price from cache, not `bin`)
- [ ] SedoOverlay opens in create mode from Actions menu
- [ ] SedoOverlay opens in edit mode from ✏️
- [ ] Overlay pre-fills all data from existing table row — zero extra DB fetch
- [ ] Asking price chips shown only when `bin` is set, pre-computed correctly
- [ ] Min offer chips recalculate live as asking price changes
- [ ] Fixed/Negotiable toggle works
- [ ] Create flow: insert → upsert cache → cell switches to State B
- [ ] Edit flow: edit → update cache → cell re-renders with new price
- [ ] Remove flow: inline confirm → delete from Sedo + cache → State A
- [ ] Mobile: SedoOverlay renders as bottom sheet at 375px
- [ ] Sync button fetches all listings, paginates correctly, cleans stale rows
- [ ] Sync button shows last synced time, disabled state when no credentials

### Quality
- [ ] No credentials → no crashes anywhere, disabled states with tooltips
- [ ] All loading states: spinners on CTAs, no layout shift
- [ ] All error states: inline in overlay, toasts for sync
- [ ] Zero TypeScript errors
- [ ] Works correctly at 375px (mobile) and 1440px+ (desktop)

# DomainVault — Phase 6 · Spaceship SellerHub Integration

> Standalone spec for Phase 6 only. Mirrors the exact same feature set as Phase 5 (Sedo)
> but adapted for the Spaceship REST API and SellerHub.
> Build order: **Step 1 — Migration → Step 2 — Settings → Step 3 — API Routes → Step 4 — Domains Page**

---

## Key differences vs Sedo

| | Sedo | Spaceship |
|---|---|---|
| Protocol | SOAP / XML | REST / JSON |
| Auth | partnerid + signkey + username + password | `X-Api-Key` + `X-Api-Secret` headers |
| Credential test | `CheckMember` | `GET /v1/sellerhub/domains?take=1&skip=0` (returns 401 on bad creds) |
| List all listings | `DomainList` (paginated, no filter) | `GET /v1/sellerhub/domains` (`take` max 100, paginate with `skip`) |
| Get single listing | `DomainList` with domain filter | `GET /v1/sellerhub/domains/{domain}` |
| Create listing | `DomainInsert` | `POST /v1/sellerhub/domains` |
| Edit listing | `DomainEdit` | `PATCH /v1/sellerhub/domains/{domain}` (partial update) |
| Delete listing | `DomainDelete` | `DELETE /v1/sellerhub/domains/{domain}` |
| Price model | `price` + `minprice` + `fixedprice` | `binPrice` + `minPrice` with separate `binPriceEnabled` / `minPriceEnabled` toggles |
| Currency | always USD | per-price object `{ amount, currency }` — always USD |
| Error format | XML `<SEDOFAULT>` | JSON `{ detail: string }` with HTTP status codes |
| Listing status | n/a | `status` field: `"active"` \| `"failed"` \| `"pending"` |

---

## Spaceship API Reference — SellerHub endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/v1/sellerhub/domains?take=N&skip=N` | List all SellerHub listings (paginated) |
| `GET` | `/v1/sellerhub/domains/{domain}` | Get a single listing (per-domain sync) |
| `POST` | `/v1/sellerhub/domains` | Create a new listing |
| `PATCH` | `/v1/sellerhub/domains/{domain}` | Update an existing listing (partial) |
| `DELETE` | `/v1/sellerhub/domains/{domain}` | Remove a domain from SellerHub |

**Auth headers on every request:**
```
X-Api-Key: YOUR_API_KEY
X-Api-Secret: YOUR_API_SECRET
```

**Base URL:** `https://spaceship.dev/api/v1`

**Rate limits relevant to us:**
- List: 300 req / user / 300s
- Get single: 300 req / domain / 300s
- Create: 300 req / user / 300s
- Update: 300 req / domain / 300s
- Delete: 300 req / domain / 300s

---

## Spaceship listing object shape

```ts
// Returned by GET /sellerhub/domains and GET /sellerhub/domains/{domain}
{
  name: string            // ACE format e.g. "xn--spceship-9ya.com"
  unicodeName: string     // human-readable e.g. "spaceship.com"
  displayName: string     // shown on marketplace
  description: string     // optional listing description
  status: "active" | "failed" | "pending"
  binPriceEnabled: boolean
  binPrice: { amount: string, currency: string } | null
  minPriceEnabled: boolean
  minPrice: { amount: string, currency: string } | null
}
```

**Status meanings:**
- `active` — live on SellerHub marketplace
- `pending` — submitted, waiting for Spaceship to process
- `failed` — listing failed (show error badge, allow retry)

---

## Pricing rules (same UX as Sedo)

- Currency: always USD
- BIN price: user-entered. Suggestion chips from `domains.bin`:
  `BIN` · `BIN −20%` · `BIN −30%`. Defaults to `bin` if set.
- Min price: user-entered. Suggestion chips from asking price:
  `20%` · `30%` · `40%` · `50%`. Recalculate live as BIN changes.
- `binPriceEnabled`: always `true` when creating/editing
- `minPriceEnabled`: `true` if the user filled a min price, `false` if left empty

---

## How to get Spaceship API credentials

Generate from the **API Manager** in the Spaceship account dashboard:
`https://www.spaceship.com/application/api-manager/`
Click "New API key", follow the guide. Required scopes: `sellerhub:read` + `sellerhub:write`.

---

## Step 1 — Migration

### Migration 007 — Spaceship credentials in `user_settings` `[NEW]`

```sql
ALTER TABLE user_settings
  ADD COLUMN spaceship_api_key    TEXT,
  ADD COLUMN spaceship_api_secret TEXT;
```

> Extends the existing `user_settings` table from Migration 005.
> RLS already in place — no changes needed.

### Migration 008 — `spaceship_listings` cache table `[NEW]`

```sql
CREATE TABLE spaceship_listings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id             UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
  domain_name           TEXT NOT NULL,
  display_name          TEXT,
  description           TEXT,
  sp_status             TEXT NOT NULL DEFAULT 'pending',   -- 'active' | 'pending' | 'failed'
  bin_price             DECIMAL(10,2),
  bin_price_enabled     BOOLEAN NOT NULL DEFAULT true,
  min_price             DECIMAL(10,2),
  min_price_enabled     BOOLEAN NOT NULL DEFAULT false,
  currency              TEXT NOT NULL DEFAULT 'USD',
  last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaceship_listings_user_id   ON spaceship_listings(user_id);
CREATE INDEX idx_spaceship_listings_domain_id ON spaceship_listings(domain_id);
CREATE INDEX idx_spaceship_listings_status    ON spaceship_listings(sp_status);

ALTER TABLE spaceship_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own spaceship_listings"
  ON spaceship_listings FOR ALL USING (auth.uid() = user_id);
```

---

## Step 2 — Settings Page `[UPDATED]`

**File**: `components/settings/SpaceshipCredentialsForm.tsx` (new)
Appended as a third section to the existing Settings page, below the Sedo section.

### Section 3 — Spaceship API Credentials

```
┌─────────────────────────────────────────────────────┐
│  Spaceship SellerHub Credentials                    │
│  ─────────────────────────────────────────────────  │
│  API Key     [________________________________]     │
│  API Secret  [••••••••••••••••••••••••]  👁          │
│  ─────────────────────────────────────────────────  │
│  [Test Connection]              [Save Credentials]  │
│                                                     │
│  ✅ Connected  /  ❌ Invalid credentials             │
└─────────────────────────────────────────────────────┘
```

Helper text below:
> "Generate your API key and secret in the API Manager at spaceship.com/application/api-manager/.
> Required scopes: sellerhub:read and sellerhub:write."

**On page load**: fetch `user_settings`, pre-fill `spaceship_api_key`.
`spaceship_api_secret` field shows `••••••••` placeholder if a value is saved — never exposes the actual value.

**Test Connection**: `GET /api/spaceship/check` — attempts
`GET /v1/sellerhub/domains?take=1&skip=0`. Returns `200` → ✅ Connected, `401/403` → ❌ Invalid credentials.

**Save Credentials**: both fields required → upsert `user_settings` → success toast
`"Spaceship credentials saved"`.

---

## Step 3 — API Routes `[NEW]`

### Folder additions

```
app/api/spaceship/
  check/route.ts
  list/route.ts
  status/route.ts
  insert/route.ts
  edit/route.ts
  delete/route.ts

lib/spaceship/
  client.ts
  pricing.ts
```

### `lib/spaceship/client.ts` — `callSpaceship(method, path, body?)`

```ts
const BASE = 'https://spaceship.dev/api/v1'

// Simple REST wrapper — no XML, no SOAP.
// Reads X-Api-Key and X-Api-Secret from the caller.
// Returns parsed JSON on success.
// Throws SpaceshipError({ status, detail }) on 4xx/5xx.
export async function callSpaceship(
  credentials: SpaceshipCredentials,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<unknown>
```

Implementation:
- Set headers: `X-Api-Key`, `X-Api-Secret`, `Content-Type: application/json`
- `DELETE` returns 204 (no body) — handle gracefully
- 401/403 → throw `SpaceshipError` with `detail` from response
- 429 → throw `SpaceshipError` with rate limit message

### `lib/spaceship/pricing.ts`

```ts
// Same chip helpers as Sedo version, same UX
export function binPriceSuggestions(bin: number | null) {
  if (!bin) return []
  return [
    { label: 'BIN',      value: bin },
    { label: 'BIN −20%', value: Math.round(bin * 0.80 * 100) / 100 },
    { label: 'BIN −30%', value: Math.round(bin * 0.70 * 100) / 100 },
  ]
}

export function minPriceSuggestions(binPrice: number) {
  return [
    { label: '20%', value: Math.round(binPrice * 0.20 * 100) / 100 },
    { label: '30%', value: Math.round(binPrice * 0.30 * 100) / 100 },
    { label: '40%', value: Math.round(binPrice * 0.40 * 100) / 100 },
    { label: '50%', value: Math.round(binPrice * 0.50 * 100) / 100 },
  ]
}

// Builds the POST /sellerhub/domains or PATCH payload
export function buildSpaceshipPayload(
  binPrice: number | null,
  minPrice: number | null,
  displayName?: string,
  description?: string
) {
  return {
    ...(displayName && { displayName }),
    ...(description && { description }),
    binPriceEnabled: binPrice !== null,
    ...(binPrice !== null && {
      binPrice: { amount: String(binPrice), currency: 'USD' }
    }),
    minPriceEnabled: minPrice !== null,
    ...(minPrice !== null && {
      minPrice: { amount: String(minPrice), currency: 'USD' }
    }),
  }
}
```

### Shared pattern in every route

```ts
// 1. Get authenticated user via Supabase server client
// 2. Fetch user_settings — return 401 if spaceship_api_key or spaceship_api_secret missing
// 3. Call callSpaceship() — return { error: detail } on API error, 500 on network error
// 4. Return { data } on success
```

### Route table

| Method | Route | Spaceship call | Body |
|---|---|---|---|
| `GET` | `/api/spaceship/check` | `GET /v1/sellerhub/domains?take=1&skip=0` | — |
| `GET` | `/api/spaceship/list` | `GET /v1/sellerhub/domains?take=100&skip=N` (loop) | — |
| `GET` | `/api/spaceship/status` | `GET /v1/sellerhub/domains/{domain}` | `?domain=example.com` |
| `POST` | `/api/spaceship/insert` | `POST /v1/sellerhub/domains` | `{ name, binPrice, minPrice, displayName?, description? }` |
| `PATCH` | `/api/spaceship/edit` | `PATCH /v1/sellerhub/domains/{domain}` | `{ domain, binPrice?, minPrice?, displayName?, description? }` |
| `DELETE` | `/api/spaceship/delete` | `DELETE /v1/sellerhub/domains/{domain}` | `{ domain }` |

**`/api/spaceship/list` pagination logic:**
```
skip=0, take=100 → if items.length === 100 → skip=100, take=100 → repeat until items.length < 100
merge all items, return as single array
```

**`/api/spaceship/insert` notes:**
- `name` must be the domain in Unicode format (use `domains.domain` directly)
- `binPriceEnabled` always `true` when inserting
- `minPriceEnabled` = `true` only if `minPrice` is provided
- Server-side: call `buildSpaceshipPayload(binPrice, minPrice, displayName, description)`

**`/api/spaceship/edit` notes:**
- Uses `PATCH` — only sends fields that changed (partial update)
- Server-side: build partial payload with only provided fields

---

## Step 4 — Domains Page `[UPDATED]`

### New files

```
components/domains/
  SpaceshipCell.tsx       ← desktop table cell (mirrors SedoCell)
  SpaceshipCardRow.tsx    ← mobile card row (mirrors SedoCardRow)
  SpaceshipOverlay.tsx    ← unified create/edit/delete overlay

lib/hooks/
  useSpaceshipListings.ts
  useSpaceshipSync.ts

types/
  spaceship.ts
```

---

### TypeScript Types — `types/spaceship.ts`

```ts
export interface SpaceshipCredentials {
  apiKey: string
  apiSecret: string
}

export interface SpaceshipListing {
  id: string
  user_id: string
  domain_id: string
  domain_name: string
  display_name: string | null
  description: string | null
  sp_status: 'active' | 'pending' | 'failed'
  bin_price: number | null
  bin_price_enabled: boolean
  min_price: number | null
  min_price_enabled: boolean
  currency: string
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface SpaceshipInsertPayload {
  name: string                          // domain in Unicode format
  displayName?: string
  description?: string
  binPriceEnabled: true
  binPrice: { amount: string; currency: 'USD' }
  minPriceEnabled: boolean
  minPrice?: { amount: string; currency: 'USD' }
}

export interface SpaceshipEditPayload {
  displayName?: string
  description?: string
  binPriceEnabled?: boolean
  binPrice?: { amount: string; currency: 'USD' }
  minPriceEnabled?: boolean
  minPrice?: { amount: string; currency: 'USD' }
}

// Raw shape returned from Spaceship API
export interface SpaceshipApiListing {
  name: string
  unicodeName: string
  displayName: string
  description: string
  status: 'active' | 'pending' | 'failed'
  binPriceEnabled: boolean
  binPrice: { amount: string; currency: string } | null
  minPriceEnabled: boolean
  minPrice: { amount: string; currency: string } | null
}
```

---

### Hooks

**`lib/hooks/useSpaceshipListings.ts`**
```ts
// TanStack Query key: ['spaceship-listings']
// Reads spaceship_listings from Supabase for the current user.
// Returns Map<domain_id, SpaceshipListing> for O(1) lookup per table row.
export function useSpaceshipListings(): {
  listings: Map<string, SpaceshipListing>
  isLoading: boolean
}
```

**`lib/hooks/useSpaceshipSync.ts`**
```ts
// Global sync mutation:
//   GET /api/spaceship/list (all pages)
//   → upsert results into spaceship_listings
//   → delete rows for domains Spaceship no longer returns (delisted externally)
//   → invalidate ['spaceship-listings']
//
// Single-domain sync mutation:
//   GET /api/spaceship/status?domain=example.com
//   → upsert that one row in spaceship_listings (or delete if 404)
//   → invalidate ['spaceship-listings']
export function useSpaceshipSync(): {
  syncAll: () => Promise<void>
  syncOne: (domain: string, domainId: string) => Promise<void>
  isSyncing: boolean
  lastSyncedAt: Date | null
  error: string | null
}
```

---

### US-051 — Spaceship Column in Desktop Table `[NEW]`

Column position: immediately after the `Sedo` column.

Column header: `Spaceship` with a small sync icon → tooltip `"Last synced: X min ago"`.

Data source: `useSpaceshipListings()` map — no API call on page load.

**State A — not listed** (`listing === undefined`)
```
Not Listed     ← text-muted
```

**State B — listed, status = `active`**
```
$[bin_price]   ✏️   <RefreshCw size={12} />
```
- Price in `accent-success`, JetBrains Mono
- `bin_price` from `spaceship_listings` cache
- ✏️ opens `SpaceshipOverlay` in edit mode
- `RefreshCw` icon → triggers `syncOne(domain)` (per-domain sync, spins while loading)

**State C — listed, status = `pending`**
```
⏳ Pending   ✏️   <RefreshCw size={12} />
```
- Muted amber color
- Same icons as State B

**State D — listed, status = `failed`**
```
❌ Failed   ✏️   <RefreshCw size={12} />
```
- Red color
- ✏️ opens overlay pre-filled so user can correct and retry
- `RefreshCw` → syncOne to re-check if it recovered

---

### US-052 — Spaceship Row in Mobile Cards `[NEW]`

Each domain card gets a `Spaceship` row at the bottom, below the Sedo row, separated by `border-t`:

```
State A:   Spaceship   Not Listed
State B:   Spaceship   $[price]   ✏️   🔄
State C:   Spaceship   ⏳ Pending  ✏️   🔄
State D:   Spaceship   ❌ Failed   ✏️   🔄
```

Tapping ✏️ opens `SpaceshipOverlay` as a full-screen bottom sheet.

---

### US-053 — SpaceshipOverlay `[NEW]`

**File**: `components/domains/SpaceshipOverlay.tsx`

Single component for create, edit, and delete. Mirrors `SedoOverlay` structure with Spaceship-specific fields.

**Triggers**:
- Desktop: ✏️ in Spaceship column (edit mode) · "List on Spaceship" in Actions menu (create mode)
- Mobile: same, as bottom sheet (`fixed bottom-0 w-full rounded-t-2xl`)

**Data on open**: pre-populated from domain row already in table — **no extra DB fetch**.

#### Form layout

```
┌────────────────────────────────────────────────────────┐
│  List on Spaceship — example.com              ✕        │
│  ────────────────────────────────────────────────────  │
│  Domain          example.com    (read-only)            │
│  Registrar       GoDaddy        (read-only)            │
│  Expires         2026-08-15     (read-only)            │
│  ────────────────────────────────────────────────────  │
│  BIN Price *                                           │
│  [ $500.00 ________________________ ] USD              │
│  [ BIN $500 ] [ BIN−20% $400 ] [ BIN−30% $350 ]       │
│                                                        │
│  Min Price  (Optional)                                 │
│  [ $200.00 ________________________ ] USD              │
│  [ 20% $100 ] [ 30% $150 ] [ 40% $200 ] [ 50% $250 ]  │
│                                                        │
│  Display Name  (Optional)                              │
│  [ SpaceShip.com __________________ ]                  │
│                                                        │
│  Description  (Optional)                               │
│  [ Premium domain for sale ________ ]                  │
│  ────────────────────────────────────────────────────  │
│  [Cancel]                  [List on Spaceship →]       │  ← create mode
└────────────────────────────────────────────────────────┘

Edit mode footer:
│  [🗑 Remove from Spaceship]   [Cancel]   [Update →]   │
│  "Remove from Spaceship? [Yes] [Cancel]"  ← inline    │
```

#### Field spec

| Field | Source | Editable | Required |
|---|---|---|---|
| Domain | `domains.domain` | No | — |
| Registrar | `domains.registrar` | No | — |
| Expiration Date | `domains.expiration_date` | No | — |
| BIN Price | `domains.bin` (default) or `spaceship_listings.bin_price` (edit) | **Yes** | ✅ |
| Min Price | blank or `spaceship_listings.min_price` (edit) | **Yes** | Optional |
| Display Name | `spaceship_listings.display_name` (edit) or blank | **Yes** | Optional |
| Description | `spaceship_listings.description` (edit) or blank | **Yes** | Optional |
| Currency | always USD | No | — |

Min Price, Display Name, and Description are shown with an `Optional` label.

#### On submit (create)
1. If `bin` null and user entered a BIN price → `PATCH domains` to save `bin`.
2. `POST /api/spaceship/insert` with `{ name, binPrice, minPrice?, displayName?, description? }`.
3. `buildSpaceshipPayload()` called server-side.
4. On success (201) → insert row into `spaceship_listings` with `sp_status: 'pending'`.
5. Invalidate `['spaceship-listings']` + `['domains']`.
6. Close overlay. Toast: `"[domain] submitted to Spaceship SellerHub"`.
7. Cell switches to State C (Pending) immediately.

#### On submit (edit)
1. `PATCH /api/spaceship/edit` with only changed fields.
2. On success → update `spaceship_listings` row.
3. Invalidate `['spaceship-listings']`.
4. Close overlay. Toast: `"Spaceship listing updated"`.

#### On remove
1. Inline confirm in footer: `"Remove from Spaceship? [Yes] [Cancel]"`
2. `Yes` → `DELETE /api/spaceship/delete` with `{ domain }`.
3. Delete `spaceship_listings` row.
4. Invalidate `['spaceship-listings']`.
5. Close overlay. Toast: `"[domain] removed from Spaceship SellerHub"`.
6. Cell reverts to State A.

**Status badge in overlay (edit mode only)**:
Below the read-only domain info, show a status pill:
- `active` → green `● Active`
- `pending` → amber `⏳ Pending`
- `failed` → red `❌ Failed — check your Spaceship account for details`

**Loading**: CTA spinner + inputs disabled during call.
**Error**: API error `detail` shown inline above footer, not toast.

---

### US-054 — Spaceship Global Sync Button `[NEW]`

**File**: `components/domains/SpaceshipSyncButton.tsx`

Placed in the Domains page toolbar, right of the existing `Sync Sedo` button.

```
<RefreshCw />  Sync Spaceship
               Last synced: 4 min ago
```

**On click**:
1. `GET /api/spaceship/list` — paginates through all SellerHub listings
   (`skip=0`, `skip=100`, … until response `items.length < 100`).
2. Upsert all returned domains into `spaceship_listings` (update `bin_price`, `min_price`,
   `sp_status`, `last_synced_at`).
3. Rows in `spaceship_listings` not returned by Spaceship → delete them (delisted externally).
   Their cells revert to State A.
4. Invalidate `['spaceship-listings']`.

**UI states**:
- Syncing: icon spins, button disabled.
- "Last synced" reads `MAX(last_synced_at)` from `spaceship_listings`.
- Success toast: `"Spaceship listings synced"`.
- Error toast with `detail` from API.
- No credentials → disabled + tooltip `"Add Spaceship credentials in Settings"`.

---

### US-055 — Per-Domain Sync (Single Row) `[NEW]`

The `RefreshCw` icon inside the Spaceship column cell (States B/C/D) triggers a single-domain sync.

**On click**:
1. `GET /api/spaceship/status?domain=example.com`
   → calls `GET /v1/sellerhub/domains/{domain}`.
2. If `200` → upsert `spaceship_listings` row with fresh data.
3. If `404` → domain was removed from SellerHub externally → delete row → cell reverts to State A.
4. Invalidate `['spaceship-listings']`.

The icon spins while the call is in-flight. No toast on success (cell re-renders silently).
Error toast if the call fails.

---

### US-056 — "Not Listed On" Filter Update `[UPDATED]`

The existing "Not Listed On" filter in the Domains page gains a `Spaceship` option alongside `Sedo`.

```
Not Listed On:  [ ] Sedo   [ ] Spaceship
```

Selecting `Spaceship` filters the table to show only domains where `spaceship_listings` has no row for that `domain_id`.

---

## Error Handling Matrix

| Scenario | Where | Behavior |
|---|---|---|
| No credentials saved | Domains page | Sync Spaceship button disabled + tooltip to Settings |
| No credentials saved | SpaceshipOverlay | Inline error: "Add Spaceship credentials in Settings first" |
| `bin` is NULL | SpaceshipOverlay | BIN Price input empty — user must fill before submit |
| `status = failed` | SpaceshipCell | Red `❌ Failed` badge, ✏️ to resubmit |
| API `401` / `403` | Any route | `{ error: 'Invalid credentials' }` → toast |
| API `404` on status | `syncOne` | Delete row → cell State A |
| API `429` rate limit | Any route | `{ error: 'Rate limit exceeded. Try again shortly.' }` → toast |
| API `4xx` / `5xx` | SpaceshipOverlay | Error inline above footer |
| API `4xx` / `5xx` | Sync buttons | Error toast with `detail` |
| Network error | Any route | `500` → toast `"Could not reach Spaceship. Try again."` |
| Supabase write failure | Any mutation | Toast with error, no UI change |

---

## Definition of Done — Phase 6

### Step 1 — Migrations
- [ ] Migration 007 applied (`spaceship_api_key` + `spaceship_api_secret` on `user_settings`)
- [ ] Migration 008 applied (`spaceship_listings` table + RLS + indexes)

### Step 2 — Settings Page
- [ ] Spaceship section visible below Sedo section
- [ ] API Key and API Secret fields with show/hide toggle
- [ ] Page loads existing credentials pre-filled (secret masked)
- [ ] Test Connection hits `GET /api/spaceship/check` → inline ✅ / ❌
- [ ] Save Credentials upserts + success toast
- [ ] Helper text with link to API Manager

### Step 3 — API Routes
- [ ] `GET /api/spaceship/check` — returns `{ valid: true/false }`
- [ ] `GET /api/spaceship/list` — paginates all pages, returns merged array
- [ ] `GET /api/spaceship/status?domain=X` — returns single listing or 404
- [ ] `POST /api/spaceship/insert` — creates listing, payload built server-side
- [ ] `PATCH /api/spaceship/edit` — partial update, only changed fields sent
- [ ] `DELETE /api/spaceship/delete` — delists domain (handles 204 no-body)
- [ ] All routes return `401` when credentials missing
- [ ] All routes return `{ error }` on API error with correct status

### Step 4 — Domains Page
- [ ] `Spaceship` column visible immediately after `Sedo` column (desktop)
- [ ] State A: `Not Listed` for unlisted domains
- [ ] State B: `$price ✏️ 🔄` for `active` listings
- [ ] State C: `⏳ Pending ✏️ 🔄` for `pending` listings
- [ ] State D: `❌ Failed ✏️ 🔄` for `failed` listings
- [ ] SpaceshipOverlay: create mode from Actions menu
- [ ] SpaceshipOverlay: edit mode from ✏️ icon
- [ ] Overlay pre-fills all data from existing table row — zero extra DB fetch
- [ ] BIN price chips shown only when `bin` is set
- [ ] Min price chips recalculate live as BIN changes
- [ ] Display Name and Description fields optional, labelled clearly
- [ ] Status badge shown in overlay (edit mode)
- [ ] Create: POST → insert cache row as `pending` → cell shows State C
- [ ] Edit: PATCH → update cache → cell re-renders
- [ ] Remove: inline confirm → DELETE → remove row → State A
- [ ] Mobile: `Spaceship` row in cards (State A / B / C / D)
- [ ] Mobile: SpaceshipOverlay renders as bottom sheet at 375px
- [ ] Per-domain sync (🔄 icon): syncs one domain, handles 404 → State A
- [ ] Global Sync Spaceship button: paginates all, cleans stale rows, shows last synced
- [ ] "Not Listed On" filter includes Spaceship checkbox
- [ ] No credentials → disabled states everywhere, no crashes

### Quality
- [ ] All loading states: spinners on CTAs, per-row 🔄 spins
- [ ] All error states: inline in overlay, toasts for sync
- [ ] Zero TypeScript errors
- [ ] Works at 375px (mobile) and 1440px+ (desktop)



# DNS Checker Tool — Build Plan

Adding a bulk DNS lookup tool (domain → IPv4 via DNS-over-HTTPS) to the
existing Next.js + Supabase application. No backend is required — Cloudflare
(`cloudflare-dns.com/dns-query`) and Google (`dns.google/resolve`) both expose
CORS-enabled DoH JSON APIs that can be called directly from the browser.

Scope: **A (IPv4) records only.**

Picking up at **Phase 7** (Phases 1–6 already complete in the base app).

---

## Phase 7 — Core DNS Resolution Engine

Goal: a pure, framework-agnostic module that does the actual DoH querying.

- [ ] `lib/dns/types.ts` — shared types:
  - `Resolver = "cloudflare" | "google"`
  - `DnsStatus = "ok" | "no_dns" | "pending"`
  - `DnsResult { domain, resolver, status: DnsStatus, ips: string[], error?: string, tookMs?: number }`
- [ ] `lib/dns/providers.ts` — resolver configs:
  - Cloudflare: `GET https://cloudflare-dns.com/dns-query?name={domain}&type=A` with header `Accept: application/dns-json`
  - Google: `GET https://dns.google/resolve?name={domain}&type=A`
- [ ] `lib/dns/resolve.ts`:
  - `resolveDomain(domain, resolver, signal?)` — single A-record query, parses `Answer[]`, maps empty/error → `status: "no_dns"`, at least one IPv4 → `status: "ok"`
  - `resolveBatch(domains, resolver, { concurrency = 20 })` — parallel resolution with a concurrency cap, using `Promise.allSettled` or a small queue
  - Timeout handling via `AbortController` (e.g. 5s per query) — timeout also maps to `"no_dns"`
- [ ] `lib/dns/parseInput.ts` — turn raw pasted text into a clean domain list:
  - Split on newlines, commas, whitespace
  - Strip protocol (`https://`), path, port, trailing slash from full URLs
  - De-duplicate, lowercase, basic hostname validation regex
  - Cap list length (e.g. 200 domains) with a friendly error if exceeded
- [ ] `typecheck` clean pass on new files

**Exit criteria:** `resolveBatch(["google.com"], "cloudflare")` returns a
correctly parsed IPv4 address when manually tested in the browser.

---

## Phase 8 — UI: Input, Controls, Results Table

Goal: the interactive page, client-side only (`"use client"`).

- [ ] Route: `app/(tools)/dns-checker/page.tsx` (adjust to match app's existing tool routing convention)
- [ ] `components/dns-checker/DomainInput.tsx` — textarea + live count of parsed domains + validation warnings
- [ ] `components/dns-checker/ResolverSelector.tsx` — Cloudflare / Google toggle
- [ ] `components/dns-checker/ResultsTable.tsx`:
  - Row per domain: status icon, **domain rendered as a clickable link** (`<a href="https://{domain}" target="_blank" rel="noopener noreferrer">`), IP chip(s) (click-to-copy via `navigator.clipboard`), resolver used, latency
  - Summary bar with tab/pill filters: **All / DNS OK / No DNS** — each showing a live count
  - Filtering just toggles which rows are shown based on `status`
- [ ] `useDnsChecker` hook — owns state (`domains`, `resolver`, `results`, `filter`, `isLoading`), calls `resolveBatch`, streams results in as they resolve (don't block on the whole batch — update table incrementally)
- [ ] Keyboard shortcut: `Ctrl+Enter` / `Cmd+Enter` triggers resolve
- [ ] Empty / loading / error states

**Exit criteria:** paste a list of domains, click Resolve, see results populate live with working copy-to-clipboard, clickable domain links, and the All / DNS OK / No DNS filter correctly partitioning rows.

---

## Phase 9 — Bulk Features: Export & Cross-Verification

- [ ] "Copy CSV" — build CSV string (`domain,status,ip`) client-side, write to clipboard (fallback: download via `Blob` + `<a download>`)
- [ ] "Compare providers" mode — resolve the same batch against both Cloudflare and Google side-by-side, flag mismatches (propagation/cache differences)
- [ ] Loading/progress indicator for large batches (e.g. "42/120 resolved")
- [ ] Graceful partial-failure handling — one bad domain shouldn't block the rest (already handled by `Promise.allSettled` in Phase 7, just surface it in UI)

**Exit criteria:** CSV export opens cleanly in Excel/Sheets; provider comparison clearly highlights differing IPs.

---

## Phase 10 — App Integration

Wire the standalone tool into the rest of the application.

- [ ] Add to main nav / tools index page
- [ ] i18n: if the app already has a locale system, add strings for this tool's copy (labels, FAQ, how-it-works); otherwise ship English-only for now
- [ ] Shared UI kit: reuse existing design system components (buttons, cards, badges) instead of one-offs, per `frontend-design` conventions already used in the app
- [ ] Analytics event hooks if the app tracks tool usage (e.g. "dns_lookup_run" event) — client-side only, no domain data sent to your own servers to preserve the privacy story

**Exit criteria:** tool is reachable from the app's normal navigation and matches the app's visual language.

---

## Phase 11 — Resilience, Rate Limits, Edge Cases

- [ ] Handle DoH provider errors (5xx, timeout, malformed JSON) with a clear per-row `"no_dns"` state, not a crash
- [ ] Client-side concurrency cap (Phase 7) tuned against real browser connection limits (~6 per host, so batch across two hostnames or queue)
- [ ] Handle IDN / punycode domains (`xn--` conversion) if relevant to your audience
- [ ] Abort in-flight requests if the user clears input or navigates away (`AbortController` cleanup in `useEffect`)
- [ ] Basic input abuse guard — cap list size, warn instead of silently truncating
- [ ] Cross-browser check: Safari/Firefox CORS behavior with `cloudflare-dns.com` and `dns.google` (both are known-good, but verify with your CSP)
- [ ] Update `next.config.js` **Content-Security-Policy** `connect-src` to explicitly allow `https://cloudflare-dns.com` and `https://dns.google` if the app enforces a CSP

**Exit criteria:** tool degrades gracefully under bad input, slow networks, and provider errors; no console errors; CSP doesn't block requests.

---

## Phase 12 — Optional Backend Features (only if needed)

The core tool needs no backend. Only build this phase if you want features beyond a stateless utility. Uses the app's existing Supabase project.

- [ ] **Saved lookups** (auth-gated): table `dns_lookups (id, user_id, domains jsonb, resolver, created_at)` — store the *request*, not sensitive result data, unless explicitly desired
- [ ] **Scheduled/monitoring checks**: Supabase Edge Function + `pg_cron` to periodically re-resolve saved domain lists and alert on IP changes (would need a Postgres table for history + a notification mechanism, e.g. email via Resend/Supabase)
- [ ] RLS policies scoping `dns_lookups` to `auth.uid()`
- [ ] `types:generate` — run `supabase gen types typescript --linked > types/supabase.ts` after adding new tables
- [ ] Only proceed here if it doesn't compromise the "we never see your lookups" privacy positioning — make this feature explicitly opt-in

**Exit criteria:** signed-in users can save a domain list and re-run it later; anonymous users still get the full stateless tool with zero data retention.

---

## Phase 13 — Polish, Docs, Ship

- [ ] `format` / `format:check` (Prettier) clean on all new files
- [ ] `lint` clean
- [ ] `typecheck` clean
- [ ] Write short in-app help copy: how-it-works steps, FAQ (privacy, why results differ between resolvers, concurrency limits)
- [ ] Changelog / release notes entry
- [ ] QA pass on mobile viewport (textarea usability, table horizontal scroll)

**Exit criteria:** feature is lint/typecheck/format clean, documented, discoverable, and ready to demo.

---

## Reference: Key Technical Facts

- **Cloudflare DoH JSON endpoint:** `https://cloudflare-dns.com/dns-query?name=<domain>&type=A` with header `Accept: application/dns-json` (no API key, CORS-enabled)
- **Google DoH JSON endpoint:** `https://dns.google/resolve?name=<domain>&type=A` (no API key, CORS-enabled)
- Both can be called directly from client-side `fetch()` — this is what makes the tool backend-free
- Browsers cap concurrent connections per host (~6), so large batches should be queued/throttled client-side rather than fired all at once
- Add both DoH hostnames to CSP `connect-src` if your app sets a Content-Security-Policy header
- Results filter model: `status` is only ever `"ok"` (has ≥1 IPv4) or `"no_dns"` (empty answer, error, or timeout) — the "All / DNS OK / No DNS" pills are a simple client-side filter over this one field

# DNS Checker → TLD Reservation Checker


## Phase 14 — Data Model

New tables, additive to the existing `domains` table (no changes to it except two summary columns).

```sql
-- Cache summary directly on domains for fast table rendering (no join needed for the count column)
ALTER TABLE public.domains
  ADD COLUMN reserved_tlds_count INTEGER DEFAULT NULL, -- NULL = never checked
  ADD COLUMN tlds_last_checked_at TIMESTAMPTZ DEFAULT NULL;

-- Configurable TLD list to check against. Empty for now — populated later.
CREATE TABLE IF NOT EXISTS public.tld_extensions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  extension   TEXT UNIQUE NOT NULL,          -- e.g. 'io', 'ai', 'co'
  category    TEXT DEFAULT 'generic'         -- 'generic' | 'country' | 'new_gtld'
              CHECK (category IN ('generic','country','new_gtld')),
  is_active   BOOLEAN DEFAULT true,          -- toggle without deleting
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- One row per (domain root, tld checked) result
CREATE TABLE IF NOT EXISTS public.domain_extension_checks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id      UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  tld            TEXT NOT NULL,
  full_domain    TEXT NOT NULL,              -- e.g. 'word.io'
  is_reserved    BOOLEAN NOT NULL DEFAULT false,  -- NS lookup succeeded
  is_live        BOOLEAN NOT NULL DEFAULT false,  -- A record resolved
  resolver       TEXT NOT NULL,              -- 'cloudflare' | 'google'
  checked_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (domain_id, tld)
);

CREATE INDEX idx_domain_extension_checks_domain_id ON public.domain_extension_checks(domain_id);
CREATE INDEX idx_domain_extension_checks_user_id ON public.domain_extension_checks(user_id);

-- Job tracking for batch sync runs
CREATE TABLE IF NOT EXISTS public.tld_check_jobs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scope         TEXT NOT NULL CHECK (scope IN ('all','page')),
  domain_ids    UUID[] NOT NULL,             -- resolved list of target domains at job creation time
  status        TEXT DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
  total_pairs   INTEGER DEFAULT 0,           -- domains × active tlds
  processed_pairs INTEGER DEFAULT 0,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ
);

CREATE INDEX idx_tld_check_jobs_user_id ON public.tld_check_jobs(user_id);
```

- [ ] Migration file added
- [ ] `types:generate` run afterward to refresh `types/supabase.ts`
- [ ] RLS policies (own rows only) — see Phase 21

**Exit criteria:** tables exist, `tld_extensions` is empty and ready to be populated later, `domains` has the two new nullable summary columns with no data loss.

---

## Phase 15 — Shared DNS Engine Refactor

Goal: generalize the Phase 7 engine so both the standalone DNS Checker tool *and* this new feature call the same core, instead of duplicating query logic.

- [ ] `lib/dns/resolve.ts` — generalize `resolveDomain(domain, resolver, type: "A" | "NS", signal?)` (was hardcoded to `A`)
- [ ] `lib/dns/parseNsAnswer.ts` — NS responses need different parsing than A (target hostnames, not IPs); `Answer[]` present + non-empty = reserved, `NXDOMAIN`/empty = not reserved
- [ ] Extract the concurrency-limited batch runner from `resolveBatch` into a standalone, fully generic utility: `lib/dns/batchQueue.ts` → `runWithConcurrency<T, R>(items: T[], worker: (item: T) => Promise<R>, concurrency: number): Promise<R[]>`
  - This is the reusable "engine" the user asked to keep separate — any future feature (this one, or others) plugs a worker function into it
- [ ] `lib/dns/resolve.ts`'s `resolveBatch` becomes a thin wrapper around `runWithConcurrency`
- [ ] No behavior change to the existing DNS Checker tool — this phase is a pure refactor, verified by re-running the tool manually

**Exit criteria:** DNS Checker tool (Phases 7–13) still works identically; `runWithConcurrency` and `resolveDomain(..., "NS")` are usable independently and are covered by a quick manual smoke test.

---

## Phase 16 — TLD Reservation Core Logic

The domain-specific logic for this feature, built on top of Phase 15's shared engine. Lives in its own module so it's swappable/reusable, per your requirement.

- [ ] `lib/tld-checker/types.ts`:
  - `ExtensionResult { tld, fullDomain, isReserved, isLive, resolver, tookMs }`
  - `RootExtractor` — derive the checkable "root" from a stored domain (`split_part(domain, '.', 1)` equivalent in JS; flag multi-label TLDs like `.co.uk` as a known edge case to refine later, not blocking for v1)
- [ ] `lib/tld-checker/checkExtensions.ts`:
  - `checkAllExtensionsForRoot(root: string, tlds: string[], resolver, concurrency = 15): Promise<ExtensionResult[]>`
  - For each `tld`, run **NS** query and **A** query in parallel (2 requests per tld), combine into one `ExtensionResult`
  - Uses `runWithConcurrency` from Phase 15 — concurrency applies across the `tld × 2-queries` fan-out for one root
- [ ] `lib/tld-checker/persistResults.ts`:
  - Upsert rows into `domain_extension_checks` (`onConflict: "domain_id,tld"`)
  - After persisting, recompute and write `reserved_tlds_count` + `tlds_last_checked_at` back onto the `domains` row (single source of truth for the fast list-view count, avoids a `COUNT()` join on every table render)
- [ ] This module has **zero UI/route dependencies** — callable from an API route, a cron job, or a future different feature that needs "is this reserved" logic

**Exit criteria:** given one domain row and a non-empty `tld_extensions` test list, running `checkAllExtensionsForRoot` populates correct rows in `domain_extension_checks` and updates the parent `domains.reserved_tlds_count`.

---

## Phase 17 — Batch Sync: Job Queue & Optimized Processing

This is the part that needs real design care — a "Sync all domains" click can mean `domains × active_tlds × 2` DNS queries (e.g. 500 domains × 100 TLDs × 2 = 100,000 requests), which cannot run synchronously in a single request/response cycle or safely all-at-once from the browser.

**Chosen approach: server-side queued job, processed in chunks, progress streamed to the client.**

- [ ] **Job creation** (`POST /api/tld-checker/jobs`):
  - Resolve `scope` ("all" vs current-page domain IDs passed from client) into a concrete `domain_ids` array at creation time (snapshot, so the job isn't affected by later edits)
  - Compute `total_pairs = domain_ids.length × active_tld_count`
  - Insert a `tld_check_jobs` row with `status = 'queued'`
- [ ] **Processing strategy** (avoids hitting DoH provider throttles discussed earlier, and avoids serverless function timeouts):
  - Process **domains in small groups** (e.g. 5 roots at a time), each root internally fanning out to TLDs with `concurrency = 15` (from Phase 16) → realistic peak of ~75 simultaneous DoH requests, comfortably under the informal per-IP throttling ranges discussed earlier
  - **Split traffic across both resolvers** (alternate Cloudflare/Google per root, or per chunk) to roughly double effective throughput and avoid concentrating all load on one provider from the same server IP
  - After each domain root finishes, immediately persist its results (Phase 16's `persistResults`) and increment `processed_pairs` on the job row — **incremental, resumable persistence**, not all-or-nothing
  - If a job is interrupted (server restart, crash), it can be resumed by re-querying only `domain_ids` whose `tlds_last_checked_at` is older than the job's `created_at` — no wasted duplicate work
- [ ] **Execution model** — pick based on your hosting:
  - If serverless function duration limits are a concern for large "all domains" runs: run the loop inside a Supabase **Edge Function** invoked by the API route (can run longer / independently of the Next.js request lifecycle), or trigger via `pg_cron` picking up `queued` jobs every few seconds and processing one chunk per tick until `processed_pairs === total_pairs`
  - If batches are always small/medium (e.g. capped "all domains" at a sane limit, or scope is usually just the current page of 50–200): a background-processed API route with `waitUntil`/streaming response can suffice without extra infra
- [ ] **Retry/backoff**: any individual NS/A query that gets a `429` or times out is retried once with backoff before being recorded as `is_reserved: false` — avoids false negatives from transient throttling
- [ ] **Progress delivery to client**: client subscribes to the `tld_check_jobs` row via **Supabase Realtime** (or polls every 2–3s as a simpler fallback) to update a progress bar (`processed_pairs / total_pairs`)

**Exit criteria:** triggering a sync on 50 domains with a populated TLD list completes with correct per-domain counts, survives a mid-run interruption without duplicating already-checked pairs, and the client sees live progress.

---

## Phase 18 — API Routes / Server Actions

- [ ] `POST /api/tld-checker/jobs` — create a job (scope: `"all" | "page"`, and if `"page"`, the domain IDs currently rendered)
- [ ] `GET /api/tld-checker/jobs/:id` — job status (for polling fallback if not using Realtime)
- [ ] `GET /api/tld-checker/domains/:domainId/extensions` — fetch the list of reserved extensions for one domain (powers the dropdown in Phase 19), returns `[{ tld, fullDomain, isReserved, isLive }]` sorted reserved-first
- [ ] `POST /api/tld-checker/domains/:domainId/refresh` — single-domain "run/reload" action (for the 0-count row button, no need to spin up a full job for one domain)
- [ ] All routes scoped to `auth.uid()`, reject cross-user domain IDs server-side (defense in depth alongside RLS)

**Exit criteria:** each route independently testable via curl/Postman with a valid session; unauthorized access to another user's domain ID returns 403/404, not data.

---

## Phase 19 — UI: Domains Table Column

- [ ] New column header **"TLDs Reserved"** inserted before **Actions**
- [ ] Cell rendering per row, based on `reserved_tlds_count`:
  - `NULL` (never checked) or `0` → small **Run**/reload icon button (matches your existing icon-button style) → calls the single-domain refresh route (Phase 18), shows a spinner while in flight, then updates in place
  - `> 0` → a pill/badge showing the number, with a small chevron-down icon next to it
- [ ] Clicking the count+chevron opens a **popover/dropdown** listing every reserved extension for that domain (fetched from Phase 18's `GET .../extensions` route, or from already-loaded data if you prefetch)
  - Each row in the dropdown: extension (e.g. `.io`), a small live/not-live indicator, and the row itself is clickable → opens `https://{root}.{tld}` in a new tab (`target="_blank" rel="noopener noreferrer"`), matching the clickable-domain pattern from the DNS Checker tool
- [ ] Loading state while the dropdown's data is being fetched (skeleton rows)
- [ ] Empty state inside the dropdown if somehow 0 reserved but the button was still clickable (defensive, shouldn't normally occur)

**Exit criteria:** a domain with `reserved_tlds_count = 0` shows a run button that triggers a check and updates the row; a domain with a positive count shows the number + dropdown, and dropdown items open the correct URL.

---

## Phase 20 — UI: Sync Button & Scope Selection

- [ ] **Sync** button placed near the domains table's existing controls (e.g. next to pagination/page-size controls, since scope depends on it)
- [ ] Clicking opens a small modal/popover with scope choice:
  - **All domains** (shows total domain count for the user)
  - **Current page** (shows however many are on the current page — 50/100/200, matching your existing pagination size selector)
- [ ] Confirm triggers `POST /api/tld-checker/jobs` (Phase 18) with the resolved scope
- [ ] While a job is running: show a progress bar/toast (`processed / total`), disable the Sync button (or let it queue another job — your call, but disabling avoids overlapping jobs against the same domains) and reflect per-row updates live as results land (via the same Realtime subscription, or by refetching the visible page once the job completes)
- [ ] On completion: toast/notification with a short summary (e.g. "Checked 50 domains — 340 reserved extensions found")
- [ ] On failure: surface the job's `error` field with a retry option

**Exit criteria:** user can pick a scope, watch progress, and see the domains table's counts update as the job proceeds or completes, without a full page reload.

---

## Phase 21 — RLS & Security

```sql
ALTER TABLE public.domain_extension_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tld_check_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tld_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own extension checks" ON public.domain_extension_checks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own tld jobs" ON public.tld_check_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tld_extensions is shared reference data, not per-user — read-only for all authenticated users
CREATE POLICY "read active tlds" ON public.tld_extensions
  FOR SELECT USING (is_active = true);
```

- [ ] Confirm `domain_extension_checks.domain_id` always belongs to a `domains` row owned by the same `user_id` (enforced at the API layer in Phase 18, since a DB-level cross-table check needs a trigger or just trusting the app layer + RLS on both tables)
- [ ] Only privileged/admin path (not exposed to regular users) can write to `tld_extensions` — regular users only read `is_active = true` rows

**Exit criteria:** a user cannot read or trigger checks against another user's domains via any route, verified by testing with two accounts.

---

## Phase 22 — Polish & Ship

- [ ] `format` / `lint` / `typecheck` clean on all new files
- [ ] Empty-state messaging when `tld_extensions` has zero active rows (since it's intentionally empty for now) — Sync button should be disabled with a tooltip like "No TLD list configured yet" rather than silently doing nothing
- [ ] Document the NS-based "reserved" heuristic and its known limitation (Phase 14 note) somewhere visible in-app (tooltip/info icon next to the column header) so it's clear this isn't authoritative WHOIS data
- [ ] Confirm the standalone DNS Checker tool (Phases 7–13) is unaffected by the Phase 15 refactor
- [ ] Changelog entry

**Exit criteria:** feature is clean, documented, and both features (DNS Checker tool + TLD Reservation column/sync) share the Phase 15 engine without duplication.

# DomainVault — Phase 23 · Promoting (TLD Outreach Tracker)

> Standalone spec for Phase 23 only. Builds on top of the TLD Reservation Checker
> (Phases 14–22), which already computes and stores reserved TLDs per domain.
> Build order: **Step 1 — Migration → Step 2 — API Routes → Step 3 — Page & Components → Step 4 — Polish**
>
> ### Tags
> - `[NEW]` — does not exist yet, must be built from scratch
> - `[REUSE]` — existing route/hook/component from a prior phase, no changes needed

---

## Goal

A new **`/promoting`** page where the user picks one domain from their portfolio and
sees every **reserved TLD variant** of that domain (e.g. `word.io`, `word.ai`, `word.co`
if `word.com` is the base domain), already computed by the Phase 14–22 TLD checker.

For each reserved TLD the user tracks manual outreach to the current owner:
- **TLD** — clickable link
- **Contacted** — checkbox
- **Reply** — Pending / Positive / Negative

If the selected domain has never been checked (or has 0 reserved TLDs), the page
offers a one-click "Run TLD Check" using the existing single-domain refresh route —
no new DNS logic is built here, this phase is purely the outreach layer on top.

---

## Design Constraints

- Reuses the existing design system exactly as defined in the master plan (Section 4):
  same CSS variables, same dark/light palettes, same `accent-success` /
  `accent-warning` / `accent-danger` semantics, same Syne / DM Sans / JetBrains Mono
  type pairing (TLD/domain strings in JetBrains Mono, like everywhere else in the app).
- Reuses shadcn/ui primitives already in the codebase (`Table`, `Checkbox`, `Select`,
  `Badge`, `Card`, `Combobox`/`Command` for the domain picker, `Skeleton`). Only build
  a new component if nothing existing covers it — see Step 3 component table for which
  are genuinely new vs. reused.
- Follows the same interaction conventions already established: hover lift on cards,
  optimistic updates on toggles (pattern already used in US-010 domain edit and the
  Sedo/Spaceship overlays), skeleton loaders on async fetch, toast on save.
- KPI-style summary cards on this page follow the exact same visual spec as US-013
  (icon, accent stripe, animated counter, hover lift) — not a new card style.

---

## Step 1 — Migration

### Migration 009 — `tld_outreach` table `[NEW]`

One row per **(domain, TLD)** the user is tracking outreach for. Keyed off
`domain_extension_checks` conceptually (same `domain_id` + `tld` pair) but kept as
its own table since outreach is a distinct, user-editable concern from the
read-only DNS check results.

```sql
CREATE TABLE IF NOT EXISTS public.tld_outreach (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id      UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  tld            TEXT NOT NULL,
  full_domain    TEXT NOT NULL,                 -- e.g. 'word.io' — denormalized for fast render
  contacted      BOOLEAN NOT NULL DEFAULT false,
  contacted_at   TIMESTAMPTZ,
  reply_status   TEXT NOT NULL DEFAULT 'pending'
                 CHECK (reply_status IN ('pending', 'positive', 'negative')),
  reply_at       TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (domain_id, tld)
);

CREATE INDEX idx_tld_outreach_user_id   ON public.tld_outreach(user_id);
CREATE INDEX idx_tld_outreach_domain_id ON public.tld_outreach(domain_id);
CREATE INDEX idx_tld_outreach_reply     ON public.tld_outreach(reply_status);

ALTER TABLE public.tld_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tld_outreach" ON public.tld_outreach
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

- `contacted_at` set server-side the moment `contacted` flips `false → true`; cleared
  if unchecked.
- `reply_at` set server-side whenever `reply_status` changes away from `'pending'`.
- A row is only ever created lazily (on first checkbox/select interaction) — reserved
  TLDs with no outreach yet don't need a pre-seeded row; the UI treats "no row" the
  same as `contacted: false, reply_status: 'pending'`.

- [ ] Migration 009 applied
- [ ] `types:generate` run afterward to refresh `types/supabase.ts`

---

## Step 2 — API Routes / Hooks

No new DNS/network calls in this phase — reads reuse Phase 18's existing extension
data, writes are plain Supabase upserts on `tld_outreach`.

### Reused from Phase 18 `[REUSE]`

| Route | Purpose here |
|---|---|
| `GET /api/tld-checker/domains/:domainId/extensions` | Fetch reserved TLDs for the selected domain (filter client-side to `isReserved === true`) |
| `POST /api/tld-checker/domains/:domainId/refresh` | "Run TLD Check" button when a domain has never been checked or has 0 reserved TLDs |

### New hooks `[NEW]`

```
lib/hooks/
  usePromotingDomains.ts
  useReservedTlds.ts
  useTldOutreach.ts
```

**`usePromotingDomains.ts`**
```ts
// TanStack Query key: ['promoting-domains']
// Lightweight list of the user's active domains for the Combobox picker:
// { id, domain, reserved_tlds_count, tlds_last_checked_at }
// Sourced directly from `domains` (already has the two summary columns from Phase 14).
export function usePromotingDomains(): {
  domains: PromotingDomainOption[]
  isLoading: boolean
}
```

**`useReservedTlds.ts`**
```ts
// TanStack Query key: ['reserved-tlds', domainId]
// Calls the reused GET .../extensions route, filters isReserved === true,
// sorted by tld ascending.
export function useReservedTlds(domainId: string | null): {
  tlds: ReservedTld[]        // { tld, fullDomain, isLive }
  isLoading: boolean
  isEmpty: boolean           // true if checked but 0 reserved
  neverChecked: boolean      // true if domains.reserved_tlds_count is NULL
}
```

**`useTldOutreach.ts`**
```ts
// TanStack Query key: ['tld-outreach', domainId]
// Reads all tld_outreach rows for the domain, returns Map<tld, OutreachRow>
// so the table can merge with useReservedTlds() by tld — O(1) lookup, missing
// entries default to { contacted: false, reply_status: 'pending' }.
//
// Mutations (optimistic, mirrors the Domain slide-over pattern from US-010):
//   toggleContacted(tld: string, next: boolean) -> upsert tld_outreach
//   setReplyStatus(tld: string, status: 'pending' | 'positive' | 'negative') -> upsert
// Both invalidate ['tld-outreach', domainId] and ['promoting-domains']
// (so the summary card / domain list counts stay in sync).
export function useTldOutreach(domainId: string | null): {
  outreach: Map<string, OutreachRow>
  isLoading: boolean
  toggleContacted: (tld: string, next: boolean) => Promise<void>
  setReplyStatus: (tld: string, status: ReplyStatus) => Promise<void>
}
```

All writes go directly through the Supabase client (RLS-protected), same pattern
already used for domain CRUD (US-010/US-011) — no dedicated API route needed since
there's no third-party call involved, just a table upsert.

- [ ] `usePromotingDomains`, `useReservedTlds`, `useTldOutreach` implemented
- [ ] Optimistic UI on checkbox + reply select, rollback on error with toast

---

## Step 3 — Page & Components

### Route

```
app/(dashboard)/promoting/page.tsx
```

Added to sidebar nav (desktop) and bottom tab bar (mobile), per the existing
US-003 navigation pattern — icon suggestion: `Megaphone` (lucide-react).

Deep-linkable via query param: `/promoting?domain=<domain_id>` — read on mount to
pre-select the domain, written back whenever the user picks a new one (`router.replace`,
no full navigation), matching the URL-sync convention already used for domain filters
(US-009c).

### New files

```
components/promoting/
  PromotingPage.tsx        ← page shell, layout, state orchestration
  DomainPicker.tsx         ← searchable combobox to select a domain
  PromotingSummaryCards.tsx← 3 KPI-style cards for the selected domain
  ReservedTldTable.tsx     ← desktop table: TLD / Contacted / Reply
  ReservedTldCardRow.tsx   ← mobile card layout (same data, stacked)
  ReplyStatusSelect.tsx    ← small segmented control / select used in the table
  RunTldCheckPrompt.tsx    ← empty state CTA when domain has 0 / never checked

types/
  promoting.ts
```

### TypeScript types — `types/promoting.ts`

```ts
export interface PromotingDomainOption {
  id: string
  domain: string
  reserved_tlds_count: number | null
  tlds_last_checked_at: string | null
}

export interface ReservedTld {
  tld: string
  fullDomain: string
  isLive: boolean
}

export type ReplyStatus = 'pending' | 'positive' | 'negative'

export interface OutreachRow {
  contacted: boolean
  contacted_at: string | null
  reply_status: ReplyStatus
  reply_at: string | null
}
```

---

### Layout

```
Desktop ≥1024px:
┌───────────────────────────────────────────────────────────────────┐
│  Page title "Promoting"          [ DomainPicker ▾ ]                │
├───────────────────────────────────────────────────────────────────┤
│  Summary cards row (3 across): Reserved TLDs · Contacted · Replies │
├───────────────────────────────────────────────────────────────────┤
│  Reserved TLD Table (full width)                                   │
│  TLD            Contacted        Reply                             │
│  word.io  ↗      [ ]             [ Pending ▾ ]                     │
│  word.ai  ↗      [x]             [ Positive ]                      │
│  word.co  ↗      [x]             [ Negative ]                      │
└───────────────────────────────────────────────────────────────────┘

Mobile <768px: DomainPicker becomes a full-width control below the title,
summary cards become horizontal scroll chips (same pattern as US-019 Quick
Stats on mobile), table becomes stacked cards (ReservedTldCardRow), one per TLD.
```

---

### US-061 — Domain Picker `[NEW]`

**Component**: `components/promoting/DomainPicker.tsx`

- shadcn `Command` + `Popover` combobox (searchable), consistent with any existing
  autocomplete pattern in the app (e.g. Registrar autocomplete in US-010).
- Options sourced from `usePromotingDomains()`. Each option shows: domain name
  (JetBrains Mono), and a small muted badge with `reserved_tlds_count` (or
  "not checked" if `null`).
- Selecting an option updates local state + `?domain=` query param.
- Empty portfolio → placeholder "No domains yet — add one from Import".

---

### US-062 — Promoting Summary Cards `[NEW]`

**Component**: `components/promoting/PromotingSummaryCards.tsx`

Only rendered once a domain is selected. Same visual spec as US-013 KPI cards
(icon, accent stripe, animated counter, hover lift, skeleton while loading):

1. **Reserved TLDs** — total count for the selected domain, accent-primary stripe.
2. **Contacted** — count where `contacted = true`, accent-warning stripe.
3. **Positive Replies** — count where `reply_status = 'positive'`, accent-success
   stripe. Subtext: "`N` negative" in `accent-danger` muted text underneath, so both
   reply outcomes are visible without a 4th card.

Clicking a card is not interactive in v1 (no drill-down target exists) — no hover
lift removed, but no click handler either, matching how US-018/US-019 non-clickable
widgets behave elsewhere in the app.

---

### US-063 — Reserved TLD Table `[NEW]`

**Component**: `components/promoting/ReservedTldTable.tsx` (desktop) /
`ReservedTldCardRow.tsx` (mobile, <768px, same breakpoint as the Domains table).

Data: merge of `useReservedTlds(domainId)` (the TLD list) and
`useTldOutreach(domainId)` (the outreach state), joined by `tld`.

**Columns**

| Column | Rendering |
|---|---|
| TLD | `fullDomain` in JetBrains Mono, `accent-primary` link with external-link icon (`↗`), `<a href="https://{fullDomain}" target="_blank" rel="noopener noreferrer">` — same clickable-domain pattern as the DNS Checker tool and the TLD dropdown in US-019. A small dot indicator (green/gray) reflects `isLive` from the DNS check, matching existing status-dot conventions. |
| Contacted | shadcn `Checkbox`. Checking it calls `toggleContacted(tld, true)` optimistically; row shows a brief "Contacted just now" tooltip on hover using `contacted_at`. |
| Reply | `ReplyStatusSelect` — see US-064 below. |

Sortable by TLD (default) or by Reply status (positive first) via column header
click, consistent with the sortable-column pattern already used in US-009 Domain List.

**Empty / loading states**
- Loading: skeleton rows (5), matching Domains table skeleton pattern.
- Domain has reserved TLDs but table briefly empty during refetch: previous data
  kept visible (TanStack Query `keepPreviousData`), no flash.

---

### US-064 — Reply Status Control `[NEW]`

**Component**: `components/promoting/ReplyStatusSelect.tsx`

A small shadcn `Select` styled as a status pill rather than a plain dropdown:

```
[ Pending ▾ ]   ← text-muted, neutral border
[ Positive ▾ ]  ← accent-success background tint
[ Negative ▾ ]  ← accent-danger background tint
```

- Options: `Pending` / `Positive` / `Negative`.
- Changing the value calls `setReplyStatus(tld, status)` optimistically; pill color
  transitions smoothly (existing micro-interaction standard from Section 2 — Core
  Principles: "hover effects, micro-interactions, and smooth transitions on all
  interactive elements").
- Disabled (grayed, no interaction) until `Contacted` is checked — reply doesn't make
  sense before outreach happened. Tooltip on disabled state: "Mark as contacted first".

---

### US-065 — Run TLD Check Empty State `[NEW]`

**Component**: `components/promoting/RunTldCheckPrompt.tsx`

Shown instead of the table when `useReservedTlds` returns `neverChecked` or `isEmpty`:

```
┌─────────────────────────────────────────────┐
│         🔍                                   │
│   No TLD data yet for word.com               │
│   Run a check to see which extensions        │
│   are already reserved.                      │
│                                              │
│        [ Run TLD Check ]                     │
└─────────────────────────────────────────────┘
```

- Button calls the reused `POST /api/tld-checker/domains/:domainId/refresh` (Phase 18),
  same spinner/disabled-during-call behavior as the row-level "Run" button in US-019.
- On success: invalidate `['reserved-tlds', domainId]` and `['promoting-domains']`,
  table replaces the empty state automatically.
- If `isEmpty` (checked, genuinely 0 reserved TLDs): copy changes to "No reserved
  TLDs found for word.com — checked `X` extensions." with a "Re-check" button instead
  of "Run TLD Check", no crash, no dead end.
- If the global `tld_extensions` reference list is itself empty (Phase 22 known
  state), button is disabled with the same tooltip already defined in Phase 22:
  "No TLD list configured yet."

---

## Definition of Done — Phase 23

### Step 1 — Migration
- [ ] Migration 009 applied (`tld_outreach` table + RLS + indexes)
- [ ] `types:generate` run

### Step 2 — Hooks
- [ ] `usePromotingDomains` returns domain list with reserved counts
- [ ] `useReservedTlds` reuses Phase 18 extensions route, filters to reserved-only
- [ ] `useTldOutreach` merges outreach rows, defaults missing rows correctly
- [ ] `toggleContacted` / `setReplyStatus` optimistic, roll back cleanly on error
- [ ] `contacted_at` / `reply_at` set server-side on state transitions

### Step 3 — Page & Components
- [ ] `/promoting` route added, reachable from sidebar (desktop) + tab bar (mobile)
- [ ] `?domain=` query param drives and reflects the selected domain
- [ ] `DomainPicker` searchable, shows reserved-count badge per option
- [ ] Summary cards render with correct counts, icon/stripe/hover styling matches US-013
- [ ] `ReservedTldTable` (desktop) and `ReservedTldCardRow` (mobile) both render correctly
- [ ] TLD links open correctly in a new tab; live/not-live dot accurate
- [ ] Contacted checkbox persists and reflects immediately (optimistic)
- [ ] Reply select disabled until contacted, colors match accent tokens, persists correctly
- [ ] `RunTldCheckPrompt` covers all 3 empty-state variants (never checked / 0 reserved / no TLD list configured)
- [ ] Sorting by TLD and by Reply status works

### Quality
- [ ] Dark and light mode both fully styled — no hardcoded colors outside CSS variables
- [ ] Fully responsive: 375px (mobile cards) through 1920px (desktop table)
- [ ] Skeleton loaders on every async section, no layout shift
- [ ] Zero TypeScript errors
- [ ] No new third-party calls introduced — this phase only writes to `tld_outreach`
      and reads/reuses Phase 18 routes
# DomainVault — Afternic Integration (Phases 24–30)

> Append this block to `plan.md`. Mirrors the Sedo (Phase 5) and Spaceship (Phase 6) structure.
> Build order inside each phase is top-to-bottom.
>
> **Numbering note:** I could not see the end of `plan.md` (the page cut off inside Phase 23), so I used Phases **24–30**, user stories **US-061+**, and migrations **`0NN` / `0NN+1`**. Renumber to match your file.
>
> ### Tags
> - `[NEW]` — build from scratch
> - `[UPDATED]` — exists, modify as described
> - `[REUSE]` — existing code, no change

---

## Key differences vs Sedo & Spaceship

|                    | Sedo                                 | Spaceship                           | **Afternic**                                                                 |
|--------------------|--------------------------------------|-------------------------------------|------------------------------------------------------------------------------|
| Protocol           | SOAP / XML                           | REST / JSON                         | **REST / JSON**                                                              |
| Base URL           | `api.sedo.com/api/v1`                | `spaceship.dev/api/v1`              | **`https://api.afternic.com/v3/aftermarket/customers/my`**                   |
| Auth               | partnerid + signkey + user + pass    | `X-Api-Key` + `X-Api-Secret`        | **`Authorization: sso-key KEY:SECRET`**                                      |
| Required headers   | —                                    | —                                   | **`User-Agent: DomainVault/1.0` (requests without it are rejected)**, optional `X-Request-Id` (UUID) |
| Credential test    | `CheckMember`                        | `GET sellerhub/domains?take=1`      | **`GET /domains?limit=1`** (401/403 = bad creds)                             |
| List all           | `DomainList` (`startfrom`)           | `GET` (`take`/`skip`)               | **`GET /domains?limit=N&offset=N&order=NAME_ASC`**, follow `pagination.next` |
| Get one            | `DomainList` w/ filter               | `GET /{domain}`                     | **`GET /domains/{domain}?includes=fastTransferStatus`**                      |
| Create             | `DomainInsert`                       | `POST`                              | **`POST /domains`** (409 if already exists)                                  |
| Edit               | `DomainEdit`                         | `PATCH`                             | **`PATCH /domains/{domain}`** (partial; may return `204` with no body)       |
| Delete             | `DomainDelete`                       | `DELETE`                            | **`DELETE /domains/{domain}`** (204; 422 if domain is on hold)               |
| Bulk               | —                                    | —                                   | **`POST /domains/$each/upsert`**, **`/$each/get`**, **`/$each/delete`**, **`/$each/relist`** (max 500) + CSV Jobs API |
| Price unit         | USD decimal                          | `{ amount: "500", currency }`       | **Integer microunits, whole dollars only: `$500` → `500000000`**             |
| Rate limit         | n/a                                  | 300 req / 300s                      | **150 req/min (reads count too)**                                            |
| Error format       | XML `<SEDOFAULT>`                    | `{ detail }`                        | **`{ code, message, details?, fields?[] }`**                                 |
| Listing status     | n/a                                  | `active/pending/failed`             | **`listStatus`: `PENDING` · `ACTIVE` · `HIDDEN` · `ON_HOLD` · `SOLD` · `INACTIVE` · `FAILED_COMPLIANCE`** |
| Extra status       | n/a                                  | n/a                                 | **`fastTransferStatus`** (separate from `listStatus`)                        |

---

## Afternic API facts that shape the design

- **Microunit prices.** Afternic wants whole-dollar USD × 1,000,000. DomainVault stores `DECIMAL(10,2)`, so convert with `Math.round(usd) * 1_000_000` on write and `/ 1_000_000` on read. Cents are dropped — warn the user in the UI when a price has cents.
- **Price bounds.** `minbidPrice` must be **≥ $20** (`20000000`). Max value `49999999000000`.
- **Listing a domain ≠ showing a price.** `landingPage` defaults to `PARKING_TYPE`. To show a Buy-Now price we must send `landingPage: "SALES_TYPE"` + `intakeStyle: "BUYNOW"`.
- **Landers need Afternic nameservers** on the domain. A listing can be `ACTIVE` while the lander is not reachable — surface this as a hint, not an error.
- **Fast Transfer is separate from listing status.** Check both. Statuses seen in docs: `ACTIVE` · `AWAITING_OPT_IN` · `INACTIVE_BUYNOW_MISSING` · `INACTIVE_BUYNOW_HIGH` · `INELIGIBLE_REGISTRAR` · `INELIGIBLE_TLD` · `PENDING_REVIEW`.
- **Domain names** must be lowercase ASCII (IDNA2008 punycode for IDNs). Convert before every call.
- **Max 2 API keys** per Afternic account.
- **Upserts can create** missing listings and return a per-domain result — HTTP 200 does not mean every item succeeded.
- **Don't mutate `ON_HOLD` / `SOLD` listings** without checking the related sale first.

### How to get Afternic credentials
Sign in to Afternic → **Account Profile** (`https://www.afternic.com/account/profile`) → **Security** → **API Keys** → **Create API Key**. Save both `key` and `secret` (the secret is only shown once).

---

# Phase 24 · Afternic Foundation (Migrations, Settings, Client Lib) `[NEW]`

**Goal**: Credentials stored and testable, cache table ready, typed API client usable from server code. No domain-page UI yet.

### Step 1 — Migrations

#### Migration `0NN` — Afternic credentials in `user_settings` `[NEW]`
```sql
ALTER TABLE user_settings
  ADD COLUMN afternic_api_key    TEXT,
  ADD COLUMN afternic_api_secret TEXT;
```
> RLS already covers `user_settings`. Same plain-text-behind-RLS tradeoff as Sedo/Spaceship; consider `pgcrypto`/Supabase Vault as a follow-up for all three marketplaces at once.

#### Migration `0NN+1` — `afternic_listings` cache `[NEW]`
```sql
CREATE TABLE afternic_listings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id             UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL UNIQUE,
  domain_name           TEXT NOT NULL,
  display_name          TEXT,
  list_status           TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (list_status IN ('PENDING','FAILED_COMPLIANCE','ACTIVE','HIDDEN','ON_HOLD','SOLD','INACTIVE')),
  fast_transfer_status  TEXT,                         -- raw string from API, nullable
  buynow_price          DECIMAL(10,2),                -- USD dollars (converted from microunits)
  floor_price           DECIMAL(10,2),
  minbid_price          DECIMAL(10,2),
  landing_page          TEXT NOT NULL DEFAULT 'SALES_TYPE'
                        CHECK (landing_page IN ('SALES_TYPE','PARKING_TYPE')),
  intake_style          TEXT NOT NULL DEFAULT 'BUYNOW'
                        CHECK (intake_style IN ('BUYNOW','PRICE_FORM','CUSTOM_LANDER')),
  hidden                BOOLEAN NOT NULL DEFAULT false,
  featured              BOOLEAN NOT NULL DEFAULT false,
  leasing_enabled       BOOLEAN NOT NULL DEFAULT false,
  max_lease_period      INTEGER CHECK (max_lease_period BETWEEN 2 AND 60),  -- number of payments
  show_lander_buynow    BOOLEAN NOT NULL DEFAULT true,
  show_lander_makeoffer BOOLEAN NOT NULL DEFAULT false,
  show_lander_lease     BOOLEAN NOT NULL DEFAULT false,
  intake_views          INTEGER,                      -- filled by stats sync (Phase 30)
  intake_leads          INTEGER,
  afternic_registrar    TEXT,                         -- registrar as reported by Afternic
  listed_at             TIMESTAMPTZ,
  last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_afternic_listings_user_id   ON afternic_listings(user_id);
CREATE INDEX idx_afternic_listings_domain_id ON afternic_listings(domain_id);
CREATE INDEX idx_afternic_listings_status    ON afternic_listings(list_status);

ALTER TABLE afternic_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own afternic_listings"
  ON afternic_listings FOR ALL USING (auth.uid() = user_id);
```

### Step 2 — Settings Page `[UPDATED]`

**File**: `components/settings/AfternicCredentialsForm.tsx` (new). Added as **Section 4** below Spaceship.

```
┌─────────────────────────────────────────────────────┐
│  Afternic API Credentials                           │
│  ─────────────────────────────────────────────────  │
│  API Key     [________________________________]     │
│  API Secret  [••••••••••••••••••••••••]  👁          │
│  ─────────────────────────────────────────────────  │
│  [Test Connection]              [Save Credentials]  │
│                                                     │
│  ✅ Connected  /  ❌ Invalid credentials             │
└─────────────────────────────────────────────────────┘
```

Helper text:
> "Create an API key in Afternic → Account Profile → Security → API Keys. Save the secret immediately — you can have at most 2 keys."

- On load: pre-fill key, mask secret (`••••••••` if saved, never expose the value).
- **Test Connection** → `GET /api/afternic/check` (does not save).
- **Save Credentials** → both fields required → upsert `user_settings` → toast `"Afternic credentials saved"`.

### Step 3 — Lib & Types

```
lib/afternic/
  client.ts       ← callAfternic(credentials, method, path, body?)
  pricing.ts      ← dollars <-> microunits, chips, payload builder
  names.ts        ← toAsciiDomain() (lowercase + punycode)
  mappers.ts      ← API listing -> afternic_listings row
types/afternic.ts
```

**`client.ts`**
- Base: `https://api.afternic.com/v3/aftermarket/customers/my`
- Headers on every call: `Authorization: sso-key {key}:{secret}`, `User-Agent: DomainVault/1.0`, `Content-Type: application/json`, `X-Request-Id: <uuid v4>`
- Handle `204` (no body) for DELETE and some PATCH calls
- Throw `AfternicError { status, code, message, details?, fields? }`
- `429` → read `Retry-After`, retry once; otherwise throw
- `5xx` / `503` → retry with exponential backoff (max 2 retries)
- Built-in **token-bucket limiter: 150 req/min** per user (shared by every route)

**`pricing.ts`**
```ts
export const toMicro   = (usd: number) => Math.round(usd) * 1_000_000
export const fromMicro = (micro: number | null | undefined) =>
  micro == null ? null : micro / 1_000_000

export const MIN_BID_USD = 20

export function buynowSuggestions(bin: number | null) { /* BIN · BIN −20% · BIN −30% (whole dollars) */ }
export function minbidSuggestions(buynow: number)       { /* 20% · 30% · 40% · 50%, clamped to >= $20 */ }

export function buildAfternicPayload(i: {
  buynow: number | null
  minbid: number | null
  floor?: number | null
  displayName?: string
  intakeStyle?: 'BUYNOW' | 'PRICE_FORM' | 'CUSTOM_LANDER'
}) {
  return {
    landingPage: 'SALES_TYPE' as const,
    intakeStyle: i.intakeStyle ?? 'BUYNOW',
    ...(i.buynow != null && { buynowPrice: toMicro(i.buynow) }),
    ...(i.minbid != null && { minbidPrice: toMicro(Math.max(i.minbid, MIN_BID_USD)) }),
    ...(i.floor  != null && { floorPrice:  toMicro(i.floor) }),
    ...(i.displayName && { displayName: i.displayName }),
  }
}
```

**`types/afternic.ts`** — `AfternicCredentials`, `AfternicListing` (cache row), `AfternicApiDomain` (raw), `AfternicListStatus`, `AfternicFastTransferStatus`, `AfternicErrorBody`.

### Definition of Done — Phase 24
- [ ] Both migrations applied, RLS verified with two accounts
- [ ] Settings Section 4 renders, secret masked, show/hide toggle works
- [ ] Test Connection shows ✅/❌ without saving; Save upserts + toast
- [ ] `callAfternic` sends all required headers (incl. `User-Agent`) and handles 204
- [ ] `toMicro`/`fromMicro` unit-tested (cents rounded, null-safe, $20 floor)
- [ ] `toAsciiDomain('Exämple.DE') === 'xn--exmple-cua.de'`
- [ ] Zero TypeScript errors

---

# Phase 25 · Afternic API Routes `[NEW]`

**Goal**: Server routes wrapping every Afternic call DomainVault needs. All routes follow the same pattern as Sedo/Spaceship.

```
app/api/afternic/
  check/route.ts
  list/route.ts
  status/route.ts
  insert/route.ts
  edit/route.ts
  delete/route.ts
  bulk-upsert/route.ts
```

### Shared pattern
```
1. Authenticated user via Supabase server client
2. Fetch user_settings -> 401 { error: 'Add Afternic credentials in Settings' } if missing
3. Normalise domain names with toAsciiDomain()
4. callAfternic() -> map AfternicError to { error: message, code } with the original status
5. Return { data } on success
```

### Route table

| Method   | Route                        | Afternic call                                                   | Body / Params |
|----------|------------------------------|-----------------------------------------------------------------|---------------|
| `GET`    | `/api/afternic/check`        | `GET /domains?limit=1`                                          | — |
| `GET`    | `/api/afternic/list`         | `GET /domains?limit=50&offset=N&order=NAME_ASC` (loop)          | — |
| `GET`    | `/api/afternic/status`       | `GET /domains/{domain}?includes=fastTransferStatus`             | `?domain=example.com` |
| `POST`   | `/api/afternic/insert`       | `POST /domains`                                                 | `{ domain, buynow, minbid?, floor?, displayName?, intakeStyle? }` |
| `PATCH`  | `/api/afternic/edit`         | `PATCH /domains/{domain}`, then `GET` if response is `204`      | `{ domain, buynow?, minbid?, floor?, displayName?, intakeStyle?, hidden? }` |
| `DELETE` | `/api/afternic/delete`       | `DELETE /domains/{domain}`                                      | `{ domain }` |
| `POST`   | `/api/afternic/bulk-upsert`  | `POST /domains/$each/upsert` (chunks of 500)                    | `{ items: [{ domain, buynow, minbid?, ... }] }` |

### Route-specific rules
- **`list`**: paginate until `pagination.next` is absent (or fewer rows than `limit` return). Always use a fixed `order=NAME_ASC` so pages don't shift. Include `includes=fastTransferStatus` if the endpoint supports it for list calls; otherwise fetch fast-transfer status lazily per row.
- **`insert`**: `409 CONFLICT` (already exists in Afternic) → **do not fail**; fall back to `GET` + cache upsert and return `{ data, alreadyExisted: true }`.
- **`edit`**: `204` has no body → re-`GET` the domain and return fresh data. Compare and warn if saved values differ from the request.
- **`delete`**: `422 VALIDATION_ERROR` (domain on hold) → return `{ error, code: 'ON_HOLD' }` so UI can explain.
- **`bulk-upsert`**: HTTP 200 ≠ success. Parse the per-domain result map, return `{ succeeded: [...], failed: [{ domain, code, message }] }`.
- Every route returns the cache-ready mapped object (`mappers.ts`) so the client does not re-implement microunit conversion.

### Definition of Done — Phase 25
- [ ] All 7 routes return `401` when credentials are missing
- [ ] `check` returns `{ valid: true|false }` (401/403 → false, network → 500)
- [ ] `list` paginates fully and returns a merged, mapped array
- [ ] `insert` handles `409` gracefully; `edit` handles `204`; `delete` handles `204` + `422`
- [ ] `bulk-upsert` splits >500 items into chunks and reports per-domain failures
- [ ] `429` is retried once honoring `Retry-After`, then surfaced as `"Rate limit exceeded. Try again shortly."`
- [ ] Rate limiter keeps one user under 150 req/min across concurrent calls
- [ ] Each route manually tested with curl using a real Afternic account

---

# Phase 26 · Domains Page — Afternic Column & Overlay `[UPDATED]`

**Goal**: List, edit and delist a single domain on Afternic from the Domains page, same UX as Sedo/Spaceship.

### New files
```
components/domains/
  AfternicCell.tsx
  AfternicCardRow.tsx
  AfternicOverlay.tsx

lib/hooks/
  useAfternicListings.ts

types/afternic.ts        ← already created in Phase 24
```

### Hook
```ts
// TanStack key: ['afternic-listings']
// Reads afternic_listings for current user -> Map<domain_id, AfternicListing>
export function useAfternicListings(): {
  listings: Map<string, AfternicListing>
  isLoading: boolean
}
```

### US-061 — Afternic Column (Desktop) `[NEW]`
Position: immediately after the `Spaceship` column. Header: `Afternic` + sync icon with tooltip `"Last synced: X min ago"`.
Data source: `useAfternicListings()` — no API call on page load.

| State | Condition | Render |
|-------|-----------|--------|
| A | no row | `Not Listed` (text-muted) |
| B | `ACTIVE` | `$buynow_price ✏️ 🔄` (accent-success, JetBrains Mono) |
| C | `PENDING` | `⏳ Pending ✏️ 🔄` (amber) |
| D | `FAILED_COMPLIANCE` | `❌ Failed compliance ✏️ 🔄` (red) |
| E | `HIDDEN` | `👁‍🗨 Hidden $price ✏️ 🔄` (muted) |
| F | `ON_HOLD` | `🔒 On hold 🔄` (amber, ✏️ disabled) |
| G | `SOLD` | `✅ Sold 🔄` (success) — links to "Log sale" prompt (see Phase 28) |
| H | `INACTIVE` | `⏸ Inactive ✏️ 🔄` (muted) |

- ✏️ opens `AfternicOverlay` (edit mode). 🔄 triggers per-domain sync.
- **Fast Transfer badge**: small secondary chip next to the price when `fast_transfer_status` is set and not `ACTIVE` (tooltip explains next step, e.g. *"Set a Buy Now price"*, *"Complete your registrar's opt-in"*).

### US-062 — Afternic Row in Mobile Cards `[NEW]`
Row below Spaceship, separated by `border-t`. Same states A–H, ✏️ opens the overlay as a full-screen bottom sheet.

### US-063 — AfternicOverlay `[NEW]`
Single component for create / edit / delete. Pre-populated from the table row — **no extra DB fetch**.

**Triggers**: ✏️ in cell (edit) · "List on Afternic" in Actions menu (create) · bottom sheet on mobile.

```
┌────────────────────────────────────────────────────────┐
│  List on Afternic — example.com               ✕        │
│  ────────────────────────────────────────────────────  │
│  Domain          example.com    (read-only)            │
│  Registrar       GoDaddy        (read-only)            │
│  Expires         2026-08-15     (read-only)            │
│  Status          ● Active  · Fast Transfer: Active     │  ← edit mode only
│  ────────────────────────────────────────────────────  │
│  Buy Now Price *                                       │
│  [ $500 ______________________ ] USD  (whole dollars)  │
│  [ BIN $500 ] [ BIN−20% $400 ] [ BIN−30% $350 ]        │  ← hidden if bin is null
│                                                        │
│  Min Offer  (min $20)                                  │
│  [ $200 ______________________ ] USD                   │
│  [ 20% ] [ 30% ] [ 40% ] [ 50% ]                       │  ← recalc live
│                                                        │
│  Lander                                                │
│  ( ● Buy it Now ) ( ○ Request Price ) ( ○ Custom )     │
│                                                        │
│  ▸ Advanced                                            │
│     Floor Price (optional)  [ $____ ]                  │
│     Display Name (optional) [ ______ ]                 │
│     [ ] Hide from marketplace                          │
│  ────────────────────────────────────────────────────  │
│  [Cancel]                    [List on Afternic →]      │  ← create
└────────────────────────────────────────────────────────┘

Edit footer:  [🗑 Remove from Afternic]  [Cancel]  [Update →]
              "Remove from Afternic? [Yes] [Cancel]"  ← inline confirm
```

#### Field spec

| Field | Source | Editable | Required |
|-------|--------|----------|----------|
| Domain / Registrar / Expiration | `domains.*` | No | — |
| Buy Now Price | `domains.bin` (create) or `afternic_listings.buynow_price` (edit) | Yes | ✅ (needed for Fast Transfer) |
| Min Offer | blank or `minbid_price` | Yes | Optional, **≥ $20** |
| Lander (`intakeStyle`) | default `BUYNOW` or existing | Yes | ✅ |
| Floor Price | `floor_price` | Yes (Advanced) | Optional |
| Display Name | `display_name` | Yes (Advanced) | Optional |
| Hidden | `hidden` | Yes (Advanced) | Optional |
| Currency | always USD | No | — |

**Validation**: whole dollars only (show inline note if the user types cents), min offer ≥ $20 and ≤ buy-now, buy-now ≤ $49,999,999.

#### On submit (create)
1. If `domains.bin` is null → `PATCH domains` to save `bin`.
2. `POST /api/afternic/insert`.
3. Upsert returned row into `afternic_listings` (`list_status` as returned, usually `PENDING`/`ACTIVE`).
4. Invalidate `['afternic-listings']` + `['domains']`.
5. Toast `"[domain] submitted to Afternic"`. If response `alreadyExisted` → toast `"[domain] was already on Afternic — synced"`.

#### On submit (edit)
1. `PATCH /api/afternic/edit` with **only changed fields**.
2. Update cache row from returned data. Toast `"Afternic listing updated"`.

#### On remove
1. Inline confirm → `DELETE /api/afternic/delete` → delete cache row → toast `"[domain] removed from Afternic"` → cell reverts to State A.
2. `ON_HOLD` → show inline error: *"This domain is on hold (active transaction). It can't be removed until the sale is resolved."*

**Loading**: CTA spinner + inputs disabled. **Errors**: API `message` (and `fields[].message` if present) inline above footer, never a toast.

### US-064 — Per-Domain Sync (🔄) `[NEW]`
1. `GET /api/afternic/status?domain=…` (includes Fast Transfer status).
2. `200` → upsert cache row. `404 RESOURCE_NOT_FOUND` → delete cache row → State A.
3. Icon spins while in flight. No toast on success; error toast on failure.

### US-065 — "Not Listed On" Filter `[UPDATED]`
Add **Afternic** next to Sedo and Spaceship:
```
Not Listed On:  [ ] Sedo   [ ] Spaceship   [ ] Afternic
```
Also add an optional **Afternic status** filter (Active / Pending / Hidden / On hold / Sold / Failed).

### Definition of Done — Phase 26
- [ ] `Afternic` column after `Spaceship` (desktop) and row in cards (mobile)
- [ ] States A–H render correctly, Fast Transfer chip shows with correct tooltips
- [ ] Overlay create / edit / delete all work end-to-end against a real account
- [ ] Prices converted to/from microunits correctly; cents warning shown
- [ ] Min offer < $20 blocked client-side and server-side
- [ ] Chips: buy-now chips only when `bin` set; min-offer chips recalc live
- [ ] `409` on create → handled as sync, not as an error
- [ ] `ON_HOLD` delete error shown inline
- [ ] Per-domain 🔄 works, 404 → State A
- [ ] "Not Listed On" filter includes Afternic and filters server-side
- [ ] Bottom sheet at 375px; zero extra DB fetch on overlay open
- [ ] No credentials → disabled states + tooltip `"Add Afternic credentials in Settings"`

---

# Phase 27 · Afternic Sync & Bulk Operations `[NEW]`

**Goal**: Keep the cache in sync with Afternic (including domains listed directly on afternic.com) and let the user list many domains at once.

### New files
```
components/domains/
  AfternicSyncButton.tsx
  BulkAfternicListDialog.tsx

lib/hooks/
  useAfternicSync.ts
```

### Hook
```ts
export function useAfternicSync(): {
  syncAll: () => Promise<void>
  syncOne: (domain: string, domainId: string) => Promise<void>
  isSyncing: boolean
  lastSyncedAt: Date | null      // MAX(last_synced_at)
  error: string | null
}
```

### US-066 — Global Sync Button `[NEW]`
Domains toolbar, right of `Sync Spaceship`:
```
<RefreshCw />  Sync Afternic
               Last synced: 4 min ago
```
**On click**
1. `GET /api/afternic/list` — full paginated portfolio.
2. **Match to local domains** by ASCII-normalised name. Afternic domains that don't exist in `domains` are collected as **"Not in DomainVault"** (see US-067) — they are never silently inserted.
3. Upsert matched rows into `afternic_listings`.
4. Delete cache rows Afternic no longer returns (delisted externally) → State A.
5. Invalidate `['afternic-listings']`.

**UI states**: spinning icon + disabled while running · toast `"Afternic listings synced"` · error toast with `message` · disabled + tooltip when credentials are missing.

**Rate-limit note**: a 2,000-domain portfolio at `limit=50` is ~40 requests — fine under 150/min, but the limiter from Phase 24 must be shared with any concurrent per-domain syncs.

### US-067 — Import Unmatched Afternic Domains `[NEW]`
After a sync, if Afternic returned domains that aren't in `domains`, show a dismissible banner: `"12 Afternic domains aren't in DomainVault — Review"`.
- Modal lists them (name, price, status, registrar as reported by Afternic).
- User selects rows → "Add to DomainVault" → inserts into `domains` with `registrar` from Afternic, `status = 'active'`, **`expiration_date` required** (Afternic doesn't return it) → ask the user to provide a default date or leave rows flagged for completion.
- Writes an `import_logs` row with source `Afternic`.

> Product decision to confirm: `domains.expiration_date` is `NOT NULL`. Either require a date at import time (recommended) or relax the constraint in a later migration.

### US-068 — Bulk "List on Afternic" `[NEW]`
Domains table bulk-select bar gets **"List on Afternic"** (works with the existing bulk select from US-009).
1. Dialog: choose price rule — `Use each domain's BIN` · `BIN −20%` · `BIN −30%` · `Fixed $X`; choose lander (default Buy it Now); min offer rule (`20%–50%` of buy-now, clamped to ≥ $20).
2. Preview table: domain, computed buy-now, computed min offer, ⚠️ for domains with no price (skipped by default).
3. Confirm → `POST /api/afternic/bulk-upsert` (chunks of 500).
4. Per-domain result table (✅/❌ + `message`), cache upsert for successes, "Retry failed" button resubmits only failures.
5. Warn that upsert **can overwrite existing Afternic settings** for domains already listed; default to excluding domains already in `afternic_listings` unless the user ticks "Overwrite existing".

### US-069 — Bulk Remove from Afternic `[NEW]`
Bulk-select → "Remove from Afternic" → confirm dialog showing count → `POST /domains/$each/delete` (via a `bulk-delete` route, same chunking) → per-domain results; `ON_HOLD` items reported and skipped.

### Definition of Done — Phase 27
- [ ] Global sync paginates fully, upserts matches, removes stale rows
- [ ] Unmatched Afternic domains are surfaced, never auto-inserted
- [ ] Import-from-Afternic flow handles missing `expiration_date`
- [ ] Bulk list: preview, 500-chunking, per-domain results, retry-failed
- [ ] Bulk list defaults to **not** overwriting existing listings
- [ ] Bulk remove skips `ON_HOLD` / `SOLD` with clear reporting
- [ ] Sync, per-domain sync and bulk ops all respect the 150 req/min limiter
- [ ] "Last synced" reads `MAX(last_synced_at)`; no credentials → disabled + tooltip

---

# Phase 28 · Bulk Edit, Lease to Own & Fast Transfer Readiness `[NEW]`

**Goal**: Change settings on many Afternic listings at once without overwriting what the user didn't touch, toggle Lease to Own for one or many domains, and fix whatever blocks Fast Transfer.

> **Verify first (Step 0).** Before coding, open the Afternic reference for **Update domain**, **Replace domain** and **Account Settings** and confirm: (a) the exact writable fields, (b) whether any field or endpoint can *request* Fast Transfer activation. In the docs reviewed, `fastTransferStatus` is read-only and derived from other conditions, so this phase treats it that way. If a write path exists, add it to US-073.

## Step 1 — Types, cache & routes

- Cache columns `max_lease_period`, `show_lander_buynow`, `show_lander_makeoffer`, `show_lander_lease` are already in the Phase 24 migration (add them via a small extra migration if Phase 24 shipped without them).
- `lib/afternic/pricing.ts` gains `buildAfternicPatch(changes)` — returns **only** the fields the user chose to change (never sends defaults).
- Sync mapper (`mappers.ts`) now maps `leasingEnabled`, `maxLeasePeriod`, `showLander*Option`.

```
app/api/afternic/
  bulk-edit/route.ts        ← NEW  (chunked PATCH loop)
  lease/route.ts            ← NEW  (optional convenience wrapper over edit/bulk-edit)
```

### `POST /api/afternic/bulk-edit`
Body: `{ domains: string[], changes: AfternicPatchChanges }` where `changes` is a partial of
`{ buynow, minbid, floor, intakeStyle, landingPage, hidden, featured, leasingEnabled, maxLeasePeriod, showLanderBuynowOption, showLanderMakeOfferOption, showLanderLeaseToOwnOption }`.

Behavior:
1. Process **at most ~50 domains per request** (client sends chunks) to stay under serverless timeouts.
2. For each domain: `PATCH /domains/{domain}` with the same partial body. On `204`, re-`GET` the domain.
3. Share the 150 req/min limiter; if the bucket is empty, wait rather than fail.
4. Return `{ succeeded: [{ domain, listing }], failed: [{ domain, code, message }] }`. Never throw for a single-domain failure.
5. `ON_HOLD` / `SOLD` domains are **skipped** and reported as `skipped`.
6. Per-domain price rules (e.g. "BIN −20%") are resolved on the **client preview** and sent as explicit per-domain values: `items: [{ domain, changes }]` is also accepted for that case.

> Why PATCH loop and not upsert: upsert is documented as able to overwrite existing listings, PATCH keeps omitted settings unchanged. For very large one-off changes (thousands), use the Jobs API / CSV route (future enhancement).

## Step 2 — UI

### US-070 — Bulk Edit Afternic Listings `[NEW]`
Domains table bulk-select bar → **"Edit on Afternic"**.

```
┌───────────────────────────────────────────────────────────┐
│  Edit 42 Afternic listings                          ✕     │
│  ───────────────────────────────────────────────────────  │
│  Choose what to change (unchecked fields stay as-is)      │
│                                                           │
│  [ ] Buy Now price   ( BIN | BIN−20% | BIN−30% | Fixed $ )│
│  [ ] Min offer       ( 20%–50% of Buy Now, ≥ $20 )        │
│  [ ] Lander          ( Buy it Now | Request Price | Custom)│
│  [ ] Visibility      ( Visible | Hidden )                 │
│  [ ] Lease to Own    ( Enable + period | Disable )        │
│  ───────────────────────────────────────────────────────  │
│  Preview (first 10 of 42)                                 │
│  domain        current → new                              │
│  example.com   $500 → $400                                │
│  ⚠ 3 skipped (on hold / sold) · 2 have no BIN             │
│  ───────────────────────────────────────────────────────  │
│  [Cancel]                          [Apply to 37 domains]  │
└───────────────────────────────────────────────────────────┘
```

Flow:
1. User ticks only the fields to change → preview shows `current → new` per domain from the **cached** `afternic_listings` (no API calls for preview).
2. Domains that can't be updated are listed with a reason (on hold, sold, no BIN for a BIN-based rule, not listed on Afternic).
3. Apply → client sends chunks of 50 to `/api/afternic/bulk-edit`; progress bar `processed / total`.
4. Result table (✅ / ❌ / ⏭ skipped + message), **Retry failed** button resubmits only failures.
5. Successful rows update the cache and invalidate `['afternic-listings']`. Toast `"37 Afternic listings updated"`.
6. Cancel mid-run stops sending further chunks; already-applied changes stay (reported in the summary).

### US-071 — Lease to Own, Single Domain `[NEW]`
Add a **Lease to Own** section to `AfternicOverlay` (Advanced group promoted to its own block):

```
Lease to Own                          [ Off ●──○ On ]
  Payments (2–60)   [ 36 ]    ≈ $13.89 / month
  [x] Show Lease to Own on lander
```

Rules enforced in the form:
- Toggle **disabled until a Buy Now price exists** (monthly payment = Buy Now ÷ payments). Tooltip: "Set a Buy Now price first".
- Payments input 2–60, default 2 if empty. Live monthly-payment estimate (informational only).
- Turning it **On** sets `leasingEnabled: true`, `maxLeasePeriod`, and — because the lander only shows it on a custom lander — shows a hint: *"To display Lease to Own on your lander, the lander must be 'Custom' with Lease to Own shown."* One-click **"Switch lander to Custom"** sets `intakeStyle: CUSTOM_LANDER` and `showLanderLeaseToOwnOption: true` (keeps existing Buy Now / Make Offer visibility). Full per-method control (Buy Now / Make Offer / Lease to Own checkboxes) is specified in Phase 29.
- Turning it **Off** sets `leasingEnabled: false` and `showLanderLeaseToOwnOption: false`.
- Only changed fields are PATCHed.

Desktop table: small `LTO` chip next to the Afternic price when `leasing_enabled = true` (tooltip: "36 payments").

### US-072 — Lease to Own, Bulk `[NEW]`
Covered by the **Lease to Own** row in US-070:
- **Enable**: payments value + checkbox "Also switch lander to Custom and show Lease to Own" (default on). Domains without a Buy Now price are skipped with reason `NO_BUYNOW`.
- **Disable**: sends `leasingEnabled: false` + `showLanderLeaseToOwnOption: false`.
- Quick actions in the bulk bar: **"Enable Lease to Own"** / **"Disable Lease to Own"** open US-070 pre-set to that row.

### US-073 — Fast Transfer Readiness `[NEW]`
Fast Transfer status is **read-only** (derived by Afternic). DomainVault helps by fixing what it *can* control and explaining the rest.

- **Status chip + tooltip** per listing (already shown in Phase 26) now includes a next step:

| `fastTransferStatus` | What DomainVault does |
|----------------------|-----------------------|
| `ACTIVE` | Green "Fast Transfer ✓" |
| `INACTIVE_BUYNOW_MISSING` | **"Fix"** button → opens overlay focused on Buy Now (single) |
| `INACTIVE_BUYNOW_HIGH` | Warning: "Buy Now above current Fast Transfer limit" → "Lower price" opens overlay |
| `AWAITING_OPT_IN` | Info: "Complete opt-in at your registrar" (link to registrar if known) — **not fixable via API** |
| `INELIGIBLE_REGISTRAR` / `INELIGIBLE_TLD` | Info only: "Not eligible with current criteria" |
| `PENDING_REVIEW` | Info: "Under review by Afternic" |

- **Bulk "Fix Fast Transfer"**: filter chip **"Fast Transfer: needs attention"** on the Domains page; bulk action **"Set missing Buy Now prices"** runs US-070 with only `INACTIVE_BUYNOW_MISSING` rows pre-selected and the price rule `BIN` / `BIN −x%` (rows with no BIN are skipped and listed).
- After applying, run a **status refresh** (`/api/afternic/status` per changed domain, respecting the rate limiter) because Fast Transfer status updates asynchronously — show "Re-checking…" and a "Re-check later" hint if still not `ACTIVE`.
- Summary banner on the Afternic column header: `"18 listings need Fast Transfer action"` → click applies the filter.

> If Step 0 finds a documented way to *request* Fast Transfer, add a **"Request Fast Transfer"** action here (single + bulk). Until then the plan does not claim it can activate it.

## Definition of Done — Phase 28
- [ ] Step 0 verification done: writable fields confirmed; Fast Transfer write path (if any) documented in this plan
- [ ] `bulk-edit` route patches only selected fields, chunked, rate-limited, per-domain results, skips `ON_HOLD`/`SOLD`
- [ ] Bulk edit dialog: field picker, `current → new` preview from cache, skip reasons, progress, retry failed, cancel
- [ ] Bulk edit never overwrites fields the user left unchecked (verified against a real listing)
- [ ] Lease to Own single: toggle, payments 2–60, monthly estimate, requires Buy Now, "Switch lander to Custom" helper
- [ ] Lease to Own bulk: enable (with period) and disable, `NO_BUYNOW` rows skipped and reported
- [ ] `LTO` chip shown in table and mobile card when enabled
- [ ] Fast Transfer chip shows next-step text for every documented status
- [ ] "Fast Transfer: needs attention" filter + bulk "Set missing Buy Now prices" work
- [ ] Post-change status refresh runs and respects 150 req/min
- [ ] Cache updated after every successful change; no regressions in Phases 26–27
- [ ] Zero TypeScript errors; works at 375px and 1440px+

---

# Phase 29 · Custom Lander Sales Methods `[NEW]`

**Goal**: On a Custom lander, let the user choose exactly which sales methods buyers see — **Buy Now**, **Make Offer**, **Lease to Own** — in any combination, for one domain or many.

> Builds on Phase 26 (overlay), Phase 28 (bulk edit + Lease to Own). Supersedes the simple "Switch lander to Custom" helper from US-071: that helper now just selects Custom and opens the checkboxes below.

## Afternic facts used

| Option | Field | API default | Requirement |
|--------|-------|-------------|-------------|
| Buy Now | `showLanderBuynowOption` | `true` | `buynowPrice > 0` |
| Make Offer | `showLanderMakeOfferOption` | `false` | `minbidPrice` set, ≥ $20 |
| Lease to Own | `showLanderLeaseToOwnOption` | `false` | `leasingEnabled = true`, `maxLeasePeriod` 2–60, `buynowPrice > 0` |

- The three flags are independent booleans, so any combination (1, 2 or all 3) is valid.
- They apply only when `landingPage = "SALES_TYPE"` **and** `intakeStyle = "CUSTOM_LANDER"`. For `BUYNOW` / `PRICE_FORM` landers do not send them.
- Same fields work on create, `PATCH` and bulk upsert. `PATCH` leaves omitted fields unchanged.
- **Unverified:** whether the API rejects a Custom lander with all three flags `false`. The UI blocks that case regardless; confirm against a real listing during Step 0.

## Step 0 — Verify against a real listing
- [ ] `PATCH` one test domain with `{ intakeStyle: "CUSTOM_LANDER", landingPage: "SALES_TYPE", showLanderBuynowOption: true, showLanderMakeOfferOption: true, showLanderLeaseToOwnOption: false }` → re-`GET` and confirm flags and prices are unchanged.
- [ ] Try all-false and note the response (error or silent accept) — update this plan with the result.
- [ ] Try enabling Lease to Own without `leasingEnabled` / Buy Now and note the response.

## Step 1 — Lib & routes `[UPDATED]`

**`lib/afternic/lander.ts` (new)**
```ts
export interface LanderOptions {
  buynow: boolean
  makeOffer: boolean
  lease: boolean
}

export function validateLanderOptions(i: {
  intakeStyle: 'BUYNOW' | 'PRICE_FORM' | 'CUSTOM_LANDER'
  buynowUsd: number | null
  minbidUsd: number | null
  leasingEnabled: boolean
  maxLeasePeriod: number | null
  show: LanderOptions
}): { ok: boolean; errors: string[] }
// Rules (only when intakeStyle === 'CUSTOM_LANDER'):
//  - at least one of show.* is true
//  - show.buynow    -> buynowUsd > 0
//  - show.makeOffer -> minbidUsd >= 20
//  - show.lease     -> leasingEnabled && buynowUsd > 0 && maxLeasePeriod in [2, 60]

export function landerBadge(l: LanderOptions): string
// 'BN · MO · LTO' (only enabled ones, in that order)
```

**`lib/afternic/pricing.ts` `[UPDATED]`**
- `buildAfternicPatch(changes)` sends only fields present in `changes`.
- If any `show*` flag changes, also send `intakeStyle: "CUSTOM_LANDER"` and `landingPage: "SALES_TYPE"`.
- If `show.lease` becomes `true`, also send `leasingEnabled: true` and `maxLeasePeriod`; if it becomes `false`, send `leasingEnabled: false` and `showLanderLeaseToOwnOption: false`.

**`lib/afternic/mappers.ts` `[UPDATED]`**
- Map `showLanderBuynowOption`, `showLanderMakeOfferOption`, `showLanderLeaseToOwnOption`, `leasingEnabled`, `maxLeasePeriod` into cache columns `show_lander_buynow`, `show_lander_makeoffer`, `show_lander_lease`, `leasing_enabled`, `max_lease_period`.

**Routes `[UPDATED]`** — `edit`, `insert`, `bulk-edit` call `validateLanderOptions` server-side and return `400 { error, fields }` for invalid combinations (defense in depth; the client validates too). `204` from `PATCH` → re-`GET` and return fresh data.

> No new migration: the cache columns were added in Phase 24/28.

## Step 2 — UI

### US-074 — Lander Methods in AfternicOverlay `[NEW]`
Under the **Lander** radio (`Buy it Now | Request Price | Custom`), selecting **Custom** reveals:

```
Lander      ( ○ Buy it Now ) ( ○ Request Price ) ( ● Custom )

  Show on lander
  [x] Buy Now          ← disabled + hint if no Buy Now price
  [x] Make Offer       ← disabled + hint if no min offer (≥ $20)
  [ ] Lease to Own     ← disabled + hint if no Buy Now price
        Payments (2–60)  [ 36 ]   ≈ $13.89 / month
```

Behavior:
- Initial values from the cached listing (`show_lander_*`); create-mode default: Buy Now on, others off.
- Disabled-state hints: Buy Now → "Set a Buy Now price first" · Make Offer → "Set a minimum offer (min $20)" · Lease to Own → "Needs a Buy Now price".
- Checking **Lease to Own** reveals **Payments** (2–60, default 2) with live monthly estimate `buynow / payments`, and sets `leasingEnabled = true`. Unchecking sets `leasingEnabled = false`.
- Unchecking a method that was relying on a price never clears that price.
- **At least one box must stay checked** while Custom is selected; otherwise submit is disabled with an inline error: "Choose at least one sales method".
- When the lander is not Custom: hide the checkboxes and do not send any `show*` flags.
- Submit sends **only changed fields** (PATCH). Create always includes `landingPage: "SALES_TYPE"`.
- Errors from Afternic (`message`, `fields[].message`) shown inline above the footer.
- Mobile: same content in the bottom sheet, checkboxes ≥ 44px tap targets.

### US-075 — Lander Methods Badge `[NEW]`
- Desktop Afternic cell and mobile card row show a compact badge next to the price when the lander is Custom: `BN`, `MO`, `LTO` (only enabled ones, e.g. `BN · MO`). Tooltip: "Buy Now, Make Offer".
- `Request Price` lander → badge `RP`; `Buy it Now` lander → no badge.
- Badge reads from cache — no API call.

### US-076 — Bulk Lander Methods `[NEW]`
Extend the **Edit on Afternic** dialog (US-070) with a **Custom lander options** row. Each option has a three-way control:

```
[ ] Custom lander options
      Buy Now        ( Leave unchanged | Enable | Disable )
      Make Offer     ( Leave unchanged | Enable | Disable )
      Lease to Own   ( Leave unchanged | Enable | Disable )   Payments [ 36 ]
      [x] Switch domains not on a Custom lander to Custom
```

Rules:
- Default for every option is **Leave unchanged**.
- Preview table shows `current → new` badge per domain (`BN` → `BN · MO`), computed from the cached `afternic_listings`.
- **Skip with a visible reason** when:
  - `ON_HOLD` or `SOLD` → `ON_HOLD` / `SOLD`
  - enabling Buy Now or Lease to Own and no `buynow_price` → `NO_BUYNOW`
  - enabling Make Offer and no valid `minbid_price` → `NO_MINBID`
  - result would leave a Custom lander with zero methods → `NO_OPTION_LEFT`
  - domain not on Custom and "Switch to Custom" unchecked → `NOT_CUSTOM`
  - not listed on Afternic → `NOT_LISTED`
- Disabling one option never changes the others.
- Apply in chunks of 50 to `POST /api/afternic/bulk-edit` (sequential `PATCH` per domain, shared 150 req/min limiter), per-domain result `{ domain, status: ok | failed | skipped, message }`, **Retry failed** resubmits only failures, cancel stops further chunks.
- Cache updated per successful domain; invalidate `['afternic-listings']`.
- Quick presets in the bulk bar: **"Buy Now + Make Offer"**, **"All three"**, **"Buy Now only"** (pre-fill the three-way controls).

### US-077 — Lander Method Filters `[UPDATED]`
Add to the Domains page Afternic filters:
- **Lander**: Buy it Now · Request Price · Custom
- **Shows**: Buy Now / Make Offer / Lease to Own (multi-select, matches domains with those methods enabled)
- Filter chip **"Custom lander with no method"** (data-quality check for listings changed outside DomainVault).

## Tests (Vitest)

`validateLanderOptions`:
- only Buy Now enabled → ok
- Buy Now + Make Offer → ok
- all three enabled with price, min offer, lease period → ok
- Lease to Own without buy-now price → invalid
- Lease to Own with `maxLeasePeriod` 1 or 61 → invalid
- Make Offer with min offer below $20 → invalid
- Custom lander with no method → invalid
- non-Custom lander with all flags false → ok (flags ignored)

`buildAfternicPatch`:
- patch contains only changed fields
- changing a `show*` flag adds `intakeStyle: CUSTOM_LANDER` + `landingPage: SALES_TYPE`
- enabling Lease to Own adds `leasingEnabled: true` + `maxLeasePeriod`
- disabling Lease to Own sends `leasingEnabled: false` + `showLanderLeaseToOwnOption: false`

`landerBadge`: `BN · MO · LTO` ordering, empty input, single option.

## Definition of Done — Phase 29
- [ ] Step 0 verification done and results written into this plan (all-false behavior, LTO prerequisites)
- [ ] Overlay: Custom reveals three checkboxes with correct disabled states and hints
- [ ] Any combination of the three methods saves and round-trips through the cache
- [ ] Lease to Own payments (2–60) + monthly estimate; toggling updates `leasingEnabled`
- [ ] At least one method required on Custom; submit blocked with inline error otherwise
- [ ] Non-Custom landers never send `show*` flags
- [ ] Only changed fields are PATCHed; unchecked-by-user fields untouched (verified on a real listing)
- [ ] Server routes reject invalid combinations with `400 { error, fields }`
- [ ] Table cell + mobile card badge (`BN · MO · LTO`, `RP`) render from cache
- [ ] Bulk dialog: three-way controls, preview, skip reasons, chunking, retry failed, cancel
- [ ] Bulk disabling one method never alters the others
- [ ] Lander/method filters work
- [ ] Unit tests passing; zero TypeScript errors
- [ ] Works at 375px and 1440px+; keyboard accessible

---

# Phase 30 · Afternic Sales, Stats & Polish `[NEW]`

**Goal**: Close the loop — detect Afternic sales, show performance data, and finish quality gates.

> Before building US-078/US-079, read the **Sales** guide and the Sales / Stats API reference pages in the Afternic docs. Their request/response shapes were not reviewed when this plan was written.

### US-078 — Sold Detection → Log Sale `[NEW]`
- When sync sees `listStatus = 'SOLD'` for a domain whose DomainVault `status` isn't `'sold'`, show a banner/badge: `"example.com sold on Afternic — Log sale"`.
- "Log sale" opens the existing **Mark as Sold** slide-over (US-021) pre-filled: platform = **Afternic**, price from the Afternic sale record (if the Sales API is used) or empty for the user to fill, date = today.
- Never auto-change `domains.status` — user confirms.
- `ON_HOLD` listings show a `🔒 Transaction in progress` hint.

### US-079 — Afternic Performance Stats `[NEW]`
- Use `GET /stats?startDate=…&days=30` (portfolio) and `GET /stats/{domain}` (per domain); `days` 1–366.
- Store latest `intake_views` / `intake_leads` on `afternic_listings` during sync (columns from Phase 24).
- Domain slide-over / detail page: small "Afternic · last 30 days" card — views, leads.
- Optional sortable columns **Views** / **Leads** in the Domains table behind a column-visibility toggle.

### US-080 — Dashboard Widget `[NEW]`
- "Marketplace coverage" widget: count of domains listed on Sedo / Spaceship / Afternic / none, with click-through to `/domains?notListedOn=afternic` etc.
- Add `Afternic` to the **Platform Performance** chart (US-026) — already works via `sales.platform = 'Afternic'`, just verify the label matches the Mark-as-Sold dropdown value.

### US-081 — Error Handling Matrix `[NEW]`

| Scenario | Where | Behavior |
|----------|-------|----------|
| No credentials | Domains page | Sync button disabled + tooltip → Settings |
| No credentials | AfternicOverlay | Inline: "Add Afternic credentials in Settings first" |
| `401` / `AUTH_CODE_*` | Any route | `{ error: 'Invalid Afternic credentials' }` → toast / inline badge in Settings |
| `401 CUSTOMER_LINK_NOT_FOUND` / `CUSTOMER_NOT_FOUND` | Any route | Message: "Your account isn't linked to an Afternic user — contact Afternic support" |
| `403 CUSTOMER_ACCESS_DENIED` | Any route | Inline/toast with API message |
| `400` with `fields[]` | Overlay | Show each `fields[].message` under the matching input |
| `404 RESOURCE_NOT_FOUND` | `syncOne` / edit / delete | Delete cache row → State A |
| `409 CONFLICT` | Create | Treat as already listed → sync instead of failing |
| `422 VALIDATION_ERROR` (on hold) | Delete | Inline: domain on hold, can't remove |
| `422 MALFORMED_INPUT` / `DEPENDENCY_ISSUE` | Write routes | Show relayed `message` inline |
| `429 RATE_LIMIT_EXCEEDED` | Any route | Retry once with `Retry-After`, then toast "Rate limit exceeded. Try again shortly." |
| `5xx` / `503` / `504` | Any route | Exponential backoff ×2, then toast "Could not reach Afternic. Try again." |
| `bin` is NULL | Overlay | Buy-now empty; user must fill before submit |
| Custom lander with no sales method | Overlay / bulk | Block submit: "Choose at least one sales method" / skip with `NO_OPTION_LEFT` |
| Method enabled without required price / lease settings | Overlay / bulk | Checkbox disabled with hint / skip with `NO_BUYNOW` or `NO_MINBID` |
| Price has cents | Overlay | Inline note: "Afternic accepts whole dollars — will be rounded" |
| Supabase write failure | Any mutation | Toast, no UI change |

### Polish & Ship
- `format` / `lint` / `typecheck` clean on all new files
- Unit tests: `toMicro`/`fromMicro`, `toAsciiDomain`, `buildAfternicPayload`, mapper (API → cache row), rate limiter
- README/docs: how to create an Afternic API key, required `User-Agent`, rate limit
- Changelog entry
- Confirm Sedo and Spaceship flows are unaffected (shared `user_settings` + shared column/filter code)
- QA at 375px and 1440px+

### Definition of Done — Phase 30
- [ ] Sold detection shows "Log sale" prompt and pre-fills Mark as Sold with platform = Afternic
- [ ] Stats card shows 30-day views/leads for a listed domain
- [ ] Marketplace coverage widget links to filtered Domains views
- [ ] Every row in the error matrix is handled and manually verified
- [ ] Unit tests passing; lint / typecheck / format clean
- [ ] No regressions in Sedo / Spaceship columns, overlays or sync

---

## Suggested build order (summary)

| Phase | Name | Depends on | Ships |
|-------|------|------------|-------|
| 24 | Foundation | Phase 5/6 `user_settings` | Credentials, cache table, client lib |
| 25 | API Routes | 24 | 7 server routes |
| 26 | Column & Overlay | 25 | List / edit / delist one domain |
| 27 | Sync & Bulk | 26 | Global sync, import unmatched, bulk list/remove |
| 28 | Bulk Edit, Lease to Own & Fast Transfer Readiness | 27 | Bulk PATCH, LTO toggle (1 & bulk), Fast Transfer fixer |
| 29 | Custom Lander Sales Methods | 28 | Buy Now / Make Offer / Lease to Own checkboxes (1 & bulk) |
| 30 | Sales, Stats & Polish | 29 | Sold detection, stats, widget, QA |

> Phases 24–26 give you feature parity with Sedo/Spaceship. Phases 27–30 are Afternic-specific extras enabled by its bulk, lease-to-own and stats endpoints.