-- Move the admin password from an unsalted SHA-256 to bcrypt.
--
-- SHA-256 is not a password hash: it has no work factor and no salt, so a
-- leaked admin_config row is brute-forceable at billions of guesses per second
-- on commodity hardware. bcrypt at cost 12 costs roughly a quarter second per
-- attempt, which is the entire point.
--
-- Nobody gets locked out. The stored value is upgraded lazily: a legacy hash
-- still authenticates, and the first successful login with one replaces it
-- with a bcrypt hash. There is no window in which the existing password stops
-- working, and no need to know the password to migrate it.
--
-- private.assert_admin_password is the single chokepoint for password
-- verification: all 32 admin RPCs reach it through assert_admin_credential,
-- as do internal_admin_create_session and internal_admin_validate_password.
-- Changing it here changes it everywhere.

-- The column no longer holds a SHA-256, and a column that lies about its
-- contents costs someone an hour later. Exactly one function reads it.
alter table public.admin_config rename column password_sha256 to password_hash;

create or replace function private.assert_admin_password(p_password text)
 returns void
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

  -- Tightened from 60. With bcrypt each attempt also costs ~250 ms of database
  -- CPU, so a high ceiling is now a resource problem as well as a guessing one.
  -- The bucket is per minute, so a lockout clears itself within 60 seconds.
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
      -- Legacy unsalted SHA-256.
      accepted := (encode(digest(coalesce(p_password, ''), 'sha256'), 'hex') = stored);

      if accepted then
        -- Upgrade in place. Wrapped so that a failure here can never turn a
        -- valid login into a rejection; the next login simply tries again.
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
    raise exception 'unauthorized';
  end if;
end;
$function$;

comment on column public.admin_config.password_hash is
  'bcrypt hash (cost 12). Legacy unsalted SHA-256 values are still accepted and '
  'upgraded in place on the next successful login; see migration 004.';
