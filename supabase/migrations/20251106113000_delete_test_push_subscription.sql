-- Migration: Delete the test push subscription inserted during testing
-- This deletes the subscription with the known test FCM endpoint.

DELETE FROM public.push_subscriptions
WHERE subscription->>'endpoint' = 'https://fcm.googleapis.com/fcm/send/fake-token-123';

-- End migration
