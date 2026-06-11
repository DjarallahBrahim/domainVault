# API Contract: GET /api/spaceship/list

**Spaceship Endpoint**: `GET /v1/sellerhub/domains`

**Purpose**: Fetch all domains listed on Spaceship SellerHub. Paginated. Used by the Sync button to populate/refresh the `spaceship_listings` cache.

## Request

```
GET /api/spaceship/list
```

No query parameters. No request body.

**Auth**: Supabase session cookie. Spaceship API Key + Secret sent via headers on backend call.

## Response

### 200 — Success

```json
{
  "data": {
    "listings": [
      {
        "domain": "example.com",
        "spaceshipId": "abc123",
        "price": 5000.00,
        "currency": "USD"
      }
    ],
    "total": 1
  }
}
```

### 401 — No Credentials

```json
{ "error": "Spaceship credentials not configured" }
```

### 500 — API Error

```json
{ "error": "<message from Spaceship>" }
```

### 500 — Network Error

```json
{ "error": "Could not reach Spaceship. Try again." }
```

## Behavior

1. Authenticate user via Supabase
2. Fetch `user_settings` — return 401 if `spaceship_api_key` or `spaceship_api_secret` null
3. Paginate `GET /v1/sellerhub/domains?take=100` using offset
4. Aggregate all listings
5. Return as JSON
