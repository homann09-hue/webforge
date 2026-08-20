-- The Stripe webhook Edge Function inserts payments with
--   POST /rest/v1/payments?on_conflict=external_payment_id
--   Prefer: resolution=ignore-duplicates
--
-- PostgREST can only resolve `on_conflict` against a unique constraint or
-- unique index. There is none on payments.external_payment_id, so that insert
-- fails outright — and the deduplication it was meant to provide never
-- happened. A Stripe retry after a partial failure could book the same payment
-- twice.
--
-- Partial index: external_payment_id is null for payments entered by hand in
-- the admin area, and several of those must be allowed to coexist.

create unique index if not exists payments_external_payment_id_key
  on public.payments (external_payment_id)
  where external_payment_id is not null;
