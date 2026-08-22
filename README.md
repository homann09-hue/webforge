# WebForge

WebForge ist ein verkaufbares Website- und Kundenprojekt-System für kleine und mittelständische Unternehmen.

Das Produkt kombiniert eine eigene Vertriebsseite mit CRM, Angeboten, Projekten, Kundenportal, Datei-Uploads, Rechnungen und einer wiederverwendbaren Customer Site Engine. Ziel ist nicht, jede Kundenwebsite neu zu programmieren, sondern Branchen-Defaults, Module, Theme und Kundendaten zentral zu konfigurieren.

## Produktpositionierung

**Websites, die mehr können.**

WebForge baut moderne Websites und ergänzt sie bei Bedarf um praktische Geschäftsfunktionen wie:

- Anfrageformulare und Lead-Erfassung
- Kostenrechner und Konfiguratoren
- Speisekarte, Warenkorb und Bestellstatus
- Kundenbereiche und Projektstatus
- Datei-Uploads
- Angebote, Rechnungen und Zahlungen
- Termin- und Workflow-Module

## Aktueller Stand

### Fertig

- Vertriebsseite mit Paketen und Lead-Formular
- drei vollständige Branchen-Demos: Handwerk, Lieferdienst, Blumenladen
- realistische, als KI-generiert gekennzeichnete Demo-Bilder
- CRM für Leads, Status, Notizen und kommerzielle Daten
- Angebote mit Positionen, Rabatt, MwSt. und Druckansicht
- Projekte mit Onboarding-Feldern und Aufgaben
- Kundenportal mit rotierbaren Token-Links und Datei-Upload
- Rechnungen mit Positionen, Zahlungen und Salden
- Billing-/Abo-Datenmodell und Stripe-Signaturprüfung
- Neon PostgreSQL als Produktionsdatenbank
- Vercel Blob für private Portal-Dateien
- Vercel für App/Hosting
- serverseitige Admin-Sessions mit httpOnly-Cookie und serverseitigem Widerruf
- Audit-Logging und Login-Rate-Limit
- CSP-/Security-Härtung
- zentrale, typisierte Customer Site Engine in `lib/site-config.ts` und `lib/site-engine.ts`
- deterministische Kunden-Onboarding-Gates in `lib/onboarding.ts`

### Noch offen vor skalierbarem Verkauf

- echte Firmendaten in `lib/company.ts` und final geprüfte Rechtstexte
- Multi-User-Accounts und Rollen statt eines geteilten Admin-Passworts
- bestehende Demos schrittweise vollständig auf datengetriebene Module umstellen; die Site Engine ist die neue Grundlage
- vollständiger Produktions-Abnahmelauf für Lead → Angebot → Projekt → Portal → Rechnung
- erster echter Referenzkunde
- finaler Production-Deploy des jeweils neuesten `main`, falls Vercel-Limits einen Git-Deploy verzögern

## Architektur

```text
Browser
  ↓
Next.js 15 App Router / Route Handler
  ↓
Serverseitige Validierung + Admin-/Portal-Authentifizierung
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

Legacy-Supabase-Material kann im Repository noch als Migrations-/Rollback-Historie vorhanden sein, ist aber **nicht mehr die aktive Produktionsarchitektur**.

## Customer Site Engine

`lib/site-config.ts` definiert die kanonische SiteConfig:

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

`lib/site-engine.ts` liefert Branchen-Defaults und erzeugt daraus neue Kundenkonfigurationen. Ein neuer Kunde soll dadurch primär über Daten und Module konfiguriert werden, nicht über eine neu geschriebene Seite.

## Kunden-Onboarding

Der kanonische Ablauf ist in `lib/onboarding.ts` definiert:

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

Ein Projekt darf nicht allein aufgrund eines manuellen Statuswechsels als start- oder launchbereit gelten. Die Onboarding-Gates sind testbar und bilden die Grundlage für weitere Admin-Automation.

## Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Für die Neon-Funktionen wird `DATABASE_URL` benötigt. Nicht-Zahlungsfunktionen können ohne Stripe-Schlüssel entwickelt werden.

## Verifikation

Vor jedem Merge bzw. Production-Deploy:

```bash
npm run verify
```

`verify` führt aus:

1. Prettier-Check
2. Secret-Scan
3. Source-Smoke-Test
4. ESLint
5. Vitest
6. Next.js Production-Build

Zusätzliche Browser-Gates:

```bash
npm run test:csp
npm run test:a11y
npm run test:e2e
```

Browser-Abhängigkeiten einmalig:

```bash
npm run test:browser:setup
```

## Security

- Admin-Passwort wird nicht im Browser gespeichert
- Server tauscht Login gegen kurzlebiges Session-Token
- Token liegt in einem `httpOnly`, `SameSite=Strict` Cookie
- Logout widerruft die Session serverseitig
- Admin-Routen akzeptieren keine Session aus dem Request-Body
- Login ist rate-limited
- private Dateien werden nur nach Admin-/Portal-Prüfung ausgeliefert
- Stripe-Signaturen werden vor Verarbeitung geprüft
- CSP schützt Admin und Portal zusätzlich
- Secret-Scan prüft nur Git-getrackte Dateien

## Rechtliches Verkaufs-Gate

`lib/company.ts` enthält absichtlich öffentliche Firmendaten. Solange Pflichtfelder dort `TODO` sind, gilt der Verkauf als nicht freigegeben und Checkout-Links bleiben gesperrt.

Vor öffentlichem Verkauf müssen mindestens korrekt eingetragen und geprüft sein:

- rechtlicher Unternehmensname
- vertretungsberechtigte Person
- ladungsfähige Anschrift
- E-Mail und Telefon
- ggf. USt-ID / Registerdaten
- Impressum
- Datenschutzerklärung
- Vertrags-/Leistungsbedingungen passend zum tatsächlichen Geschäftsmodell

Die im Projekt enthaltenen Rechtstexte sind technische Vorlagen und ersetzen keine Rechtsberatung.

## Deployment

Production läuft über Vercel. Datenbank und Storage werden nicht bei jedem Deployment neu erstellt.

Empfohlener Flow:

```text
Feature Branch
→ genau ein Preview-Deploy
→ Verify + Browser-Gates
→ PR
→ Merge nach main
→ genau ein Production-Deploy
→ Smoke-Test
```

Viele unnötige Commits/Deploys sind zu vermeiden, da Vercel-Tarife Deployment-Limits haben können.

## Marktreife-Definition

WebForge ist für öffentliche Skalierung erst dann freigegeben, wenn diese Gates grün sind:

- Legal vollständig
- neuester `main` erfolgreich in Production
- `npm run verify` grün
- Browser-/Accessibility-Gates grün
- Customer Site Engine für Neukunden nutzbar
- Kunden-Onboarding deterministisch
- Multi-User/Rollen für Team-Betrieb
- vollständiger Auftragstest von Lead bis Rechnung
- mindestens ein echter Referenzkunde

## Aktuelle Priorität

Nicht weitere Demo-Branchen bauen. Priorität ist die Produktisierung:

1. Customer Site Engine vervollständigen
2. Onboarding und Abnahme automatisieren
3. Multi-User/Rollen
4. Legal-Gate schließen
5. echten Pilotkunden ausliefern
6. danach laufendes Wartungs-/Hostingmodell skalieren
