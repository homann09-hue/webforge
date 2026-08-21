# WebForge Neon migration

Status: preparation phase. Production still uses Supabase.

## Verified live Supabase inventory

- 47 application-owned PostgreSQL functions across `public` and `private`
- Core tables: leads, offers, offer_items, projects, project_tasks, portal_submissions, invoices, invoice_items, payments, billing_subscriptions, stripe_webhook_events, admin_audit_log, admin_config, app_config
- Private tables: admin_sessions, admin_gateway_failures, lead_rate_limits
- Admin and portal tokens are stored only as SHA-256 hashes
- Stripe webhook processing is idempotent through `stripe_webhook_events.event_id`

## Neon compatibility work

1. Keep PostgreSQL data model, constraints, sequences and transactional rules.
2. Replace Supabase Vault usage. `internal_get_stripe_webhook_secret()` must not be ported; the webhook secret will live in Vercel as `STRIPE_WEBHOOK_SECRET`.
3. Replace Supabase `extensions.crypt`, `extensions.gen_salt`, and `extensions.digest` references with Neon-compatible `pgcrypto` calls.
4. Do not expose direct database credentials to the browser. `DATABASE_URL` is server-only.
5. Supabase Edge Functions are removed only after equivalent Vercel route handlers/direct Neon access pass E2E tests.
6. Supabase Storage is migrated separately to private Vercel Blob.

## Cutover gates

- schema imported into Neon
- data counts reconciled table-by-table
- foreign keys and unique constraints verified
- admin login/logout verified against Neon
- lead rate limiting verified
- portal token validation/submissions verified
- Stripe webhook signature + idempotency verified
- upload/download path verified using private Blob
- `npm run verify` passes
- browser E2E passes
- production remains on Supabase until every gate passes
