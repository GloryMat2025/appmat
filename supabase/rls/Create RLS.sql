# Create RLS files with content

Set-Content "supabase\rls\01_profiles.sql" @"
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin full access profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());
"@

Set-Content "supabase\rls\02_orders.sql" @"
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin full access orders"
  ON public.orders FOR ALL
  USING (public.is_admin());
"@

Set-Content "supabase\rls\03_order_items.sql" @"
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin full access order items" ON public.order_items;

CREATE POLICY "Users view order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());
"@

Set-Content "supabase\rls\04_order_status_history.sql" @"
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin insert status history" ON public.order_status_history;

CREATE POLICY "Users view status history"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin insert status history"
  ON public.order_status_history FOR INSERT
  USING (public.is_admin());
"@

Set-Content "supabase\rls\05_order_payments.sql" @"
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payments" ON public.order_payments;
DROP POLICY IF EXISTS "Service role insert payments" ON public.order_payments;

CREATE POLICY "Users view own payments"
  ON public.order_payments FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role insert payments"
  ON public.order_payments FOR INSERT
  TO service_role
  WITH CHECK (true);
"@

Set-Content "supabase\rls\06_push_subscriptions.sql" @"
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users insert subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users delete subscription" ON public.push_subscriptions;

CREATE POLICY "Users read own subscription"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert subscription"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete subscription"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
"@

Set-Content "supabase\rls\07_admin.sql" @"
-- Global Admin policy can be reused
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE;
"@

Set-Content "supabase\rls\08_public_tables.sql" @"
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;

CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);
"@
