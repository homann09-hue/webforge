# Supabase

## Was hier liegt

| Pfad          | Inhalt                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `functions/`  | Alle 7 Edge Functions, verbatim aus dem Live-Projekt                            |
| `migrations/` | 001 (überholt, siehe Kopfkommentar), 002–006 — **alle angewendet**, siehe unten |
| `SCHEMA.md`   | Tabellen, Constraints und alle 42 Funktionen als Referenz                       |

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

| Migration / Deploy         | Inhalt                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `admin-portal-file-url` v3 | Akzeptiert jetzt auch Session-Tokens. Vorher antwortete „Datei öffnen" im Admin **immer** mit 401. |
| `admin-logout` v1          | Neu. Der Logout widerrief die Session vorher nie serverseitig.                                     |
| 002                        | Unique-Index auf `payments.external_payment_id` — **fehlerhaft, siehe 006**                        |
| 003                        | `submit_lead` entfernt (Insert ohne Ratenbegrenzung)                                               |
| 004                        | Adminpasswort auf bcrypt, mit Lazy-Upgrade beim nächsten Login                                     |
| 005                        | Brute-Force-Zähler repariert — hatte nie funktioniert                                              |
| 006                        | Korrigiert 002: der Index war partiell und damit für `ON CONFLICT` unbrauchbar                     |

**Zu 002 und 006:** Der Index aus 002 trug ein `where external_payment_id is
not null`. Postgres kann einen partiellen Index für `ON CONFLICT` nicht
auflösen, wenn das Statement das Prädikat nicht wiederholt — PostgREST sendet
es nicht. Jeder Zahlungs-Insert wäre mit `42P10` gescheitert, der Webhook hätte
500 geliefert und Stripe hätte endlos wiederholt, ohne dass je eine Zahlung
verbucht worden wäre. 002 wurde angewendet und als erledigt gemeldet — das war
falsch. 006 behebt es, gegen die Live-Datenbank verifiziert.

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

Das Adminpasswort liegt seit Migration 004 als bcrypt-Hash (Kosten 12) in
`admin_config.password_hash`. Altbestände im alten ungesalzenen SHA-256-Format
werden weiterhin akzeptiert und beim nächsten erfolgreichen Login in place
aufgewertet — niemand wird ausgesperrt, und das Passwort muss dafür nicht
bekannt sein.

Migration 005 repariert die Ratenbegrenzung für Loginversuche. Sie hat vorher
nie gegriffen: die Funktion schrieb den Fehlversuch in
`private.admin_gateway_failures` und warf danach eine Exception — was in
PL/pgSQL genau diesen Insert wieder zurückrollt. Online-Passwortraten war
damit unbegrenzt. Verifiziert und behoben; die Grenze liegt bei 20
Fehlversuchen pro Minute.
