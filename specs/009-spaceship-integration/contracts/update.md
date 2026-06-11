# API Contract: PATCH /api/spaceship/update

**Spaceship Endpoint**: `PATCH /v1/sellerhub/domains/{domain}`

**Purpose**: Update the price of an existing Spaceship SellerHub listing.

## Request

```
POST /api/spaceship/update
Content-Type: application/json

{ "domain": "example.com", "price": 4500.00 }
```

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

### 401 / 500 — same as other routes
