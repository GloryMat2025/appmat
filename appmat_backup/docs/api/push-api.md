
---

## 📁 **docs/api/push-api.md**
```md
# Push Notification API

## Register Device
POST `/push/register`

## Subscribe to Order
POST `/push/subscribe`

## Notify (Admin)
POST `/push/notify`

Payload:
```json
{
  "order_id": "uuid",
  "status": "preparing"
}
