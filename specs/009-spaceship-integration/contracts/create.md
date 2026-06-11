# API Contract: POST /api/spaceship/create

**Spaceship Endpoint**: `POST /v1/sellerhub/domains`

**Purpose**: List a domain for sale on Spaceship SellerHub.

## Request

```
POST /api/spaceship/create
Content-Type: application/json

{ "domain": "example.com", "price": 5000.00 }
```

**Auth**: Supabase session cookie.

## Response

### 200 — Success

```json
{
  "data": {
    "success": true,
    "domain": "example.com",
    "spaceshipId": "abc123"
  }
}
```

### 400 — Validation

```json
{ "error": "Missing required field: domain" }
```

### 401 — No Credentials

```json
{ "error": "Spaceship credentials not configured" }
```

### 500

```json
{ "error": "<message>" }
```

## Behavior

1. Authenticate user, validate body (domain + price)
2. Fetch `user_settings`, check credentials
3. `POST /v1/sellerhub/domains` with body `{ domain, price }`
4. Return success with Spaceship's listing ID
