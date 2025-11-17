
---

## 📁 **docs/api/payments.md**
```md
# Payments API

## Create Bill (Billplz)
**POST** `/create-billplz`

```json
{
  "orderId": "uuid",
  "amount": 65.00,
  "email": "user@example.com",
  "name": "Customer"
}

Response:

{
  "url": "https://www.billplz.com/bills/123",
  "bill_id": "123"
}