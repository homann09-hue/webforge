-- One-time password reset links for secure owner recovery.

begin;

create table if not exists private.user_password_resets (
  token_hash text primary key,
  user_id uuid not null references private.admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists user_password_resets_expiry_idx
  on private.user_password_resets(expires_at);

create or replace function public.internal_user_complete_password_reset(p_token text, p_password text)
returns text
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid;
  v_session_token text;
  v_session_hash text;
begin
  if p_token is null or p_token !~ '^wfr_[0-9a-f]{64}$' then
    raise exception 'invalid_reset';
  end if;
  if p_password is null or length(p_password) < 14 or length(p_password) > 200 then
    raise exception 'invalid_password';
  end if;

  select r.user_id into v_user_id
    from private.user_password_resets r
    join private.admin_users u on u.id = r.user_id
   where r.token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and r.used_at is null
     and r.expires_at > now()
     and u.active = true
   for update of r;

  if v_user_id is null then
    raise exception 'invalid_reset';
  end if;

  update private.user_password_resets
     set used_at = now()
   where token_hash = encode(digest(p_token, 'sha256'), 'hex');

  update private.admin_users
     set password_hash = crypt(p_password, gen_salt('bf', 12)),
         updated_at = now(),
         last_login_at = now()
   where id = v_user_id;

  update private.user_sessions
     set revoked_at = coalesce(revoked_at, now())
   where user_id = v_user_id
     and revoked_at is null;

  v_session_token := 'wfu_' || encode(gen_random_bytes(32), 'hex');
  v_session_hash := encode(digest(v_session_token, 'sha256'), 'hex');
  insert into private.user_sessions(token_hash, user_id, expires_at)
  values (v_session_hash, v_user_id, now() + interval '8 hours');

  delete from private.user_password_resets
   where expires_at < now() - interval '24 hours'
      or (used_at is not null and used_at < now() - interval '24 hours');

  return v_session_token;
end;
$$;

revoke all on private.user_password_resets from public;
revoke all on function public.internal_user_complete_password_reset(text, text) from public;

commit;
