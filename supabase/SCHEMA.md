# WebForge — Datenbankschema (Referenz)

Ausgelesen aus dem Live-Projekt `jplqdaxtnrqimlgzwuaw` am 20.08.2026.

**Das hier ist Dokumentation, keine Migration.** Die Funktionsrümpfe (42 Stück,
alle `SECURITY DEFINER`, zusammen ~48 KB plpgsql) sind bewusst _nicht_ von Hand
abgeschrieben — ein Transkriptionsfehler in einer Datenbankfunktion fällt erst
in Produktion auf. Für ein anwendbares Schema:

```bash
supabase link --project-ref jplqdaxtnrqimlgzwuaw
supabase db pull
```

Das erzeugt eine vollständige, verifizierte Migration. Diese Datei dient dazu,
das Schema lesen und reviewen zu können, ohne sich einzuloggen.

## Sicherheitsmodell

Alle Tabellen liegen in `public` mit **RLS aktiviert und ohne Policies** — also
für `anon` und `authenticated` vollständig gesperrt. Der Zugriff läuft
ausschließlich über `SECURITY DEFINER`-Funktionen, die nur `postgres` und
`service_role` ausführen dürfen. Die Supabase-Security-Lints melden das als
INFO („RLS enabled, no policy"), was hier das gewünschte Verhalten ist.

Ein zweites Schema `private` hält, was nie nach außen darf:

| Objekt                            | Zweck                                                       |
| --------------------------------- | ----------------------------------------------------------- |
| `private.admin_sessions`          | Session-Token, gespeichert als SHA-256-Hash, 8 h Gültigkeit |
| `private.lead_rate_limits`        | IP-Fenster für die Lead-Ratenbegrenzung                     |
| `private.assert_admin_password()` | Passwortprüfung                                             |

Portal-Token liegen als `projects.portal_token_hash` — ebenfalls gehasht, nie
im Klartext. Das Stripe-Webhook-Secret liegt in Supabase Vault und wird über
`internal_get_stripe_webhook_secret()` gelesen.

### Anmerkung zum Adminpasswort

`admin_config.password_sha256` speichert einen ungesalzenen SHA-256-Hash.
SHA-256 ist kein Passwort-Hash: ohne Arbeitsfaktor ist er bei einem Leak sehr
schnell durchprobierbar. Für ein einzelnes Adminpasswort mit Ratenbegrenzung
ist das Risiko begrenzt, aber `crypt()` mit bcrypt aus `pgcrypto` wäre die
richtige Wahl. Steht auf der Liste, wenn echte Benutzerkonten kommen.

## Tabellen

| Tabelle                 | Spalten (gekürzt)                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `leads`                 | `id bigint PK`, `company`, `email`, `website`, `status`, `notes`, `last_contacted_at`, `archived_at`, `contact_name`, `phone`, `package_name`, `setup_price_cents int`, `monthly_price_cents int`, `proposal_status`, `customer_since`, `created_at`, `updated_at`                                                  |
| `offers`                | `id PK`, `lead_id`, `offer_number UNIQUE`, `title`, `status`, `discount_percent numeric`, `tax_percent numeric`, `valid_until`, `notes`                                                                                                                                                                             |
| `offer_items`           | `id PK`, `offer_id`, `position`, `description`, `quantity numeric`, `unit`, `unit_price_cents` — `UNIQUE (offer_id, position)`                                                                                                                                                                                      |
| `projects`              | `id PK`, `lead_id`, `offer_id UNIQUE`, `project_number UNIQUE`, `name`, `status`, `progress smallint`, `domain`, `live_url`, `target_launch_date`, `launched_at`, `onboarding_status`, `content_deadline`, 5× `*_received boolean`, `portal_token_hash`, `portal_enabled`, `portal_created_at`, `portal_expires_at` |
| `project_tasks`         | `id PK`, `project_id`, `title`, `category`, `required`, `completed`, `due_date`, `completed_at`, `notes`, `sort_order`                                                                                                                                                                                              |
| `portal_submissions`    | `id PK`, `project_id`, `kind`, `label`, `content`, `file_path`, `file_name`, `review_status`, `reviewed_at`, `reviewed_note`                                                                                                                                                                                        |
| `invoices`              | `id PK`, `lead_id`, `project_id`, `invoice_number UNIQUE`, `invoice_type`, `title`, `status`, `issue_date`, `due_date`, `tax_percent numeric`, `notes`, `recurring_subscription_id`, `stripe_invoice_id UNIQUE`, `stripe_payment_intent_id`                                                                         |
| `invoice_items`         | `id PK`, `invoice_id`, `position`, `description`, `quantity numeric`, `unit`, `unit_price_cents`                                                                                                                                                                                                                    |
| `payments`              | `id PK`, `invoice_id`, `amount_cents`, `method`, `reference`, `paid_at`, `external_payment_id`, `status`, `refunded_cents`, `dispute_status`                                                                                                                                                                        |
| `billing_subscriptions` | `id PK`, `lead_id`, `project_id`, `name`, `amount_cents`, `tax_percent`, `interval`, `status`, `next_invoice_date`, `last_invoice_date`, `stripe_customer_id`, `stripe_subscription_id UNIQUE`, `stripe_price_id`, `stripe_checkout_url`                                                                            |
| `stripe_webhook_events` | `event_id text PK`, `event_type`, `processed_at`                                                                                                                                                                                                                                                                    |
| `admin_audit_log`       | `id PK`, `action`, `entity_type`, `entity_id`, `actor`, `metadata jsonb`, `created_at`                                                                                                                                                                                                                              |
| `admin_config`          | `id boolean PK`, `password_sha256` — Einzeilentabelle                                                                                                                                                                                                                                                               |
| `app_config`            | `key PK`, `value`, `updated_at`                                                                                                                                                                                                                                                                                     |

Beträge liegen durchgehend als Ganzzahl in Cent (`*_cents`), Mengen und
Prozentsätze als `numeric`. Es gibt keine Fließkomma-Geldbeträge — gut so.

## Funktionen

**Öffentliche Admin-RPCs (31)** — alle mit `p_password` als erstem Parameter,
alle nur über `admin-gateway` erreichbar:

`admin_add_payment`, `admin_archive_lead`, `admin_create_billing_subscription`,
`admin_create_invoice`, `admin_create_offer`, `admin_delete_invoice`,
`admin_delete_lead`, `admin_delete_offer`, `admin_delete_project_task`,
`admin_disable_project_portal`, `admin_generate_due_recurring_invoices`,
`admin_list_all_submissions`, `admin_list_billing_subscriptions`,
`admin_list_invoices`, `admin_list_leads`, `admin_list_offers`,
`admin_list_project_submissions`, `admin_list_projects`,
`admin_mark_lead_contacted`, `admin_project_tasks`,
`admin_rotate_project_portal_token`, `admin_save_project_onboarding`,
`admin_set_billing_subscription_status`, `admin_set_billing_subscription_stripe`,
`admin_set_invoice_status`, `admin_set_submission_review`,
`admin_update_lead_commercial`, `admin_update_lead_notes`,
`admin_update_lead_status`, `admin_update_offer_status`, `admin_update_project`,
`admin_upsert_project_task`

**Interne Funktionen** — nur von Edge Functions aufgerufen:

| Funktion                                                        | Verhalten                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `internal_admin_create_session(p_password)`                     | prüft Passwort, gibt `'wfs_' \|\| encode(gen_random_bytes(32),'hex')` zurück, speichert den SHA-256-Hash mit 8 h Ablauf, räumt alte Sessions auf |
| `internal_admin_validate_session(p_token)`                      | prüft Muster `^wfs_[0-9a-f]{64}$`, Hash, `revoked_at is null`, `expires_at > now()`; aktualisiert `last_seen_at`                                 |
| `internal_admin_validate_password(p_password)`                  | `true`/`false`, ohne Exception nach außen                                                                                                        |
| `internal_admin_revoke_session(p_token)`                        | setzt `revoked_at`                                                                                                                               |
| `internal_submit_lead(p_company,p_email,p_website,p_ip)`        | validiert, **max. 5 Anfragen pro IP und Stunde**, schreibt den Lead                                                                              |
| `internal_get_stripe_webhook_secret()`                          | liest aus Supabase Vault                                                                                                                         |
| `portal_get_project(p_token)`                                   | Projekt inkl. Aufgaben und Abgaben über den Portal-Token                                                                                         |
| `portal_submit(p_token,p_kind,p_label,p_content)`               | Text-/Link-Abgabe, ratenbegrenzt                                                                                                                 |
| `portal_register_file(p_token,p_label,p_file_path,p_file_name)` | registriert einen Upload                                                                                                                         |

## Edge Functions

Der Quellcode liegt jetzt unter `supabase/functions/`. Siehe
[`README.md`](README.md) für die Aufrufverträge.
