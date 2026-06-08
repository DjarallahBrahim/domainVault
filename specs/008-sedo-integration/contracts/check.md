# API Contract: GET /api/sedo/check

**Sedo Function**: `CheckMember`

**Purpose**: Validate that the user's stored Sedo credentials are valid by calling Sedo's `CheckMember` endpoint. Does not save. Returns connection status.

## Request

```
GET /api/sedo/check
```

No query parameters. No request body.

**Auth**: Supabase session cookie (automatic via `createServerClient`).

## Response

### 200 — Credentials Valid

```json
{
  "data": {
    "connected": true
  }
}
```

### 200 — Credentials Invalid

```json
{
  "data": {
    "connected": false
  }
}
```

### 401 — No Credentials Saved

```json
{
  "error": "Sedo credentials not configured"
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
4. Call `callSedo('CheckMember', { partnerid, signkey, username, password })`
5. If response indicates valid member → `{ connected: true }`
6. If `SEDOFAULT` returned → `{ connected: false }`
7. If network error → return 500
