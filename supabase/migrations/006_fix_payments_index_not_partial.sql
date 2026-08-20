-- Corrects migration 002, which did not do what it claimed.
--
-- 002 created the index WITH a predicate:
--     ... (external_payment_id) where external_payment_id is not null
--
-- Postgres will not infer a partial index for ON CONFLICT unless the statement
-- repeats the predicate, and PostgREST's ?on_conflict=external_payment_id
-- emits a plain "ON CONFLICT (external_payment_id)". Verified against the live
-- database:
--
--     ERROR 42P10: there is no unique or exclusion constraint matching
--                  the ON CONFLICT specification
--
-- So every Stripe payment insert would have failed with a 400, the webhook
-- would have returned 500, and Stripe would have retried forever without a
-- single payment ever being recorded. 002 was applied and reported as fixing
-- this; it did not.
--
-- The predicate was pointless anyway: a plain unique index already allows many
-- NULLs, which was the only reason it was added.

drop index if exists public.payments_external_payment_id_key;

create unique index payments_external_payment_id_key
  on public.payments (external_payment_id);
