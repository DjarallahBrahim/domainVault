# DomainVault — Master Plan
> Use this file with the `/constitution` command in SpecKit.
> It defines the full project: principles, tech stack, database schema, all phases, and every feature spec.

---

## 1. Project Identity

**DomainVault** is a professional domain portfolio management platform for domain investors and businesses. It lets users import their domain portfolio via CSV, track expiry deadlines, log sales, and visualize portfolio performance through a modern dashboard.

---

## 2. Core Principles

- **Data integrity first** — Validate all inputs before persisting. CSV imports must handle malformed rows gracefully (log errors, skip bad rows, never corrupt data). Every mutation is auditable.
- **UX excellence** — Modern, clean, professional UI. Dark mode and light mode are both first-class. No compromises on either.
- **Mobile-first responsiveness** — Every screen works from 375px to 1920px.
- **Performance** — Dashboard loads in under 2 seconds. CSV imports up to 10,000 rows must not freeze the UI. All Supabase queries use indexes on `expiration_date` and `status`.
- **Security** — RLS policies ensure users access only their own data. No credentials hardcoded. CSV file content is never stored — only the parsed domain records.
- **Accessibility** — WCAG 2.1 AA minimum. All interactive elements are keyboard navigable. Color contrast passes on both themes.
- **Phased delivery** — Features are delivered in 4 independent, shippable phases. Each phase must be fully functional before the next begins.

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

### Colors (CSS variables)
```css
/* Dark mode (default) */
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
```

Light mode mirrors the same variables with inverted luminance. Both modes pass WCAG 2.1 AA contrast ratios.

### Typography
- **Display / headings**: Syne
- **Body / labels**: DM Sans
- **Domain names / codes**: JetBrains Mono

### Breakpoints
`sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`

---

## 5. Database Schema

All tables have RLS enabled. All policies enforce `user_id = auth.uid()`.

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
| `/import` | CSV import flow + history | Protected |
| `/sales` | Sales log + earnings analytics | Protected |
| `/settings` | Account + preferences | Protected |

---

## 7. Folder Structure

```
/app
  /(auth)/login          /register          /reset-password
  /(dashboard)/          /domains/          /import/          /sales/          /settings/
/components
  /ui/                   ← shadcn/ui base components
  /dashboard/            ← KPI cards, charts, alert panel
  /domains/              ← DomainTable, DomainSlideOver, ExpiryBadge
  /import/               ← CsvDropzone, ImportPreviewTable, ImportProgressModal
  /sales/                ← SalesTable, SalesKPICards, RevenueChart
/lib
  /supabase/             ← client, server, types
  /utils/                ← csv-parser, date-helpers, currency
  /hooks/                ← useDomains, useSales, useDashboardStats
/types                   ← generated from Supabase schema
/supabase/migrations/    ← 001_initial_schema.sql
```

---

## 8. Feature Phases

### ─── PHASE 1 · Foundation ────────────────────────────────────────────────

**Goal**: Working auth flow, Supabase schema, app shell, navigation, theme switching.

#### User Stories

**US-001 — Registration**
User fills email + password (min 8 chars, 1 number). On success → redirect to dashboard. Duplicate email shows inline error. Email verification sent via Supabase.

**US-002 — Login**
Email + password form. On success → `/dashboard`. Wrong credentials → "Invalid email or password". "Forgot password" triggers Supabase reset email. Protected routes redirect unauthenticated users to `/login`.

**US-003 — App Shell & Navigation**
Sidebar (desktop): Dashboard, Domains, Import, Sales, Settings. Bottom tab bar (mobile ≤768px). Active route highlighted. User avatar + email in sidebar footer. Logout accessible from sidebar (desktop) and settings (mobile).

**US-004 — Theme Switching**
Toggle in sidebar/header. Persisted in localStorage. Defaults to OS preference. Instant — no flash or reload.

**US-005 — Database Init**
Migration file creates all 3 tables with indexes and RLS policies as defined in Section 5.

#### Definition of Done — Phase 1
- [ ] Register → verify email → login → logout works end-to-end
- [ ] Password reset flow works
- [ ] All 3 Supabase tables created with RLS
- [ ] App shell renders on desktop and mobile
- [ ] Dark/light mode persists
- [ ] Deploys to Vercel with zero TS errors

---

### ─── PHASE 2 · CSV Import & Domain Management ───────────────────────────

**Goal**: Upload CSV → validate → preview → import to Supabase. Full domain list CRUD.

#### CSV Format

```
Domain,Expiration Date,Price
google.com,2025-12-31,5000
example.org,2024-06-15,150.50
```

- Required columns: `Domain`, `Expiration Date`, `Price` (case-insensitive; extra columns ignored)
- Accepted date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, `MMM DD YYYY`, `YYYY/MM/DD`
- Price: strip `$`, `€`, `£` before parsing. Empty price → NULL. Negative → error.
- File limit: `.csv` only, max 10 MB.

#### User Stories

**US-006 — CSV Upload**
Drag-and-drop zone + "Browse files" button. Wrong file type or size → inline error. After selection, parsing begins immediately with a progress indicator.

**US-007 — Preview & Validation**
Preview table: Domain, Expiration Date, Price, Status (Valid / Error / Duplicate). Error types: invalid domain format, unparseable date, negative price, duplicate domain. Summary bar: X valid, Y errors, Z duplicates. User can deselect rows. "Import X domains" CTA disabled if 0 valid rows. Error rows downloadable as CSV.

**US-008 — Confirm Import**
Confirmation modal → progress bar during import → success toast → redirect to Domains. Import log saved. Partial success handled. Duplicates skipped unless "Update existing records" checkbox is checked.

**US-009 — Domain List**
Table columns: Domain, TLD, Expiration Date, Days Until Expiry, Price, Status, Actions.
Expiry badge colors: 🔴 ≤30d · 🟠 31–90d · 🟡 91–180d · 🟢 >180d · ⚫ Expired.
Sortable columns. Real-time client-side search. Filter by status / TLD / expiry window. Pagination (25/50/100). Export to CSV. Bulk select + delete. Empty state with import CTA.

**US-010 — Add / Edit Domain (Manual)**
"Add Domain" → slide-over panel. Fields: Domain*, Expiration Date*, Purchase Price, Status, Registrar, Tags (chip input), Notes. Domain validated on blur. Edit mode pre-populates fields. Optimistic UI update on save.

**US-011 — Delete Domain**
Confirmation dialog per row. Bulk delete available. Deleted domains are not removed from sales history.

**US-012 — Import History**
Section on Import page: Date, Filename, Imported, Skipped, Errors. "View Details" modal shows full error report. Last 20 imports shown; "Load more" for older.

#### Definition of Done — Phase 2
- [ ] CSV upload (drag/drop + picker) works
- [ ] Parser handles all 5 date formats and currency symbols
- [ ] Preview shows valid/error/duplicate states
- [ ] Import completes, progress shown, log saved
- [ ] Domain list: sort, filter, search, paginate all work
- [ ] Add/edit/delete with optimistic updates
- [ ] Mobile: horizontal scroll on table, card layout on <480px
- [ ] Skeleton loaders on all async fetches

---

### ─── PHASE 3 · Dashboard & Analytics ───────────────────────────────────

**Goal**: KPI cards, expiry charts (3M/6M), TLD breakdown, portfolio value trend, alert panel.

#### User Stories

**US-013 — KPI Cards**
4 cards: Total Domains · Portfolio Value · Expiring in 90 Days · Sold This Year.
Trend indicator vs last month. Cards are clickable (navigate to filtered view). Counter animation on load. Skeleton while loading.

**US-014 — Expiry Timeline (3-Month)**
Bar chart: domains expiring per week over 12 weeks. Bars color-coded (Red ≤14d, Amber 15–30d, Yellow 31–90d). Tooltip: list of domain names per bar. "View All Expiring" link. Mobile: buckets by month.

**US-015 — Expiry Timeline (6-Month)**
Toggle on same chart: "3 months" / "6 months". 6M view: 6 monthly bars with domain count + estimated renewal cost. Tooltip lists domains. Total estimated cost shown below chart.

**US-016 — Critical Renewals Alert Panel**
Lists up to 10 domains expiring within 30 days, sorted ascending. Badge per row shows days remaining. "Mark as Renewed" → inline date picker to update expiration. "All clear" state when nothing urgent. "View All" → filtered domains list.

**US-017 — TLD Distribution Chart**
Donut chart: top 8 TLDs by count + "Others". Legend: TLD, count, %. Clicking a segment filters the domains list. Expandable ranked list below.

**US-018 — Portfolio Value Over Time**
Area chart: cumulative portfolio value per month. Toggle: last 12 months / all time. Tooltip: date, count, total value. Empty state if < 2 data points.

**US-019 — Quick Stats Widget**
Compact widget: Average price · Most common TLD · Oldest domain · Newest domain · Total expired. Sidebar column on ≥1024px, horizontal scroll chips on mobile.

**US-020 — Dashboard Layout**
Desktop ≥1024px: 2-column grid (charts left, alerts + stats right).
Tablet 768–1023px: single column.
Mobile <768px: stacked cards, simplified chart variants. KPIs: 4-across → 2×2 → 1-column.

#### Dashboard Supabase Queries

```sql
-- Stats summary (single query)
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS total_active,
  SUM(purchase_price) FILTER (WHERE status = 'active') AS portfolio_value,
  COUNT(*) FILTER (WHERE status = 'active'
    AND expiration_date <= NOW() + INTERVAL '90 days') AS expiring_90d,
  COUNT(*) FILTER (WHERE status = 'active'
    AND expiration_date <= NOW() + INTERVAL '30 days') AS expiring_30d
FROM domains WHERE user_id = auth.uid();

-- Expiry timeline
SELECT DATE_TRUNC('week', expiration_date) AS week,
       COUNT(*) AS count, ARRAY_AGG(domain) AS domains
FROM domains
WHERE user_id = auth.uid() AND status = 'active'
  AND expiration_date BETWEEN NOW() AND NOW() + INTERVAL '3 months'
GROUP BY week ORDER BY week;
```

#### Definition of Done — Phase 3
- [ ] All 4 KPI cards render with real data + skeletons
- [ ] Expiry chart works for 3M and 6M toggle
- [ ] Critical renewals panel shows correct domains, urgency-sorted
- [ ] TLD chart renders; clicking filters domain list
- [ ] Portfolio value chart renders or shows empty state
- [ ] Quick stats widget renders all 5 stats
- [ ] Fully responsive across all 3 breakpoints
- [ ] Max 3 Supabase calls to render full dashboard (no N+1)

---

### ─── PHASE 4 · Sales Tracking & Earnings ────────────────────────────────

**Goal**: Log domain sales, calculate ROI, visualize revenue over time, platform breakdown.

#### User Stories

**US-021 — Log a Sale**
"Mark as Sold" in domain row Actions → slide-over: Sale Price*, Sale Date* (defaults today), Buyer, Platform (dropdown: Sedo / Afternic / Dan.com / Flippa / GoDaddy Auctions / Direct / Other), Notes. On save: domain status → `'sold'`, row inserted in `sales`. Sales can also be added manually from the Sales page.

**US-022 — Sales List**
Table: Domain, Sale Price, Purchase Price, Profit, ROI %, Sale Date, Platform, Buyer, Actions.
ROI = `((sale_price - purchase_price) / purchase_price) * 100` — green positive, red negative.
Profit = `sale_price - purchase_price`. If purchase_price NULL → show "—".
Sortable, searchable, filterable (platform, date range, min price). Export CSV. Edit + delete per row (delete does NOT delete the domain; sets status back to `'active'`).

**US-023 — Sales KPI Cards**
4 cards: Total Revenue · Total Profit · Average Sale Price · Domains Sold.
Toggle: "This year" / "All time". Animate on mount.

**US-024 — Revenue Over Time Chart**
Bar chart: revenue per month. Toggle: 12M / 24M / All time. Overlaid cumulative line (secondary Y-axis). Tooltip: month, revenue, # of sales, cumulative. Zero-height bar (not gap) for months with no sales.

**US-025 — Top Sales Leaderboard**
Top 5 sales by sale price. Columns: rank, domain, sale price, ROI %, date. Expandable to top 10. "Best ROI" toggle re-sorts by ROI %.

**US-026 — Platform Performance**
Horizontal bar chart or table: platform, # of sales, total revenue, average sale price. Sorted by total revenue desc.

**US-027 — ROI Analysis per Domain**
Detail view (expandable row / modal): domain, purchase price, sale price, gross profit, ROI %, hold duration ("Held for X days / Y months"), platform.

#### Dashboard Integration (update Phase 3)
- "Sold This Year" KPI card links to Sales page filtered by current year.
- Mini "Recent Sales" widget added to dashboard right column (last 3 sales).
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

## 9. Non-Goals (v1)

- No multi-user / team features
- No registrar API integrations (manual CSV only)
- No email / SMS renewal alerts
- No mobile native app

---

## 10. Future Backlog (Phase 5+)

- Email renewal alerts via Supabase Edge Functions + Resend
- Domain watchlist with WHOIS polling
- Registrar API integration (Namecheap, GoDaddy)
- Portfolio valuation via external APIs
- Team / multi-user with role-based access
- React Native mobile companion app
- Auction tracker with bid history

## Phase 5 · GCP Deployment with Terraform

**Goal**: Deploy DomainVault to Google Cloud Platform using Terraform as Infrastructure as Code. Containerize the Next.js app and run it on Cloud Run, wired to your existing Supabase backend, with secrets managed securely and CI/CD automated.

> This phase is intentionally structured as a learning progression — each sub-phase introduces one GCP concept at a time.

---

### Architecture Overview

```
GitHub
  └─ Cloud Build (CI/CD)
        └─ Artifact Registry (Docker image)
              └─ Cloud Run (Next.js app)
                    ├─ Secret Manager (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
                    └─ Supabase (unchanged — external managed DB)

Optionally:
  Cloud Load Balancer + Cloud CDN → Cloud Run
  Cloud DNS → custom domain
```

---

### Terraform Project Structure

Add this at the root of the repo:

```
/infra
  /terraform
    /modules
      /cloud_run/           ← Cloud Run service definition
      /artifact_registry/   ← Docker image registry
      /secret_manager/      ← Env var secrets
      /cloud_build/         ← CI/CD pipeline
      /load_balancer/       ← Optional: LB + CDN
    main.tf                 ← Root module wiring
    variables.tf
    outputs.tf
    terraform.tfvars        ← gitignored
    backend.tf              ← GCS remote state
  Dockerfile                ← Next.js container
  .dockerignore
```

---

### ─── PHASE 5.1 · GCP Project Bootstrap ─────────────────────────────────

**GCP concepts**: Projects, IAM, APIs, Service Accounts, Terraform remote state on GCS.

#### Steps

**GS-001 — GCP Project & APIs**
- Create a GCP project (via console or `gcloud`).
- Enable APIs: `run.googleapis.com`, `artifactregistry.googleapis.com`, `secretmanager.googleapis.com`, `cloudbuild.googleapis.com`, `iam.googleapis.com`.
- Create a Terraform service account with roles: `roles/run.admin`, `roles/artifactregistry.admin`, `roles/secretmanager.admin`, `roles/cloudbuild.builds.editor`, `roles/storage.admin`.
- Download service account key → never commit it.

**GS-002 — Terraform Remote State**

Create a GCS bucket manually (bootstrap step) to hold Terraform state:

```hcl
# backend.tf
terraform {
  backend "gcs" {
    bucket = "domainvault-tfstate"
    prefix = "terraform/state"
  }
}
```

**GS-003 — Provider & Variables**

```hcl
# variables.tf
variable "project_id"  { type = string }
variable "region"      { type = string  default = "europe-west1" }
variable "app_name"    { type = string  default = "domainvault" }
```

#### Definition of Done — Phase 5.1

- [ ] `terraform init` succeeds with remote GCS backend
- [ ] Service account authenticates Terraform without personal credentials
- [ ] All required GCP APIs enabled via Terraform `google_project_service`
- [ ] State file visible in GCS bucket

---

### ─── PHASE 5.2 · Dockerize the Next.js App ─────────────────────────────

**GCP concepts**: Artifact Registry, Docker, container best practices.

**GS-004 — Dockerfile**

Use Next.js standalone output for minimal image size:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.js`:

```js
output: 'standalone'
```

**GS-005 — Artifact Registry (Terraform)**

```hcl
# modules/artifact_registry/main.tf
resource "google_artifact_registry_repository" "app" {
  repository_id = var.app_name
  format        = "DOCKER"
  location      = var.region
}
```

**GS-006 — Manual first push** (validate image before automating):

```bash
docker build -t europe-west1-docker.pkg.dev/PROJECT/domainvault/app:latest .
docker push europe-west1-docker.pkg.dev/PROJECT/domainvault/app:latest
```

#### Definition of Done — Phase 5.2

- [ ] `docker build` succeeds locally
- [ ] Image pushed to Artifact Registry
- [ ] Image runs locally with `docker run -p 3000:3000`
- [ ] Artifact Registry repo created by Terraform

---

### ─── PHASE 5.3 · Secrets & Cloud Run Deployment ────────────────────────

**GCP concepts**: Secret Manager, Cloud Run, environment variables, IAM bindings.

**GS-007 — Secret Manager (Terraform)**

Store Supabase credentials as secrets, never in code:

```hcl
# modules/secret_manager/main.tf
resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "NEXT_PUBLIC_SUPABASE_URL"
  replication { auto {} }
}

resource "google_secret_manager_secret_version" "supabase_url_val" {
  secret      = google_secret_manager_secret.supabase_url.id
  secret_data = var.supabase_url   # populated from terraform.tfvars (gitignored)
}
# Repeat for: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

**GS-008 — Cloud Run Service (Terraform)**

```hcl
# modules/cloud_run/main.tf
resource "google_cloud_run_v2_service" "app" {
  name     = var.app_name
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.app_name}/app:latest"

      env {
        name = "NEXT_PUBLIC_SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_url.secret_id
            version = "latest"
          }
        }
      }
      # Repeat for other secrets

      resources {
        limits = { cpu = "1", memory = "512Mi" }
      }
    }
    scaling { min_instance_count = 0  max_instance_count = 3 }
  }
}

# Make it publicly accessible
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_v2_service.app.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

#### Definition of Done — Phase 5.3

- [ ] All secrets in Secret Manager (no secrets in env files or code)
- [ ] Cloud Run service deployed via Terraform
- [ ] App accessible via the Cloud Run generated URL
- [ ] Supabase auth + DB queries work from Cloud Run
- [ ] `terraform destroy` + `terraform apply` is fully reproducible

---

### ─── PHASE 5.4 · CI/CD with Cloud Build ────────────────────────────────

**GCP concepts**: Cloud Build, triggers, build steps, GitHub integration.

**GS-009 — cloudbuild.yaml**

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '$_IMAGE_TAG', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '$_IMAGE_TAG']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - services
      - update
      - domainvault
      - --image=$_IMAGE_TAG
      - --region=$_REGION

substitutions:
  _IMAGE_TAG: 'europe-west1-docker.pkg.dev/$PROJECT_ID/domainvault/app:$SHORT_SHA'
  _REGION: 'europe-west1'
```

**GS-010 — Cloud Build Trigger (Terraform)**

```hcl
# modules/cloud_build/main.tf
resource "google_cloudbuild_trigger" "main" {
  name     = "${var.app_name}-deploy"
  filename = "cloudbuild.yaml"

  github {
    owner = "DjarallahBrahim"
    name  = "domainVault"
    push  { branch = "^main$" }
  }
}
```

#### Definition of Done — Phase 5.4

- [ ] Push to `main` triggers a Cloud Build run
- [ ] Build → push → deploy all automated
- [ ] Failed builds do NOT deploy (Cloud Run keeps last good revision)
- [ ] Build history visible in GCP Console

---

### ─── PHASE 5.5 · Custom Domain & HTTPS (Optional) ──────────────────────

**GCP concepts**: Cloud Load Balancer, Serverless NEG, Cloud CDN, Cloud DNS, managed SSL.

**GS-011 — Load Balancer + Cloud Run**

Cloud Run has HTTPS by default on its `*.run.app` URL. For a custom domain + CDN:

```hcl
# Serverless NEG pointing at Cloud Run
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "${var.app_name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run { service = google_cloud_run_v2_service.app.name }
}

# Backend service + CDN
resource "google_compute_backend_service" "app" {
  name       = "${var.app_name}-backend"
  protocol   = "HTTPS"
  enable_cdn = true

  backend { group = google_compute_region_network_endpoint_group.cloudrun_neg.id }
}

# Global forwarding rule → HTTPS proxy → URL map → backend
# + google_compute_managed_ssl_certificate for your domain
```

**GS-012 — Cloud DNS (if you own a domain)**

```hcl
resource "google_dns_managed_zone" "main" {
  name     = "${var.app_name}-zone"
  dns_name = "yourdomain.com."
}

resource "google_dns_record_set" "app" {
  name         = "app.yourdomain.com."
  type         = "A"
  managed_zone = google_dns_managed_zone.main.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}
```

#### Definition of Done — Phase 5.5

- [ ] App reachable at custom domain over HTTPS
- [ ] Managed SSL certificate provisioned automatically
- [ ] Cloud CDN caching static assets (`.next/static/*`)
- [ ] LB IP and DNS record managed by Terraform

---

### Phase 5 — Full Definition of Done

- [ ] All GCP infrastructure defined in Terraform (zero manual clicks after bootstrap)
- [ ] `terraform plan` shows no drift after a fresh deploy
- [ ] Secrets never appear in code, `.env` files, or Terraform state in plaintext
- [ ] CI/CD pipeline runs on every push to `main`
- [ ] App fully functional on GCP (auth, CSV import, dashboard, sales)
- [ ] `README.md` updated with GCP deploy instructions and architecture diagram
- [ ] Cost estimate documented (Cloud Run scales to 0 → near-zero idle cost)

---

### GCP Cost Expectations (free tier / learning)

| Service | Cost at low traffic |
|---|---|
| Cloud Run | ~$0 (scales to 0, generous free tier) |
| Artifact Registry | ~$0.10/GB/month |
| Secret Manager | ~$0.06/10k accesses |
| Cloud Build | 120 free build-minutes/day |
| Cloud Load Balancer | ~$18/month (skip for learning, use `*.run.app`) |
| GCS (tfstate) | Negligible |

> 💡 **Recommended learning path**: Skip Phase 5.5 initially — the `*.run.app` URL with built-in HTTPS is enough to practice all core GCP concepts. Add the Load Balancer later once you're comfortable with the rest.