-- ---------------------------------------------------------------------------
-- SUPERSEDED — DO NOT APPLY TO A LIVE DATABASE
--
-- This file no longer describes the production schema and is kept only for
-- history. Two concrete divergences:
--
--   * leads.id is declared uuid here, while lib/leads.ts types Lead.id as a
--     number, so production uses an integer key.
--   * The columns the application actually reads (contact_name, phone,
--     package_name, setup_price_cents, monthly_price_cents, proposal_status,
--     archived_at, last_contacted_at, customer_since) are missing entirely.
--
-- The comment at the bottom is also out of date: the table is no longer
-- reached with the service role key from Next.js, but through the
-- `admin-gateway` Edge Function.
--
-- Replace this directory with a real dump:  supabase db pull
-- See supabase/README.md for the full procedure.
-- ---------------------------------------------------------------------------

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
