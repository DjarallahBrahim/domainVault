# API Route Contracts: TLD Batch Sync

**Date**: 2026-07-30 | **Feature**: Phase 18

## Route: Create Sync Job

```
POST /api/tld-checker/jobs
Auth: Required (Supabase session cookie)
```

Creates a new TLD check job for the authenticated user's domains.

**Request Body**:
```json
{
  "scope": "all",
  "domainIds": ["uuid1", "uuid2"]
}
```

- `scope`: `"all"` (all user domains) or `"page"` (specific domain IDs)
- `domainIds`: Required when `scope = "page"`; optional when `scope = "all"`

**Success Response** (201):
```json
{
  "data": {
    "jobId": "uuid",
    "status": "queued",
    "totalPairs": 150,
    "message": "Sync job created. 15 domains × 10 TLDs = 150 pairs to process."
  }
}
```

**Error Responses**:
- `401` — Not authenticated
- `409` — A sync job is already running (`{ "error": "A sync job is already in progress" }`)
- `500` — Internal error

---

## Route: Get Job Status

```
GET /api/tld-checker/jobs/:id
Auth: Required
```

Returns the current status and progress of a sync job. Only returns jobs owned by the authenticated user.

**Success Response** (200):
```json
{
  "data": {
    "id": "uuid",
    "status": "running",
    "totalPairs": 150,
    "processedPairs": 87,
    "error": null,
    "createdAt": "2026-07-30T...",
    "startedAt": "2026-07-30T...",
    "finishedAt": null
  }
}
```

**Error Responses**:
- `401` — Not authenticated
- `404` — Job not found or belongs to another user
- `500` — Internal error

---

## Route: Get Domain Extensions

```
GET /api/tld-checker/domains/:domainId/extensions
Auth: Required
```

Returns the TLD check results for a single domain. Only returns data for domains owned by the authenticated user.

**Success Response** (200):
```json
{
  "data": [
    { "tld": "io", "fullDomain": "acmecorp.io", "isReserved": true, "isLive": false },
    { "tld": "ai", "fullDomain": "acmecorp.ai", "isReserved": true, "isLive": true },
    { "tld": "co", "fullDomain": "acmecorp.co", "isReserved": false, "isLive": false }
  ]
}
```

Results sorted with reserved TLDs first, then by TLD alphabetically.

**Error Responses**:
- `401` — Not authenticated
- `404` — Domain not found or belongs to another user
- `500` — Internal error

---

## Route: Refresh Single Domain

```
POST /api/tld-checker/domains/:domainId/refresh
Auth: Required
```

Triggers an immediate TLD check for a single domain against the active TLD list. Runs synchronously — the HTTP response contains the results.

**Success Response** (200):
```json
{
  "data": {
    "domainId": "uuid",
    "reservedTldsCount": 3,
    "checkedAt": "2026-07-30T...",
    "results": [
      { "tld": "io", "fullDomain": "acmecorp.io", "isReserved": true, "isLive": false },
      { "tld": "ai", "fullDomain": "acmecorp.ai", "isReserved": true, "isLive": true }
    ]
  }
}
```

**Time constraint**: Completes within 20 seconds for up to 10 active TLDs.

**Error Responses**:
- `401` — Not authenticated
- `404` — Domain not found or belongs to another user
- `500` — Internal error or DNS resolution failure
