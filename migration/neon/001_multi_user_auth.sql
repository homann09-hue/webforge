-- Additive WebForge multi-user foundation for Neon.
-- Does not remove or alter the current shared-password admin flow.
-- Apply only after review in the target Neon database.

begin;

create extension if not exists pgcrypto;

create table if not exists private.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  role text not null check (role in ('owner', 'admin', 'staff', 'customer')),
  password_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index if not exists admin_users_email_lower_unique
  on private.admin_users (lower(email));

create table if not exists private.user_sessions (
  token_hash text primary key,
  user_id uuid not null references private.admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  user_agent_hash text,
  ip_hash text
);

create index if not exists user_sessions_user_id_idx on private.user_sessions(user_id);
create index if not exists user_sessions_expiry_idx on private.user_sessions(expires_at);

create or replace function public.internal_user_session_lookup(p_token text)
returns table(user_id uuid, email text, display_name text, role text)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_hash text;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 256 then
    raise exception 'unauthorized';
  end if;

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  return query
  update private.user_sessions s
     set last_seen_at = now()
    from private.admin_users u
   where s.token_hash = v_hash
     and s.user_id = u.id
     and s.revoked_at is null
     and s.expires_at > now()
     and u.active = true
  returning u.id, u.email, u.display_name, u.role;
end;
$$;

create or replace function public.internal_user_revoke_session(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_hash text;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 256 then
    return true;
  end if;
  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  update private.user_sessions set revoked_at = coalesce(revoked_at, now()) where token_hash = v_hash;
  return true;
end;
$$;

create or replace function public.internal_user_create_session(p_email text, p_password text)
returns text
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user private.admin_users%rowtype;
  v_token text;
  v_hash text;
begin
  select * into v_user
    from private.admin_users
   where lower(email) = lower(trim(p_email))
     and active = true
   limit 1;

  if v_user.id is null or v_user.password_hash is null then
    raise exception 'unauthorized';
  end if;

  if crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    raise exception 'unauthorized';
  end if;

  v_token := 'wfu_' || encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into private.user_sessions(token_hash, user_id, expires_at)
  values (v_hash, v_user.id, now() + interval '8 hours');

  update private.admin_users set last_login_at = now(), updated_at = now() where id = v_user.id;
  return v_token;
end;
$$;

revoke all on private.admin_users from public;
revoke all on private.user_sessions from public;
revoke all on function public.internal_user_session_lookup(text) from public;
revoke all on function public.internal_user_revoke_session(text) from public;
revoke all on function public.internal_user_create_session(text, text) from public;

commit;
