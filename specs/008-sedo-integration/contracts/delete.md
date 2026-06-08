# API Contract: POST /api/sedo/delete

**Sedo Function**: `DomainDelete`

**Purpose**: Delist a domain from Sedo. Called when the user confirms removal in the Sedo overlay.

## Request

```
POST /api/sedo/delete
Content-Type: application/json
```

```json
{
  "domain": "example.com"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `domain` | string | Yes | Domain name to delist |

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
  "error": "Missing required field: domain"
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
2. Validate request body (domain required)
3. Fetch `user_settings` for `auth.uid()`
4. If any Sedo credential field is NULL → return 401
5. Call `callSedo('DomainDelete', { ...credentials, domain })`
6. On success → return `{ success: true, domain }`
7. On Sedo fault → return 500 with `faultstring`
8. On network error → return 500 with generic message

**Client-side after success**:
1. Delete `sedo_listings` row (remove cache entry)
2. Invalidate `['sedo-listings']`
3. Close overlay + toast: "example.com removed from Sedo"
4. Cell reverts to State A ("Not Listed")
