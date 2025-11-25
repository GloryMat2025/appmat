create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image text,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image text,
  price numeric not null,
  category_id uuid references public.categories(id),
  available boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  status text default 'pending',

  total numeric not null,
  address text,
  note text,

  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  status text default 'pending',

  total numeric not null,
  address text,
  note text,

  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text,
  price numeric,
  qty int,
  created_at timestamptz default now()
);

create table if not exists public.order_status_history (
  id bigserial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists public.order_payments (
  id bigserial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  bill_id text,
  amount numeric,
  paid_at timestamptz,
  gateway text default 'billplz'
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  device text,
  created_at timestamptz default now()
);

create table if not exists public.branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  created_at timestamptz default now()
);
