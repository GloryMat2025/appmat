# Application Flow

1. User opens AppMat
2. Products loaded from Supabase
3. User places an order
4. Order inserted into Supabase
5. Edge Function creates Billplz bill
6. User pays
7. Callback updates order status
8. Push notification sent
9. Rider delivers food
