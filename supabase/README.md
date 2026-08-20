# Supabase

## The problem this file documents

Roughly half of WebForge does not live in this repository.

The application code calls **6 Edge Functions** and **31 database RPCs**, and
reads at least 15 tables. What is version-controlled is one migration for the
`leads` table — and that migration is out of date (see the header comment in
`migrations/001_create_leads.sql`).

Everything that actually enforces security — password checking, rate limiting,
session token issuing and expiry, portal token validation, RLS policies — lives
only in the Supabase project. That means it cannot be reviewed, cannot be
rolled back, cannot be recreated if the project is lost, and cannot be tested
before it reaches production.

**Fixing this is the highest-value work remaining on this codebase.** The steps
are below.

## Pulling the current state into the repo

```bash
npm i -g supabase            # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref jplqdaxtnrqimlgzwuaw

# 1. The schema, as a real migration
supabase db pull

# 2. Every Edge Function
for fn in admin-login admin-gateway admin-portal-file-url lead-submit portal-gateway portal-upload; do
  supabase functions download "$fn"
done

git add supabase && git commit -m "Vendor the Supabase schema and Edge Functions"
```

After that, `supabase db diff` shows drift, and changes go through migrations
instead of the web console.

## Edge Functions the application depends on

| Function                | Called from                   | Contract                                                                   |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `admin-login`           | `lib/admin-session.ts`        | `{ password }` → `{ ok, token }` where token matches `wfs_[0-9a-f]{64}`    |
| `admin-gateway`         | `lib/admin-rpc.ts`            | `{ password: <session token>, function, args }` → the RPC's JSON result    |
| `admin-portal-file-url` | `lib/submissions.ts`          | `{ password: <session token>, submissionId }` → `{ ok, url }` (signed URL) |
| `lead-submit`           | `lib/leads.ts`                | `{ company, email, website }` → 2xx, public, must rate limit               |
| `portal-gateway`        | `lib/portal.ts`               | `{ action: "get" \| "submit", token, … }` → `{ ok, project }`              |
| `portal-upload`         | `app/portal/[token]/page.tsx` | multipart `{ token, label, file }`, called directly from the browser       |

Status codes the application relies on: `401`/`403` mean "not authorised",
`429` means "rate limited". Both surface to the user as a login failure.

### Note on the credential field name

`admin-gateway` and `admin-portal-file-url` receive the session token in a
field still named `password`, for historical reasons. The application no longer
sends a real password anywhere except to `admin-login`. Renaming the field is a
worthwhile follow-up, but it has to change on both sides at once.

## Admin RPCs in use

Leads: `admin_list_leads`, `admin_update_lead_status`, `admin_update_lead_notes`,
`admin_mark_lead_contacted`, `admin_archive_lead`, `admin_delete_lead`,
`admin_update_lead_commercial`

Offers: `admin_list_offers`, `admin_create_offer`, `admin_update_offer_status`,
`admin_delete_offer`

Projects: `admin_list_projects`, `admin_update_project`,
`admin_save_project_onboarding`, `admin_project_tasks`,
`admin_upsert_project_task`, `admin_delete_project_task`,
`admin_rotate_project_portal_token`, `admin_disable_project_portal`

Invoicing: `admin_list_invoices`, `admin_create_invoice`,
`admin_set_invoice_status`, `admin_add_payment`, `admin_delete_invoice`

Subscriptions: `admin_list_billing_subscriptions`,
`admin_create_billing_subscription`, `admin_set_billing_subscription_status`,
`admin_set_billing_subscription_stripe`, `admin_generate_due_recurring_invoices`

Portal submissions: `admin_list_all_submissions`, `admin_set_submission_review`

## Tables the application reads or writes

Inferred from the TypeScript types and the REST calls in
`app/api/stripe/webhook/route.ts`. Replace this list with the real dump.

`leads`, `offers`, `offer_items`, `customer_projects`, `project_tasks`,
`portal_submissions`, `invoices`, `invoice_items`, `payments`,
`billing_subscriptions`, `stripe_webhook_events`

The webhook writes `billing_subscriptions`, `invoices`, `payments` and
`stripe_webhook_events` directly over PostgREST with the service role key —
the one path that bypasses the gateway. `stripe_webhook_events.event_id` must
carry a unique constraint, or the idempotency guard silently stops working.
