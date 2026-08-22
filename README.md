# WebForge

WebForge ist ein Website- und Kundenprojekt-System für kleine und mittelständische Unternehmen.

**Positionierung:** Websites, die mehr können. Neben dem öffentlichen Auftritt können je nach Kunde praktische Geschäftsfunktionen wie Anfragewege, Kostenrechner, Bestellungen, Kundenportal, Datei-Uploads, Angebote und Rechnungen zugeschaltet werden.

## Aktueller Produktstand

### Fertig

- Vertriebsseite mit Paketen und Lead-Formular
- Branchen-Demos für Handwerk, Lieferdienst/Gastronomie und Floristik
- realistische, als KI-generiert gekennzeichnete Demo-Bilder
- CRM für Leads und Kundendaten
- Angebote mit Positionen, Rabatt und Druckansicht
- Projekte mit Onboarding und Aufgaben
- Kundenportal mit rotierbaren Token-Links und Datei-Uploads
- Rechnungen, Zahlungen und Salden
- Neon PostgreSQL als aktive Datenbank
- Vercel Blob für private Portal-Dateien
- Next.js/Vercel als App-Layer
- serverseitige Admin-Sessions mit httpOnly-Cookie und serverseitigem Widerruf
- Audit-Logging und Login-Rate-Limit
- CSP-/Security-Härtung
- zentrale Customer Site Engine
- deterministische Kunden-Onboarding-Gates
- Rollen-/Berechtigungsmodell für `owner`, `admin`, `staff`, `customer`
- additive Neon-Migration für Multi-User-Accounts und Sessions
- vollständiger automatisierter Geschäftsflow-Test:
  - Lead
  - Angebot
  - Annahme
  - Projekt
  - Onboarding
  - Portal
  - Kundenabgabe
  - Rechnung
  - Zahlung
- Production-Dependency-Audit als CI-Gate
- CSP- und Accessibility-Browser-Gates
- Market-Readiness-Gate
- Firmendaten zentralisiert; Checkout bleibt bei Test-/Platzhalterdaten automatisch gesperrt
- Kleinunternehmerregelung nach § 19 UStG technisch berücksichtigt

## Noch offen vor kommerziellem Marktstart

1. **Kommerziell zulässiges Hosting sicherstellen.**
   Vercels Hobby-Plan darf nach den aktuellen Vercel-Nutzungsbedingungen nur persönlich bzw. nicht-kommerziell genutzt werden. Vor bezahltem WebForge-Betrieb ist daher mindestens ein für kommerzielle Nutzung zulässiger Vercel-Tarif (z. B. Pro) oder ein anderes geeignetes Hosting-Setup erforderlich.
2. **Multi-User-Migration kontrolliert auf Neon anwenden und abnehmen.**
   Bis dahin bleibt der bestehende Shared-Admin-Login als Fallback aktiv.
3. **Neuesten `main`-Stand in Production deployen und Smoke-Test durchführen.**
4. **Rechtstexte vor dem echten Marktstart fachlich/juristisch prüfen lassen.**
5. **Ersten echten Referenzkunden ausliefern.**

## Architektur

```text
Browser
  ↓
Next.js App Router / Route Handler
  ↓
Validierung + Authentifizierung
  ↓
Neon PostgreSQL

Private Dateien
Browser → geschützte Next.js Route → Vercel Blob
```

### Stack

- Next.js 15.5
- React 19
- TypeScript
- Neon PostgreSQL
- `@neondatabase/serverless`
- Vercel
- Vercel Blob
- Vitest
- Playwright / axe-core in CI

Legacy-Supabase-Dateien können noch als Migrations-/Rollback-Historie im Repository liegen. Supabase ist nicht mehr die aktive Runtime-Architektur.

## Customer Site Engine

Die zentrale Site-Konfiguration liegt in `lib/site-config.ts`; Branchen-Defaults und Auflösung liegen in `lib/site-engine.ts`.

```text
SiteConfig
├── Firma / Branche / Slug
├── SEO
├── Kontakt
├── Theme
└── Module
    ├── Leistungen
    ├── Referenzen
    ├── Kostenrechner
    ├── Speisekarte
    ├── Warenkorb
    ├── Bestellstatus
    ├── Sortiment
    ├── Konfigurator
    ├── Kundenportal
    ├── Datei-Upload
    └── Terminbuchung
```

Der generische Renderer liegt in `components/customer-site.tsx`. Neue Kunden sollen primär über Konfiguration, Inhalte und Module angelegt werden statt über eine neue React-Seite.

## Kunden-Onboarding

Der kanonische Ablauf liegt in `lib/onboarding.ts`:

```text
Anfrage qualifiziert
→ Angebot angenommen
→ Startzahlung bestätigt
→ Firmendaten vorhanden
→ Inhalte vorhanden
→ rechtliche Kundendaten vorhanden
→ Website konfiguriert
→ Kundenprüfung
→ Livegang freigegeben
→ Live
```

Ein Projekt gilt nur dann als start- oder launchbereit, wenn die definierten Gates erfüllt sind.

## Multi-User

Das Rollenmodell liegt in `lib/authorization.ts`.

Vorbereitet sind:

- `owner`
- `admin`
- `staff`
- `customer`

Die additive Neon-Migration liegt unter:

```text
migration/neon/001_multi_user_auth.sql
```

Kontrollierter Migrationsrunner:

```bash
node scripts/apply-neon-migration.mjs migration/neon/001_multi_user_auth.sql --confirm
```

Der Runner verlangt `DATABASE_URL_UNPOOLED` oder `DATABASE_URL` und verifiziert das Multi-User-Schema nach der Ausführung.

## Kleinunternehmer nach § 19 UStG

`lib/company.ts` ist aktuell auf Kleinunternehmerregelung gesetzt.

Deshalb gilt technisch:

- Angebote verwenden 0 % Umsatzsteuer
- Rechnungen verwenden 0 % Umsatzsteuer
- die API erzwingt 0 %, auch wenn ein Client versehentlich 19 % sendet
- Angebots- und Rechnungsmasken starten mit 0 %
- Druckansichten weisen keine Umsatzsteuer aus
- Druckansichten enthalten den Hinweis: „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“
- das Market-Readiness-Gate prüft diese Invarianten

## Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Für Neon-Funktionen wird `DATABASE_URL` benötigt.

## Verifikation

Vor jedem Merge:

```bash
npm run verify
```

Enthalten:

1. Prettier
2. Secret-Scan
3. Source-Smoke
4. ESLint
5. Vitest
6. Next.js Production-Build

Zusätzlich:

```bash
npm run market:readiness
npm run test:e2e
npm run test:csp
npm run test:a11y
```

CI prüft außerdem:

```bash
npm audit --omit=dev --audit-level=high
```

Die derzeit bekannten High-Severity-Runtime-Abhängigkeiten in PostCSS/Sharp werden durch gepatchte Overrides geschlossen.

## Release-Gates

Der manuelle Workflow `.github/workflows/release.yml` führt vor einem Markt-Release aus:

- Production-Dependency-Audit
- `npm run verify`
- Market-Readiness-Gate
- vollständigen Admin-/Auftrags-E2E
- Production-Build
- CSP-Prüfung
- Accessibility-Prüfung

## Security

- Session-Token nicht in `localStorage` oder `sessionStorage`
- `httpOnly` und `SameSite=Strict`
- serverseitiger Session-Widerruf
- Admin-Routen lesen Authentifizierung ausschließlich aus dem Cookie
- Login-Rate-Limit
- private Blob-Dateien nur nach Auth-/Portal-Prüfung
- konstante Zeit für Stripe-Signaturvergleich
- CSP für Admin und Portal
- Secret-Scan in CI
- Runtime-Dependency-Audit

## Rechtliches

Die öffentlichen Firmendaten liegen in `lib/company.ts` und werden von Impressum, Datenschutz und Druckvorlagen wiederverwendet.

Die Datenschutzerklärung beschreibt den aktiven Stack mit Vercel/Vercel Blob, Neon und optional Stripe. Die im Repository enthaltenen Rechtstexte sind technische Vorlagen und ersetzen keine individuelle Rechtsberatung.

## Deployment

Empfohlener Flow:

```text
Feature Branch
→ Preview / CI
→ Verify + Browser-Gates
→ PR
→ Merge nach main
→ Production-Deploy
→ Smoke-Test
```

Unnötige Deployment-Schleifen sind zu vermeiden.

## Marktreife-Definition

Ein kommerzieller Marktstart ist erst freigegeben, wenn:

- Firmendaten vollständig sind
- §19-UStG-Regeln korrekt greifen, solange Kleinunternehmerstatus aktiv ist
- Runtime-Audit grün ist
- `npm run verify` grün ist
- Market-Readiness-Gate grün ist
- CSP und Accessibility grün sind
- vollständiger Auftragstest grün ist
- Customer Site Engine nutzbar ist
- Multi-User-Produktion abgenommen ist oder der Betrieb bewusst noch als Single-Admin-Pilot erfolgt
- kommerziell zulässiges Hosting aktiv ist
- neuester `main` erfolgreich in Production läuft
- Rechtstexte fachlich geprüft sind

## Nächste Priorität

Keine weiteren Demo-Branchen bauen, bevor die Release-Gates abgeschlossen sind.

1. Rechtstexte prüfen lassen
2. kommerzielles Hosting sicherstellen
3. Multi-User-Migration auf Neon anwenden und testen
4. Production deployen und Smoke-Test durchführen
5. ersten Pilotkunden ausliefern
6. danach Wartungs-/Hostingmodell und Vertrieb skalieren
