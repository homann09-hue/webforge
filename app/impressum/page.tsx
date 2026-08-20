import type { Metadata } from "next";
import { company, field, isLegalComplete } from "@/lib/company";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung nach § 5 DDG.",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: true },
};

export default function Impressum() {
  const incomplete = !isLegalComplete();

  return (
    <main className="shell section">
      <div className="eyebrow">Rechtliches</div>
      <h1>Impressum</h1>

      {incomplete && (
        <p>
          <strong>
            Hinweis: Dieses Impressum ist noch unvollständig. Tragen Sie die tatsächlichen Unternehmensdaten in
            lib/company.ts ein, bevor die Seite öffentlich beworben wird.
          </strong>
        </p>
      )}

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {field(company.legalName)}
        <br />
        {field(company.street)}
        <br />
        {field(company.postalCode)} {field(company.city)}
        <br />
        {company.country}
      </p>

      <h2>Vertreten durch</h2>
      <p>{field(company.representative)}</p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: {field(company.email)}
        <br />
        Telefon: {field(company.phone)}
      </p>

      {(company.registerCourt || company.registerNumber) && (
        <>
          <h2>Registereintrag</h2>
          <p>
            Registergericht: {field(company.registerCourt)}
            <br />
            Registernummer: {field(company.registerNumber)}
          </p>
        </>
      )}

      <h2>Umsatzsteuer</h2>
      <p>
        {company.smallBusiness
          ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und daher nicht in Rechnungen ausgewiesen."
          : company.vatId
            ? `Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: ${company.vatId}`
            : "[Umsatzsteuer-Identifikationsnummer oder Hinweis auf die Kleinunternehmerregelung eintragen]"}
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {field(company.representative)}
        <br />
        {field(company.street)}
        <br />
        {field(company.postalCode)} {field(company.city)}
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <p>
        <a className="ghost" href="/">
          ← Zurück
        </a>
      </p>
    </main>
  );
}
