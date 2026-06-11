# API Contract: DELETE /api/spaceship/delete

**Spaceship Endpoint**: `DELETE /v1/sellerhub/domains/{domain}`

**Purpose**: Delist a domain from Spaceship SellerHub.

## Request

```
POST /api/spaceship/delete
Content-Type: application/json

{ "domain": "example.com" }
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
