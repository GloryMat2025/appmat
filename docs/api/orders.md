# Orders API

## Create Order
**POST** `/orders`

### Request
```json
{
  "user_id": "uuid",
  "items": [
    { "product_id": "abc123", "qty": 2 },
    { "product_id": "xyz456", "qty": 1 }
  ]
}
Response
{
  "order_id": "uuid",
  "status": "pending"
}

Get Orders

GET /orders?user_id=<uuid>
