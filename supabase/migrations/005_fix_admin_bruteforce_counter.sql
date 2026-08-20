-- The admin brute-force counter has never counted anything.
--
-- private.assert_admin_password did this, in one PL/pgSQL block:
--
--     insert into private.admin_gateway_failures ... ;
--     raise exception 'unauthorized';
--
-- In PL/pgSQL a RAISE aborts the enclosing subtransaction, which undoes every
-- write made since it began — including the INSERT one line above. The counter
-- therefore returned to zero on every failed attempt, and the `failures >= 20`
-- check could never fire. Verified against the live database: calling
-- internal_admin_validate_password with a wrong password left the counter at 0.
--
-- Net effect: online password guessing was unlimited. Together with the
-- unsalted SHA-256 that migration 004 replaced, that was the weakest link in
-- the system.
--
-- The fix is to stop raising on the path that records. Verification moves into
-- a boolean-returning function that never raises for a wrong password, and the
-- two entry points an attacker can actually reach return a value instead:
--
--   internal_admin_create_session   -> NULL   (the Edge Function already treats
--                                              a non-string result as 401)
--   internal_admin_validate_password -> false
--
-- Rate limiting still raises 'rate_limited', but that path records nothing, so
-- the rollback costs us nothing and the Edge Function keeps mapping it to 429.

-- ---------------------------------------------------------------------------
-- Verification without the self-defeating raise.
-- ---------------------------------------------------------------------------
create or replace function private.check_admin_password(p_password text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public', 'private', 'extensions', 'pg_temp'
as $function$
declare
  stored text;
  current_bucket timestamptz := date_trunc('minute', now());
  failures_now integer;
  accepted boolean := false;
begin
  select coalesce(failures, 0) into failures_now
  from private.admin_gateway_failures
  where bucket = current_bucket;

  -- The only remaining raise. Nothing has been written at this point, so
  -- aborting here loses nothing.
  if coalesce(failures_now, 0) >= 20 then
    raise exception 'rate_limited';
  end if;

  select ac.password_hash into stored
  from public.admin_config ac
  where ac.id = true;

  if stored is not null then
    if stored like '$2%' then
      accepted := (extensions.crypt(coalesce(p_password, ''), stored) = stored);
    else
      -- Legacy unsalted SHA-256, upgraded in place on success (migration 004).
      accepted := (encode(digest(coalesce(p_password, ''), 'sha256'), 'hex') = stored);
      if accepted then
        begin
          update public.admin_config
          set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 12))
          where id = true;
        exception
          when others then
            raise warning 'admin password bcrypt upgrade failed: %', sqlerrm;
        end;
      end if;
    end if;
  end if;

  if not accepted then
    insert into private.admin_gateway_failures(bucket, failures)
    values (current_bucket, 1)
    on conflict (bucket) do update set failures = private.admin_gateway_failures.failures + 1;
    delete from private.admin_gateway_failures where bucket < now() - interval '15 minutes';
  end if;

  return accepted;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Kept for the 32 admin RPCs, which rely on the raise to abort.
--
-- On this path the rollback still discards the recorded failure. That is
-- acceptable: admin-gateway validates the credential up front via
-- internal_admin_validate_session / internal_admin_validate_password, both of
-- which now count correctly, so an attacker is stopped before reaching an RPC.
-- ---------------------------------------------------------------------------
create or replace function private.assert_admin_password(p_password text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'private', 'extensions', 'pg_temp'
as $function$
begin
  if not private.check_admin_password(p_password) then
    raise exception 'unauthorized';
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Login. Returns NULL rather than raising, so the failure it just recorded
-- survives the call.
-- ---------------------------------------------------------------------------
create or replace function public.internal_admin_create_session(p_password text)
 returns text
 language plpgsql
 security definer
 set search_path to 'public', 'private', 'extensions', 'pg_temp'
as $function$
declare
  raw_token text;
begin
  if not private.check_admin_password(p_password) then
    return null;
  end if;

  raw_token := 'wfs_' || encode(gen_random_bytes(32), 'hex');
  insert into private.admin_sessions(token_hash, expires_at)
  values (encode(digest(raw_token, 'sha256'), 'hex'), now() + interval '8 hours');

  delete from private.admin_sessions
  where expires_at < now() - interval '24 hours'
     or (revoked_at is not null and revoked_at < now() - interval '24 hours');

  return raw_token;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Already returned a boolean; it just did so by swallowing the exception,
-- which took the recorded failure with it.
-- ---------------------------------------------------------------------------
create or replace function public.internal_admin_validate_password(p_password text)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public', 'private', 'extensions', 'pg_temp'
as $function$
begin
  return private.check_admin_password(p_password);
exception
  -- Only 'rate_limited' can reach this now. Report it as a failed check.
  when others then
    return false;
end;
$function$;
