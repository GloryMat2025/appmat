create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  token text not null,
  device text,
  created_at timestamptz default now()
);
