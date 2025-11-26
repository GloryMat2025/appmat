Notifications in this repository

A short pointer to the notifications implementation and how to test it.

See: `supabase/NOTIFICATIONS.md`

What you'll find there:

- Supabase Edge Function: `supabase/functions/notify-new-order-fixed`
- DB migration to create `public.push_subscriptions`
- Required secrets and naming quirks (FCM, VAPID, service role keys)
- Local integration helpers: `supabase/scripts/integration_notify_test.cjs`
- Notes about runtime keys vs CLI-settable secrets and debug helpers used during testing

Next actions I can take for you:

- Add the same pointer into `README.md` (I can make a cautious edit that avoids fragile context matching).
- Help set `PUSH_RELAY_URL` as a project secret and run an end-to-end WebPush test.
- Fix your local `supabase/.env.local` service role key so the local integration script can run.

Tell me which of the above I should do next, or say "do all" and I will proceed in order.
