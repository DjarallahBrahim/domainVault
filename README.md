# DomainVault

A domain portfolio management app for domain investors. Track your domains, monitor expiration dates, promote domains, log sales, and analyze earnings — all in one place.

Built with Next.js 14+ (App Router), TypeScript, Supabase, Tailwind CSS + shadcn/ui, TanStack Query v5, React Hook Form + Zod, and Recharts.

---

## Features

### Authentication & Account
- Email + password registration (8+ chars, 1+ number required)
- Login with generic error messages (no user enumeration)
- Email verification — unverified users are blocked from all protected pages
- Password reset flow via email
- Persistent sessions (Supabase defaults, no custom expiry)

### App Shell & Navigation
- Sidebar navigation on desktop (≥768px) with active route highlighting
- Bottom tab bar on mobile (≤768px)
- User avatar + email in sidebar footer
- Logout from sidebar (desktop) or Settings (mobile)
- Root `/` redirects to dashboard (authenticated) or login (unauthenticated)

### Theme Switching
- Dark and light themes
- Defaults to OS preference on first visit
- Choice persisted across sessions
- Instant toggle — no flash or page reload
- WCAG 2.1 AA contrast ratios

### CSV Import
- Drag-and-drop CSV file upload (PapaParse)
- Duplicate handling toggle: "Skip existing" or "Update existing"
- Case-insensitive domain matching for import and duplicate detection
- Post-import summary: imported, skipped, error counts
- Import history with expandable error details
- CSV column reference banner with copy header + sample download
- "Add Manually" tab for quick single-domain entry without CSV

### Domain Management
- Paginated, sortable, filterable domain list with Registrar column
- Sort by name, expiration date, status
- Multi-domain comma-separated search (e.g. "domain1.com, domain2.io")
- Filter by status, TLD, registrar, or expiry window (1m/3m/6m/9m)
- Enter-key search trigger (no keystroke requests)
- Pagination: 25/50/100 per page
- Export filtered domain list to CSV
- Manual domain entry via centered modal dialog (RHF + Zod)
- Domain detail page with inline edit form + status dropdown
- Status change to "sold" reveals sale fields (price, date, buyer, platform)
- Status badges: active, expired, sold, pending
- Expiry countdown badge with color mapping
- Tag chip input (Enter/comma to create, X to remove)
- Registrar autocomplete from existing values
- Single and bulk delete (max 50) with confirmation dialog
- Responsive: card layout <480px, scrollable 480–767px, full table ≥768px
- Filter state synced to URL query params (shareable deep-linkable views)

### Dashboard & Analytics
- **KPI Cards**: Total domains, Portfolio Value, Expiring in 90 Days, Sold This Year — animated counters, hover lift, colored accent stripes, trend indicators, clickable navigation
- **Expiry Donut Chart**: 4 non-overlapping segments (≤1m/≤3m/≤6m/≤9m) — hover tooltips with domain names, click to filter domains
- **Registrar Breakdown**: Horizontal bar chart top 10 — click to filter by registrar
- **Critical Renewals Panel**: Up to 10 domains expiring within 30 days — inline date picker for renewal, "View All" link
- **Domains to Promote**: Filter tabs select random domain batches by expiry window — promote domains with one click, track promotion history (count + last promoted date)
- **Quick Stats**: Average price, Most common Registrar, Oldest/newest domain, Total expired, Total earnings
- **Revenue Over Time**: Bar chart with cumulative line — 12M/24M/All time toggle, per-month tooltips (revenue, count, cumulative)
- **Top Sales Leaderboard**: Top 5/10 by sale price — Best ROI re-sort toggle, expandable ROI detail (profit, hold duration, platform)
- **Platform Performance**: Horizontal bar chart by platform — revenue, sales count, average price
- Auto-transition: active → expired when date passes (on dashboard load)
- Responsive: 2-col ≥1024px, single column 768–1023px, stacked <768px

### Sales Tracking & Earnings
- Log a sale with domain name, price, date, buyer, platform, and notes
- Auto-associate sale with a domain (case-insensitive match) → status set to "sold"
- Warning when logging a sale on an expired domain
- Edit and delete sales with confirmation
- Auto-revert: deleting the last sale reverts domain status to "active"
- Paginated sales list with sort and date range filter
- Earnings summary: total sales count, total revenue, average price, highest sale
- "Log Sale" quick-action button on domain detail page

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd domainvault

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database

Run the migrations against your Supabase project:

```bash
# Using Supabase CLI (recommended)
supabase link --project-ref <your-project-ref>
supabase db push

# Or manually via the SQL editor
# Run files in order: supabase/migrations/
```

Migrations create tables — `domains`, `sales`, `import_logs`, `promotion_events` — with all indexes, constraints, and Row Level Security policies.

### Development

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
npm run format     # Format code with Prettier
```

### First Run

1. Open http://localhost:3000
2. Register a new account (verify your email)
3. Import your domain portfolio via CSV on the **Import** page (or add manually)
4. Browse, filter, and manage domains on the **Domains** page
5. View analytics and promote domains on the **Dashboard**
6. Log sales and track earnings on the **Sales** page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Auth & Database | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS + shadcn/ui |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts v2 |
| CSV Parsing | PapaParse v5 |
| Theme | next-themes |
| State | Zustand v4 |

---

## Project Structure

```text
app/
├── (auth)/                  # Login, register, reset password
├── (dashboard)/
│   ├── dashboard/           # Analytics homepage
│   ├── domains/             # Domain list + detail/edit
│   ├── import/              # CSV upload + manual entry + history
│   ├── sales/               # Sales tracking + earnings
│   └── settings/            # Account settings
components/
├── ui/                      # shadcn/ui primitives + reusable (tag-input, promotion-row)
├── auth/                    # Auth forms
├── layout/                  # Sidebar, tab bar, theme toggle
├── domains/                 # Domain table, cards, forms, dialogs, tag-input
├── import/                  # CSV uploader, progress, summary, manual-entry-tab
├── dashboard/               # KPI cards, charts, donut, promotion section, leaderboard, revenue chart
├── sales/                   # Sale form, list, summary, dialogs
lib/
├── supabase/                # Browser + server clients
│   └── queries/             # Typed CRUD helpers (domains, sales, imports, dashboard)
├── validations/             # Zod schemas
├── promotions.ts            # Promotion logic (candidates, stats, recording)
├── hooks/                   # Custom React hooks
└── query-keys.ts            # Centralized TanStack Query keys
supabase/
├── migrations/              # SQL migration files (001–003)
└── seed-sales.sql           # Fake test data for dashboard development
```

## Database Tables

| Table | Purpose |
|---|---|
| `domains` | Domain portfolio (name, TLD, expiry, price, status, registrar, tags) |
| `sales` | Logged sales (domain, price, date, buyer, platform, notes) |
| `import_logs` | CSV import history (filename, counts, errors) |
| `promotion_events` | Promotion tracking (domain, timestamp) |

All tables have Row Level Security enforcing `user_id = auth.uid()`.

## License

Private — all rights reserved.
