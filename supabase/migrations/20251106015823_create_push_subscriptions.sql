-- migration: create push_subscriptions table used by Edge Functions and server
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  subscription jsonb not null
);

-- index to speed lookups (optional)
create index if not exists idx_push_subscriptions_created_at on public.push_subscriptions (created_at);
