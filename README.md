# WebForge

Verkaufbares Website-System für lokale Unternehmen.

## Ziel

WebForge kombiniert eine eigene Vertriebsseite mit einem Verwaltungssystem für
Kundenprojekte. Kundenwebsites sollen später primär über Konfiguration, Inhalte
und Branchenmodule individualisiert werden, statt jedes Projekt neu zu
entwickeln.

## Aktueller Stand

**Fertig:**

- Vertriebsseite mit Paketen (Starter / Business / Pro) und Lead-Formular
- Drei vollständige Branchen-Demos: Handwerk, Lieferdienst, Blumenladen
- CRM: Leads, Status, Notizen, Archiv, kommerzielle Daten
- Angebote mit Positionen, Rabatt, MwSt. und Druckansicht
- Projekte mit Onboarding-Checkliste und Aufgaben
- Kundenportal mit rotierbaren Token-Links und Datei-Upload
- Rechnungen mit Positionen, Zahlungen und Salden
- Abos mit wiederkehrenden Rechnungen, Stripe Checkout und Webhook

**Noch offen:**

- Das Template-/Konfigurationssystem für Kundenseiten. `lib/site-config.ts` ist
  bislang nur eine Namensliste; die Demos sind fest verdrahtete Komponenten.
- Die Supabase Edge Functions und das vollständige DB-Schema liegen nicht im
  Repository. Siehe [`supabase/README.md`](supabase/README.md) — das ist das
  wichtigste offene Thema.
- Echte Benutzerkonten. Der Admin-Bereich hat ein einziges geteiltes Passwort,
  keine Rollen und kein Audit-Log.

## Technik

Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Postgres, Edge
Functions, Storage) · Stripe · Vercel

Datenfluss: Browser → Next Route Handler (Validierung) → Supabase Edge Function
(Authentifizierung) → Postgres RPC. Einzige Ausnahme ist der Stripe-Webhook,
der mit dem Service-Role-Key direkt auf PostgREST zugreift.

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Werte eintragen; ohne Stripe-Keys laufen alle
                             # Nicht-Zahlungsfunktionen normal
npm run dev
```

## Vor dem Deployment

```bash
npm run verify
```

Führt der Reihe nach aus: Formatprüfung → Secret-Scan → Struktur-Smoke-Test →
ESLint → Tests → Build. Genau das läuft auch in CI.

Weitere Skripte:

| Befehl                   | Zweck                             |
| ------------------------ | --------------------------------- |
| `npm run format`         | Prettier über das ganze Repo      |
| `npm run test`           | Vitest einmalig                   |
| `npm run security:smoke` | sucht committete Secrets          |
| `npm run source:smoke`   | prüft Routen und Auth-Invarianten |

## Bevor die Seite verkauft

`lib/company.ts` enthält Platzhalter (`TODO`). Solange diese nicht gefüllt sind:

- zeigen Impressum und Datenschutz einen Warnhinweis,
- ersetzt die Preissektion die Stripe-Checkout-Links durch Links zum
  Kontaktformular.

Das ist Absicht: Zahlungen auf einer Seite ohne vollständiges Impressum nach
§ 5 DDG sind in Deutschland abmahnfähig. Nach dem Ausfüllen schalten sich die
Links automatisch frei. Die Rechtstexte sind ein fundierter Entwurf und
ersetzen keine Rechtsberatung — vor dem Livegang prüfen lassen.

## Authentifizierung

Der Admin-Bereich tauscht das geteilte Passwort serverseitig gegen ein
kurzlebiges Session-Token, das in einem httpOnly-Cookie liegt
(`SameSite=Strict`, `Secure` in Produktion). JavaScript im Browser kommt an das
Token nicht heran.

Alle `/api/admin/*`-Routen lesen die Berechtigung ausschließlich aus dem Cookie
und nie aus dem Request-Body — ein Aufrufer kann also keine mitliefern.

## Umgebungsvariablen

Siehe `.env.example`. `NEXT_PUBLIC_SUPABASE_URL` und
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sind optional und fallen auf das
Produktionsprojekt zurück — setzen Sie sie, um eine Staging-Instanz zu betreiben.

## Nächste Meilensteine

1. Edge Functions und Schema ins Repository holen (`supabase/README.md`)
2. Firmendaten in `lib/company.ts` eintragen und Rechtstexte prüfen lassen
3. Admin-Login manuell gegen die Live-Instanz testen
4. Echte Benutzerkonten statt geteiltem Passwort
5. Kunden-Template und zentrale Konfiguration
6. Gastronomie- und Handwerker-Module
7. Demo-Websites und Deployment-Automatisierung
