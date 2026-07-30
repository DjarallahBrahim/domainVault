# Data Model: TLD Batch Sync

**Date**: 2026-07-30 | **Feature**: Phases 17+18

## Job Lifecycle State Machine

```
                    ┌──────────┐
                    │  queued  │  ← Job created, waiting to start
                    └────┬─────┘
                         │ processing begins
                    ┌────▼─────┐
               ┌───►│ running  │◄───┐
               │    └────┬─────┘    │
               │         │          │ resume (re-queue incomplete domains)
               │    ┌────▼─────┐    │
               │    │completed │    │
               │    └──────────┘    │
               │                    │
               │    ┌──────────┐    │
               │    │  failed  │    │ all domains exhausted or unrecoverable error
               │    └──────────┘    │
               │                    │
               │    ┌──────────┐    │
               └────┤ cancelled │◄───┘ user aborts
                    └──────────┘
```

**Transitions**:

| From | To | Trigger |
|------|----|---------|
| `queued` | `running` | Processor picks up the job and sets `started_at` |
| `running` | `completed` | All domain groups processed, `processed_pairs == total_pairs` |
| `running` | `failed` | Unrecoverable error (DB down, all DNS queries failing) |
| `running` | `cancelled` | User explicitly cancels the job |
| `running` | `cancelled` | Server crash — stale `running` job detected on next sync attempt |
| `cancelled` / `failed` | `running` | User retries — new job created with remaining incomplete domains |

**One-job rule**: Only one job per user can be in `queued` or `running` state at any time. The UI button is disabled during these states.

## API Request/Response Schemas

### POST /api/tld-checker/jobs

```ts
// Request
POST /api/tld-checker/jobs
Content-Type: application/json
Body: {
  scope: "all" | "page";
  domainIds?: string[];  // Required if scope = "page"
}

// Response 201
{
  data: {
    jobId: string;
    status: "queued";
    totalPairs: number;
  }
}

// Response 409 (already running)
{
  error: "A sync job is already in progress"
}
```

### GET /api/tld-checker/jobs/:id

```ts
// Response 200
{
  data: {
    id: string;
    status: "queued" | "running" | "completed" | "failed" | "cancelled";
    totalPairs: number;
    processedPairs: number;
    error?: string;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
  }
}

// Response 404 (not found or not owned by user)
{ error: "Job not found" }
```

### GET /api/tld-checker/domains/:domainId/extensions

```ts
// Response 200
{
  data: Array<{
    tld: string;
    fullDomain: string;
    isReserved: boolean;
    isLive: boolean;
  }>;
}

// Response 404 (domain not found or not owned)
{ error: "Domain not found" }
```

### POST /api/tld-checker/domains/:domainId/refresh

```ts
// Response 200
{
  data: {
    domainId: string;
    reservedTldsCount: number;
    checkedAt: string;
    results: Array<{
      tld: string;
      fullDomain: string;
      isReserved: boolean;
      isLive: boolean;
    }>;
  }
}

// Response 404 (domain not found or not owned)
{ error: "Domain not found" }
```

## Progress Subscription Model

### Supabase Realtime Channel

```ts
// Client subscribes to the user's active job
supabase
  .channel("tld-job-{jobId}")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "tld_check_jobs",
      filter: `id=eq.${jobId}`,
    },
    (payload) => {
      // Update progress bar with payload.new.processed_pairs / payload.new.total_pairs
    }
  )
  .subscribe();
```

### Polling Fallback

```ts
// Client polls every 3s
const interval = setInterval(async () => {
  const res = await fetch(`/api/tld-checker/jobs/${jobId}`);
  const { data } = await res.json();
  // Update progress bar
  if (data.status === "completed" || data.status === "failed") {
    clearInterval(interval);
  }
}, 3000);
```

## Domain Ownership Validation Pattern

All routes that accept a `domainId` MUST validate ownership server-side:

```ts
// Server-side ownership check (in every route handler)
const { data: domain } = await supabase
  .from("domains")
  .select("id")
  .eq("id", domainId)
  .eq("user_id", user.id)  // RLS-enforced; double-checked here for defense in depth
  .single();

if (!domain) {
  return new Response(JSON.stringify({ error: "Domain not found" }), { status: 404 });
}
```
