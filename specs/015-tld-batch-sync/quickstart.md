# Developer Quickstart: TLD Batch Sync & API Routes

**Date**: 2026-07-30 | **Branch**: `015-tld-batch-sync`

## Overview

Adds server-side batch sync for TLD reservation checks and API routes for job management. Built on top of Phase 16's reusable engine.

## Architecture

```
Client (browser)                  Server (Next.js Route Handler)
     │                                    │
     ├─ POST /api/tld-checker/jobs ──────►│ creates tld_check_jobs row
     │                                    │ starts processJob()
     │                                    │   │
     │                                    │   ├─ chunk: 5 domains
     │                                    │   │  ├─ extractRootWord(domain)
     │                                    │   │  ├─ checkAllExtensionsForRoot(root, tlds, resolver)
     │                                    │   │  ├─ persistResults(client, domainId, userId, results)
     │                                    │   │  └─ update processed_pairs
     │                                    │   │
     │                                    │   ├─ next chunk...
     │                                    │   └─ job.status = "completed"
     │                                    │
     ├─ GET /api/tld-checker/jobs/:id ───►│ returns { status, processedPairs, totalPairs }
     │                                    │
     ├─ POST /.../domains/:id/refresh ───►│ synchronous single-domain check
     │                                    │
     ▼ (progress)                         │
Supabase Realtime ◄──────────────────────►│ tld_check_jobs row UPDATE
```

## Key Files

```
app/api/tld-checker/jobs/route.ts           # POST create job
app/api/tld-checker/jobs/[id]/route.ts      # GET job status
app/api/tld-checker/domains/[domainId]/extensions/route.ts  # GET extensions
app/api/tld-checker/domains/[domainId]/refresh/route.ts     # POST refresh
lib/tld-checker/jobs/processJob.ts          # Server-side processing loop
lib/tld-checker/jobs/createJob.ts           # Job creation + conflict check
lib/supabase/queries/tld-jobs.ts            # DB: insert, get, update job
components/domains/TldSyncButton.tsx        # Sync All button with progress
```

## Usage Examples

### Trigger a Full Sync (from client)

```ts
const res = await fetch("/api/tld-checker/jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ scope: "all" }),
});
const { data } = await res.json();
// data.jobId, data.totalPairs
```

### Poll Job Progress (client polling fallback)

```ts
useEffect(() => {
  if (!jobId) return;
  const interval = setInterval(async () => {
    const res = await fetch(`/api/tld-checker/jobs/${jobId}`);
    const { data } = await res.json();
    setProgress(data.processedPairs / data.totalPairs);
    if (data.status === "completed") clearInterval(interval);
  }, 3000);
  return () => clearInterval(interval);
}, [jobId]);
```

### Refresh a Single Domain (from domains table row)

```ts
const res = await fetch(`/api/tld-checker/domains/${domainId}/refresh`, {
  method: "POST",
});
const { data } = await res.json();
// data.reservedTldsCount, data.results
```

## Processing Loop Pseudocode

```ts
async function processJob(job: TldCheckJobRow) {
  // 1. Mark job as running
  await updateJobStatus(job.id, "running");

  // 2. Resolve domain list (snapshot from job creation)
  const domainIds = job.domain_ids;
  const activeTlds = await fetchActiveTlds();
  const resolvers = ["cloudflare", "google"];

  // 3. Process in chunks of 5
  for (let i = 0; i < domainIds.length; i += 5) {
    const chunk = domainIds.slice(i, i + 5);
    const resolver = resolvers[(i / 5) % 2]; // alternate per chunk

    for (const domainId of chunk) {
      const domain = await fetchDomain(domainId);
      const root = extractRootWord(domain.domain);
      const results = await checkAllExtensionsForRoot(
        root, activeTlds, resolver
      );
      await persistResults(supabase, domainId, job.user_id, results);
    }

    // 4. Update progress
    await incrementProcessedPairs(job.id, chunk.length * activeTlds.length);
  }

  // 5. Mark completed
  await updateJobStatus(job.id, "completed");
}
```

## Testing

```bash
# Type checking
npx tsc --noEmit

# Test API routes (requires dev server)
curl -X POST http://localhost:3000/api/tld-checker/jobs \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'

curl http://localhost:3000/api/tld-checker/jobs/{jobId}

curl http://localhost:3000/api/tld-checker/domains/{domainId}/extensions

curl -X POST http://localhost:3000/api/tld-checker/domains/{domainId}/refresh
```
