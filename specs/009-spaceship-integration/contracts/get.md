# API Contract: GET /api/spaceship/get

**Spaceship Endpoint**: `GET /v1/sellerhub/domains/{domain}`

**Purpose**: Fetch a single domain's listing details from Spaceship SellerHub. Used by per-domain sync.

## Request

```
GET /api/spaceship/get?domain=example.com
```

**Auth**: Supabase session cookie.

## Response

### 200 — Found

```json
{
  "data": {
    "domain": "example.com",
    "spaceshipId": "abc123",
    "listed": true,
    "price": 5000.00,
    "currency": "USD"
  }
}
```

### 200 — Not Found

```json
{
  "data": {
    "domain": "example.com",
    "listed": false,
    "price": null,
    "currency": null
  }
}
```

### 401 — No Credentials

```json
{ "error": "Spaceship credentials not configured" }
```

### 500

```json
{ "error": "<message>" }
```
