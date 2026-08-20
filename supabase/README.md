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

## Offene Punkte

**1. `admin-portal-file-url` ist noch nicht deployt** — die Repo-Version
enthält einen Fix, die Live-Version nicht.

Die Live-Version prüft nur `internal_admin_validate_password`, bekommt von der
Anwendung aber ein Session-Token. Ergebnis: „Datei öffnen" im Adminbereich
antwortet immer mit 401. Die Version hier akzeptiert beides, genau wie
`admin-gateway`.

```bash
supabase functions deploy admin-portal-file-url
```

**2. Migrationen 002 und 003 sind noch nicht angewendet.**

002 ergänzt den Unique-Index auf `payments.external_payment_id`. Ohne ihn kann
PostgREST das `on_conflict` im Stripe-Webhook nicht auflösen und der Insert
scheitert. 003 entfernt die ungenutzte Funktion `submit_lead`.

**3. Der Stripe-Webhook-Endpunkt muss im Stripe-Dashboard gesetzt werden:**

```
https://jplqdaxtnrqimlgzwuaw.supabase.co/functions/v1/stripe-webhook
```

Es gab zwei Implementierungen (Next.js und Edge Function); die Next-Route ist
entfernt. Benötigte Events: `checkout.session.completed`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated`,
`customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`.

Das Signing-Secret liegt in Supabase Vault unter
`webforge_stripe_webhook_secret`, nicht in Vercel.

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
