# Supabase

## Was hier liegt

| Pfad          | Inhalt                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| `functions/`  | Alle 7 Edge Functions, verbatim aus dem Live-Projekt                              |
| `migrations/` | 001 (überholt, siehe Kopfkommentar), 002 und 003 (neu, noch **nicht** angewendet) |
| `SCHEMA.md`   | Tabellen, Constraints und alle 42 Funktionen als Referenz                         |

Projekt: `jplqdaxtnrqimlgzwuaw` (WebForge, eu-central-1)

## Was noch fehlt

Die **Funktionsrümpfe** (42 `SECURITY DEFINER`-Funktionen, zusammen ~48 KB
plpgsql) sind bewusst nicht abgeschrieben, sondern nur in `SCHEMA.md`
dokumentiert. Ein Tippfehler in einer Datenbankfunktion fällt erst in
Produktion auf. Hol dir stattdessen eine verifizierte Migration:

```bash
npm i -g supabase          # oder: brew install supabase/tap/supabase
supabase login
supabase link --project-ref jplqdaxtnrqimlgzwuaw
supabase db pull           # erzeugt supabase/migrations/<timestamp>_remote_schema.sql
git add supabase && git commit -m "Vendor the verified database schema"
```

Danach zeigt `supabase db diff` Abweichungen, und Änderungen laufen über
Migrationen statt über die Web-Konsole.

## Deployen

Die Edge Functions hier sind der Stand des Live-Projekts, **mit einer
Ausnahme**: `admin-portal-file-url` enthält einen Fix, der noch nicht deployt
ist (siehe unten). Nach Änderungen:

```bash
supabase functions deploy admin-portal-file-url
supabase functions deploy <name>            # einzeln
```

Migrationen anwenden:

```bash
supabase db push
```

## Bereits angewendet (20.08.2026)

- `admin-portal-file-url` v3 deployt. Die vorherige Version prüfte nur
  `internal_admin_validate_password`, bekam von der Anwendung aber ein
  Session-Token — „Datei öffnen" im Adminbereich antwortete immer mit 401.
  Die neue Version akzeptiert beides, genau wie `admin-gateway`.
- Migration 002: Unique-Index auf `payments.external_payment_id`.
- Migration 003: `submit_lead` entfernt.

Die Dateien unter `functions/` und `migrations/` entsprechen damit dem
Live-Stand.

## Offene Punkte

**1. Der Stripe-Webhook-Endpunkt muss im Stripe-Dashboard gesetzt werden:**

```
https://jplqdaxtnrqimlgzwuaw.supabase.co/functions/v1/stripe-webhook
```

Es gab zwei Implementierungen (Next.js und Edge Function); die Next-Route ist
entfernt. Das ist der einzige verbliebene manuelle Schritt, ohne den keine
Zahlung verbucht wird. Benötigte Events: `checkout.session.completed`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated`,
`customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`.

Das Signing-Secret liegt in Supabase Vault unter
`webforge_stripe_webhook_secret`, nicht in Vercel.

**2. `supabase db pull` für die verifizierten Funktionsrümpfe** (siehe oben).

## Edge Functions und ihre Verträge

| Function                | Aufrufer                                    | Vertrag                                                                            |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `admin-login`           | `lib/admin-session.ts` (serverseitig)       | `{ password }` → `{ ok, token, expiresIn }`, Token `wfs_[0-9a-f]{64}`, 8 h         |
| `admin-gateway`         | `lib/admin-rpc.ts` (serverseitig)           | `{ password: <Token>, function, args }` → RPC-Ergebnis; schreibt `admin_audit_log` |
| `admin-portal-file-url` | `lib/submissions.ts` (serverseitig)         | `{ password: <Token>, submissionId }` → `{ ok, url }`, signierte URL, 120 s        |
| `lead-submit`           | `lib/leads.ts` (serverseitig)               | `{ company, email, website, clientIp }` → 201; 5 Anfragen/IP/Stunde                |
| `portal-gateway`        | `lib/portal.ts` (serverseitig)              | `{ action: "get" \| "submit", token, … }`                                          |
| `portal-upload`         | `app/portal/[token]/page.tsx` (**Browser**) | multipart `{ token, label, file }`; JPG/PNG/WebP/PDF/TXT, max. 10 MB               |
| `stripe-webhook`        | Stripe                                      | signaturgeprüft, idempotent über `stripe_webhook_events.event_id`                  |

Statuscodes, auf die sich die Anwendung verlässt: `401`/`403` = nicht
autorisiert, `429` = ratenbegrenzt.

Alle Functions erlauben nur den Origin `https://webforge-virid.vercel.app`.
Serverseitige Aufrufe senden keinen `Origin`-Header und passieren deshalb —
**bei einer neuen Domain muss `ALLOWED_ORIGINS` in allen Functions ergänzt
werden**, sonst bricht der Browser-Upload im Kundenportal.

### Zum Feldnamen `password`

`admin-gateway` und `admin-portal-file-url` nehmen das Session-Token in einem
Feld entgegen, das historisch `password` heißt. Ein echtes Passwort geht nur
noch an `admin-login`. Umbenennen wäre sauberer, muss aber auf beiden Seiten
gleichzeitig passieren.

## Sicherheitsmodell in einem Absatz

Alle Tabellen: RLS an, keine Policies — für `anon` also komplett gesperrt.
Zugriff ausschließlich über `SECURITY DEFINER`-Funktionen, deren `EXECUTE` nur
`postgres` und `service_role` haben. Session-Token und Portal-Token liegen
ausschließlich als SHA-256-Hash. Das Stripe-Secret liegt in Vault. Die
Supabase-Security-Lints melden nur INFO („RLS enabled, no policy"), was hier
das gewollte Verhalten ist.

Eine Schwachstelle bleibt: `admin_config.password_sha256` ist ein ungesalzener
SHA-256-Hash. Das ist kein Passwort-Hash — ohne Arbeitsfaktor ist er bei einem
Leak schnell durchprobierbar. `crypt()` mit bcrypt aus `pgcrypto` wäre richtig.
Gehört zusammen mit echten Benutzerkonten angegangen.
