create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

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

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin full access orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin full access order items" ON public.order_items;

CREATE POLICY "Users view order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.is_admin());

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin insert status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin full access order_status_history" ON public.order_status_history;

CREATE POLICY "Users view status history"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin insert status history"
  ON public.order_status_history FOR INSERT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin full access order_status_history"
  ON public.order_status_history FOR ALL
  TO authenticated
  USING (public.is_admin());


ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payments" ON public.order_payments;
DROP POLICY IF EXISTS "Service role insert payments" ON public.order_payments;
DROP POLICY IF EXISTS "Admin full access order_payments" ON public.order_payments;

CREATE POLICY "Users view own payments"
  ON public.order_payments FOR SELECT
  TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role insert payments"
  ON public.order_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin full access order_payments"
  ON public.order_payments FOR ALL
  TO authenticated
  USING (public.is_admin());

  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users insert subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users delete subscription" ON public.push_subscriptions;

CREATE POLICY "Users read own subscription"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert subscription"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete subscription"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON public.products;

CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  TO public
  USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;

CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);

