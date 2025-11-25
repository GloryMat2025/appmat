create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql stable security definer;

-- User can see their own profile
create policy "Users can view own profile"
on public.profiles for select
using (id = auth.uid() or is_admin());

-- Users can update their own profile
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid());

-- User can view ONLY their orders
create policy "Users can view own orders"
on public.orders for select
using (user_id = auth.uid() or is_admin());

-- User can insert their own order
create policy "Users can insert own orders"
on public.orders for insert
with check (user_id = auth.uid());

-- User can update ONLY their orders (normally not used)
create policy "Users can update own orders"
on public.orders for update
using (user_id = auth.uid());

-- Admin full access
create policy "Admins full access orders"
on public.orders for all
using (is_admin());

create policy "Users view their order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and (orders.user_id = auth.uid() or is_admin())
  )
);

create policy "Users insert their own order items"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

create policy "Users view their own order history"
on public.order_status_history for select
using (
  exists (
    select 1 from public.orders
    where orders.id = order_status_history.order_id
    and (orders.user_id = auth.uid() or is_admin())
  )
);

create policy "Admins insert status history"
on public.order_status_history for insert
using (is_admin());

create policy "Users view own payments"
on public.order_payments for select
using (
  exists (
    select 1 from public.orders
    where orders.id = order_payments.order_id
    and (orders.user_id = auth.uid() or is_admin())
  )
);

create policy "Service role insert payments"
on public.order_payments for insert
to service_role
using (true)
with check (true);

create policy "Users can view own subscriptions"
on public.subscriptions for select
using (user_id = auth.uid() or is_admin());

create policy "Users can insert own subscriptions"
on public.subscriptions for insert
with check (user_id = auth.uid());
