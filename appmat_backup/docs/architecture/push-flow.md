# Push Notification Flow

1. Client registers device token
2. Token stored in `subscriptions`
3. Edge Function sends push event
4. Push Relay sends to FCM
5. Service Worker receives event
6. In-App listener shows popup
