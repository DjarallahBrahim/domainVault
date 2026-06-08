# API Contract: POST /api/sedo/insert

**Sedo Function**: `DomainInsert`

**Purpose**: List a domain for sale on Sedo. Called when the user submits the Sedo overlay in create mode.

## Request

```
POST /api/sedo/insert
Content-Type: application/json
```

```json
{
  "domain": "example.com",
  "price": 5000.00,
  "minprice": 2000.00,
  "fixedprice": 1
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `domain` | string | Yes | Domain name to list |
| `price` | number | Yes | Asking price in USD |
| `minprice` | number | Yes | Minimum offer in USD |
| `fixedprice` | integer | Yes | 1 = Fixed price, 0 = Negotiable |

**Auth**: Supabase session cookie (automatic via `createServerClient`).

## Response

### 200 — Success

```json
{
  "data": {
    "success": true,
    "domain": "example.com"
  }
}
```

### 401 — No Credentials Saved

```json
{
  "error": "Sedo credentials not configured"
}
```

### 400 — Validation Error

```json
{
  "error": "Missing required field: price"
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
2. Validate request body (domain, price, minprice, fixedprice required)
3. Fetch `user_settings` for `auth.uid()`
4. If any Sedo credential field is NULL → return 401
5. Call `computeSedoPricing(price, minprice, fixedprice)` to build final payload:
   ```ts
   { price, minprice, fixedprice, currency: 1, forsale: 1 }
   ```
6. Call `callSedo('DomainInsert', { ...credentials, domain, ...pricing })`
7. On success → return `{ success: true, domain }`
8. On Sedo fault → return 500 with `faultstring`
9. On network error → return 500 with generic message

**Client-side after success**:
1. Upsert `sedo_listings` row (cache the listing)
2. If `domains.bin` was null, PATCH to save it
3. Invalidate `['sedo-listings']` + `['domains']`
4. Close overlay + toast
