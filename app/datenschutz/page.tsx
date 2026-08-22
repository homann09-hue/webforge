import type { Metadata } from "next";
import { company, field, isLegalComplete } from "@/lib/company";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Wie WebForge personenbezogene Daten verarbeitet: Kontaktformular, Kundenportal, Zahlungen und eingesetzte Dienstleister.",
  alternates: { canonical: "/datenschutz" },
  openGraph: {
    title: "Datenschutzerklärung — WebForge",
    url: "/datenschutz",
    siteName: "WebForge",
    locale: "de_DE",
    type: "website",
  },
  twitter: { title: "Datenschutzerklärung — WebForge" },
  robots: { index: true, follow: true },
};

export default function Datenschutz() {
  const incomplete = !isLegalComplete();

  return (
    <main className="shell section">
      <div className="eyebrow">Rechtliches</div>
      <h1>Datenschutzerklärung</h1>

      {incomplete && (
        <p>
          <strong>
            Hinweis: Diese Erklärung ist noch unvollständig. Tragen Sie die Verantwortlichen-Daten in lib/company.ts ein
            und lassen Sie den Text vor dem produktiven Betrieb juristisch prüfen.
          </strong>
        </p>
      )}

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO)
        ist:
      </p>
      <p>
        {field(company.legalName)}
        <br />
        {field(company.representative)}
        <br />
        {field(company.street)}
        <br />
        {field(company.postalCode)} {field(company.city)}
        <br />
        {company.country}
        <br />
        E-Mail: {field(company.email)}
        <br />
        Telefon: {field(company.phone)}
      </p>
      <p>
        Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen hierfür nicht vorliegen.
      </p>

      <h2>2. Aufruf der Website (Server-Logs)</h2>
      <p>
        Beim Aufruf dieser Website werden durch den Hosting-Dienstleister automatisch Zugriffsdaten verarbeitet,
        insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, übertragene Datenmenge, Referrer
        sowie Browser- und Betriebssystemangaben. Diese Verarbeitung ist technisch erforderlich, um die Website
        auszuliefern und ihre Stabilität und Sicherheit zu gewährleisten.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und
        störungsfreien Betrieb der Website.
      </p>

      <h2>3. Kontakt- und Anfrageformular</h2>
      <p>
        Wenn Sie das Anfrageformular nutzen, verarbeiten wir die von Ihnen angegebenen Daten (Unternehmen,
        E-Mail-Adresse sowie optional eine Website-Adresse), um Ihre Anfrage zu bearbeiten und Ihnen ein Angebot zu
        unterbreiten.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung vorvertraglicher Maßnahmen), im Übrigen Art. 6 Abs.
        1 lit. f DSGVO an der Bearbeitung von Interessentenanfragen.
      </p>
      <p>
        Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen. Für Angebote und Rechnungen gelten die jeweils anwendbaren handels- und
        steuerrechtlichen Aufbewahrungsfristen.
      </p>

      <h2>4. Kundenportal</h2>
      <p>
        Für laufende Projekte stellen wir ein Kundenportal bereit, das über einen persönlichen Link erreichbar ist. Dort
        verarbeiten wir Projektdaten sowie die von Ihnen hochgeladenen Inhalte (Texte, Links, Dateien wie Logos und
        Bilder), um das beauftragte Projekt durchzuführen.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Der Zugangslink ist nur Ihnen bekannt, kann
        jederzeit erneuert und deaktiviert werden und ist nicht öffentlich auffindbar.
      </p>

      <h2>5. Zahlungsabwicklung</h2>
      <p>
        Für die Abwicklung von Zahlungen können wir Stripe einsetzen (Stripe Payments Europe Ltd., 1 Grand Canal Street
        Lower, Grand Canal Dock, Dublin, Irland). Wenn Sie einen Zahlungsvorgang starten, werden die dafür erforderlichen
        Daten an Stripe übermittelt und dort im Rahmen der Zahlungsabwicklung verarbeitet. Vollständige Zahlungsdaten wie
        Kartennummern erhalten wir nicht.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Weitere Informationen finden Sie in der Datenschutzerklärung von
        Stripe unter stripe.com/de/privacy.
      </p>

      <h2>6. Eingesetzte technische Dienstleister</h2>
      <p>Zur Bereitstellung dieser Website und der zugehörigen Systeme setzen wir insbesondere folgende Anbieter ein:</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (USA) — Hosting, Auslieferung der Website, serverseitige Funktionen und
          Dateispeicherung über Vercel Blob.
        </li>
        <li>
          <strong>Neon Inc.</strong> (USA) — PostgreSQL-Datenbank für Anfragen, Projekte, Kundenportal, Angebote und
          Rechnungsdaten.
        </li>
        <li>
          <strong>Stripe Payments Europe Ltd.</strong> (Dublin, Irland) — optionale Zahlungsabwicklung, siehe Abschnitt 5.
        </li>
      </ul>
      <p>
        Soweit ein Dienstleister personenbezogene Daten in unserem Auftrag verarbeitet, wird er auf Grundlage der nach
        Art. 28 DSGVO erforderlichen Vereinbarungen eingesetzt. Soweit personenbezogene Daten in Staaten außerhalb der
        EU bzw. des EWR übermittelt werden, werden die jeweils erforderlichen Garantien für Drittlandübermittlungen
        eingesetzt, insbesondere die Standardvertragsklauseln der EU-Kommission, soweit diese erforderlich sind.
      </p>

      <h2>7. Cookies und Reichweitenmessung</h2>
      <p>
        Diese Website setzt keine Cookies zu Analyse-, Marketing- oder Trackingzwecken und bindet keine externen
        Analysedienste ein. Im Administrationsbereich wird ausschließlich ein technisch notwendiges Sitzungs-Cookie
        gesetzt, das für die Anmeldung erforderlich ist und nach dem Ende der Sitzung entfällt. Eine Einwilligung nach §
        25 Abs. 1 TDDDG ist hierfür nicht erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
      </p>

      <h2>8. Ihre Rechte</h2>
      <p>Sie haben nach der DSGVO insbesondere folgende Rechte:</p>
      <ul>
        <li>Auskunft über die zu Ihrer Person verarbeiteten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)</li>
      </ul>
      <p>
        Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an {field(company.email)}. Beruht eine Verarbeitung auf
        Ihrer Einwilligung, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.
      </p>

      <h2>9. Beschwerderecht bei einer Aufsichtsbehörde</h2>
      <p>
        Unbeschadet anderweitiger Rechtsbehelfe steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde
        zu, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen
        Verstoßes (Art. 77 DSGVO).
      </p>

      <h2>10. Änderungen dieser Erklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, sobald sich die zugrunde liegende Datenverarbeitung oder die
        Rechtslage ändert.
      </p>

      <p>
        <a className="ghost" href="/">
          ← Zurück
        </a>
      </p>
    </main>
  );
}
