-- Allow owner/admin user sessions to authorize the existing admin RPCs.
-- Keeps the shared-password session flow as a rollback path.

begin;

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
  v_password_hash text;
  v_password_valid boolean;
  v_bucket timestamptz := date_trunc('minute', now());
  v_failures integer;
begin
  select coalesce(failures, 0) into v_failures
    from private.admin_gateway_failures
   where bucket = v_bucket;

  if coalesce(v_failures, 0) >= 20 then
    raise exception 'rate_limited';
  end if;

  select * into v_user
    from private.admin_users
   where lower(email) = lower(trim(p_email))
     and active = true
   limit 1;

  -- A generated dummy hash keeps unknown-email and wrong-password attempts
  -- on the same expensive bcrypt path, reducing account enumeration signals.
  v_password_hash := coalesce(v_user.password_hash, crypt('webforge-invalid-login', gen_salt('bf', 12)));
  v_password_valid := crypt(coalesce(p_password, ''), v_password_hash) = v_password_hash;

  if v_user.id is null or v_user.password_hash is null or not v_password_valid then
    insert into private.admin_gateway_failures(bucket, failures)
    values (v_bucket, 1)
    on conflict (bucket) do update
      set failures = private.admin_gateway_failures.failures + 1;
    delete from private.admin_gateway_failures where bucket < now() - interval '15 minutes';
    return null;
  end if;

  v_token := 'wfu_' || encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into private.user_sessions(token_hash, user_id, expires_at)
  values (v_hash, v_user.id, now() + interval '8 hours');

  delete from private.user_sessions
   where expires_at < now() - interval '24 hours'
      or (revoked_at is not null and revoked_at < now() - interval '24 hours');

  update private.admin_users set last_login_at = now(), updated_at = now() where id = v_user.id;
  return v_token;
end;
$$;

create or replace function private.assert_admin_credential(p_credential text)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_session_id uuid;
  v_token_hash text;
begin
  if p_credential ~ '^wfu_[0-9a-f]{64}$' then
    select s.token_hash into v_token_hash
      from private.user_sessions s
      join private.admin_users u on u.id = s.user_id
     where s.token_hash = encode(digest(p_credential, 'sha256'), 'hex')
       and s.revoked_at is null
       and s.expires_at > now()
       and u.active = true
       and u.role in ('owner', 'admin');

    if v_token_hash is null then
      raise exception 'unauthorized';
    end if;

    update private.user_sessions
       set last_seen_at = now()
     where token_hash = v_token_hash;
    return;
  end if;

  if p_credential ~ '^wfs_[0-9a-f]{64}$' then
    select id into v_session_id
      from private.admin_sessions
     where token_hash = encode(digest(p_credential, 'sha256'), 'hex')
       and revoked_at is null
       and expires_at > now();

    if v_session_id is null then
      raise exception 'unauthorized';
    end if;

    update private.admin_sessions
       set last_seen_at = now()
     where id = v_session_id;
    return;
  end if;

  perform private.assert_admin_password(p_credential);
end;
$$;

revoke all on function private.assert_admin_credential(text) from public;
revoke all on function public.internal_user_create_session(text, text) from public;

commit;
