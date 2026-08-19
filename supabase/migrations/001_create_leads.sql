create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  website text check (website is null or char_length(website) <= 300),
  status text not null default 'new' check (status in ('new','contacted','qualified','won','lost')),
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

-- No browser-facing policies are created intentionally. WebForge accesses this table
-- only from server-side code with SUPABASE_SERVICE_ROLE_KEY.
