# API Contract: GET /api/sedo/list

**Sedo Function**: `DomainList`

**Purpose**: Fetch all domains currently listed on the user's Sedo account. Used by the Sync button to populate/refresh the `sedo_listings` cache. Paginated in batches of 100.

## Request

```
GET /api/sedo/list
```

No query parameters. No request body.

**Auth**: Supabase session cookie (automatic via `createServerClient`).

## Response

### 200 — Success

```json
{
  "data": {
    "listings": [
      {
        "domain": "example.com",
        "price": 5000.00,
        "minprice": 2000.00,
        "fixedprice": 1,
        "currency": 1
      }
    ],
    "total": 1
  }
}
```

| Field | Type | Description |
|---|---|---|
| `listings[].domain` | string | Domain name as listed on Sedo |
| `listings[].price` | number | Asking price in USD |
| `listings[].minprice` | number | Minimum offer in USD |
| `listings[].fixedprice` | integer | 1 = Fixed price, 0 = Negotiable |
| `listings[].currency` | integer | Currency code (always 1 = USD) |
| `total` | integer | Total number of listings across all pages |

### 401 — No Credentials Saved

```json
{
  "error": "Sedo credentials not configured"
}
```

### 500 — Sedo Fault

```json
{
  "error": "<faultstring from Sedo>"
}
```

### 500 — Network Error

```json
{
  "error": "Could not reach Sedo. Try again."
}
```

## Behavior

1. Authenticate user via Supabase server client
2. Fetch `user_settings` for `auth.uid()`
3. If any Sedo credential field is NULL → return 401
4. Paginate through Sedo `DomainList` using `startfrom`:
   - First call: `startfrom=0` → get 100 results
   - Next call: `startfrom=100` → get next 100 results
   - Continue until empty result set
5. Aggregate all listings from all pages into a single array
6. Return as `{ listings: [...], total: N }`

**Note**: This endpoint returns ALL listings — no `$domain` filter. The client (sync mutation in `useSedoSync`) handles upserting returned domains and deleting stale cache rows.
