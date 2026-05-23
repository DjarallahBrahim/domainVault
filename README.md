# DomainVault

A domain portfolio management app for domain investors. Track your domains, monitor expiration dates, log sales, and analyze earnings — all in one place.

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
- Non-CSV files rejected immediately

### Domain Management
- Paginated, sortable, filterable domain list
- Sort by name, expiration date, status
- Filter by status, TLD, or search by name (case-insensitive)
- Domain detail page with inline edit form (React Hook Form + Zod)
- Status badges: active, expired, sold, pending
- Expiry countdown badge with color mapping
- Single and bulk delete (max 50) with confirmation dialog
- Responsive: card layout <480px, scrollable 480–767px, full table ≥768px
- Optimistic updates on all mutations

### Dashboard & Analytics
- Summary cards: total domains, active, expiring (≤90 days), portfolio value
- 12-month expiration timeline bar chart
- TLD distribution bar chart
- Portfolio value by TLD bar chart (sorted descending)
- Expiring-soon domains table (≤90 days)
- Expired domains table
- Auto-transition: active → expired when date passes (on dashboard load)
- Responsive: 2-col ≥1024px, 1-col 768–1023px, stacked <768px

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

Run the migration against your Supabase project:

```bash
# Using Supabase CLI (recommended)
supabase link --project-ref <your-project-ref>
supabase db push

# Or manually via the SQL editor
# Copy the contents of supabase/migrations/001_initial_schema.sql
```

The migration creates three tables — `domains`, `sales`, `import_logs` — with all indexes, constraints, and Row Level Security policies. It is idempotent (safe to run multiple times).

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
3. Import your domain portfolio via CSV on the **Import** page
4. Browse, filter, and manage domains on the **Domains** page
5. View analytics on the **Dashboard**
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
│   ├── import/              # CSV upload + import history
│   ├── sales/               # Sales tracking + earnings
│   └── settings/            # Account settings
components/
├── ui/                      # shadcn/ui primitives
├── auth/                    # Auth forms
├── layout/                  # Sidebar, tab bar, theme toggle
├── domains/                 # Domain table, cards, forms, dialogs
├── import/                  # CSV uploader, progress, summary
├── dashboard/               # Summary cards, charts, tables
└── sales/                   # Sale form, list, summary, dialogs
lib/
├── supabase/                # Browser + server clients
│   └── queries/             # Typed CRUD helpers (domains, sales, imports)
├── validations/             # Zod schemas
├── hooks/                   # Custom React hooks
└── query-keys.ts            # Centralized TanStack Query keys
supabase/
└── migrations/              # SQL migration files
```

## License

Private — all rights reserved.
