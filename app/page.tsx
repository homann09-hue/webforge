import LeadForm from "@/components/lead-form";
import type { Metadata } from "next";
import { isLegalComplete } from "@/lib/company";

import styles from "./home-modern.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const packages = [
  {
    name: "Starter",
    price: "399 €",
    checkout: "https://buy.stripe.com/aFa9AT6HI9EO470cMCbV600",
    features: [
      "Moderne One-Page Website",
      "Smartphone & Desktop",
      "Kontakt, Öffnungszeiten & Maps",
      "SEO-Grundoptimierung",
    ],
  },
  {
    name: "Business",
    price: "699 €",
    checkout: "https://buy.stripe.com/7sY8wP8PQdV46f83c2bV601",
    popular: true,
    features: [
      "Alles aus Starter",
      "Mehrere individuelle Seiten",
      "Leistungen oder Speisekarte",
      "Conversion-Optimierung",
      "Erweiterte SEO-Basis",
    ],
  },
  {
    name: "Pro",
    price: "1.249 €",
    checkout: "https://buy.stripe.com/dRm00jfee3gqfPIcMCbV602",
    features: [
      "Alles aus Business",
      "Anfrage- & Bestellfunktionen",
      "Individuelle Funktionen",
      "Admin-Optionen",
      "Priorisierte Umsetzung",
    ],
  },
];
const maintenanceCheckout = "https://buy.stripe.com/28EbJ18PQg3ccDwaEubV603";
const services = [
  {
    icon: "01",
    title: "Strategie vor Design",
    text: "Wir bauen nicht einfach hübsch. Struktur, Zielgruppe und gewünschte Anfragen werden zuerst klar definiert.",
  },
  {
    icon: "02",
    title: "Modern auf jedem Gerät",
    text: "Schnelle, responsive Websites mit klarer Hierarchie, sauberer Typografie und konsequenter Nutzerführung.",
  },
  {
    icon: "03",
    title: "Funktionen, die verkaufen",
    text: "Formulare, Bestellsysteme, Kundenportale, Admin-Bereiche und individuelle Abläufe statt bloßer Visitenkarte.",
  },
];
const demos = [
  {
    type: "Handwerk",
    name: "Nordwerk Dach & Bau",
    text: "Komplette Handwerker-Website mit Leistungen, Referenzen, Projektablauf und Anfrageformular.",
    href: "/demo/handwerk",
    visual: styles.demoCraft,
  },
  {
    type: "Lieferdienst",
    name: "Forno 37",
    text: "Vollständige Lieferdienst-Demo mit Speisekarte, Größen, Toppings, Warenkorb und Demo-Checkout.",
    href: "/demo/gastro",
    visual: styles.demoFood,
  },
  {
    type: "Blumenladen",
    name: "Blütenliebe",
    text: "Elegante Shop-Demo für einen kleinen Blumenladen mit Sortiment, Anlässen und Anfrageflow.",
    href: "/demo/blumen",
    visual: styles.demoFlower,
  },
];

export default function Home() {
  // Selling from a page whose imprint still carries placeholders is a §5 DDG
  // problem. Until lib/company.ts holds real data, the checkout links are
  // replaced by a link to the contact form.
  const canSell = isLegalComplete();

  return (
    <main className={styles.home}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.brand} href="#top">
          <span>W</span>WebForge
        </a>
        <div className={styles.navLinks}>
          <a href="#leistungen">Leistungen</a>
          <a href="#demos">Demos</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#preise">Preise</a>
        </div>
        <a className={styles.navCta} href="#kontakt">
          Projekt anfragen
        </a>
      </nav>
      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div>
          <div className={styles.kicker}>Websites für lokale Unternehmen</div>
          <h1>
            Websites, die nicht nur gut aussehen. <em>Sondern verkaufen.</em>
          </h1>
          <p className={styles.heroLead}>
            WebForge entwickelt moderne Unternehmenswebsites mit klarer Strategie, starken Demo-Konzepten und echten
            Funktionen – vom Handwerksbetrieb bis zum Lieferdienst mit Bestellsystem.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#kontakt">
              Kostenlosen Entwurf anfragen
            </a>
            <a className={styles.secondary} href="#demos">
              3 Live-Demos ansehen
            </a>
          </div>
          <div className={styles.trustRow}>
            <span>✓ Transparente Festpreise</span>
            <span>✓ Persönliche Umsetzung</span>
            <span>✓ Mobile First</span>
            <span>✓ Auf Wunsch mit Admin-System</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.dashboard}>
            <div className={styles.browserBar}>
              <i />
              <i />
              <i />
              <span>kunde.webforge.de</span>
            </div>
            <div className={styles.screen}>
              <small>MODERNE UNTERNEHMENSWEBSITE</small>
              <p className={styles.screenTitle}>Ein Auftritt, der professionell wirkt und klar führt.</p>
              <p>Leistungen, Vertrauen, Anfrage und Funktionen in einem sauberen System.</p>
              <div className={styles.screenCard}>
                <small>MEHR ALS DESIGN</small>
                <b>Conversion</b>
                <span>Klare Wege zur Anfrage</span>
              </div>
            </div>
          </div>
          <div className={`${styles.floating} ${styles.floatOne}`}>
            <small>UMSETZUNG</small>
            <b>ab 399 €</b>
          </div>
          <div className={`${styles.floating} ${styles.floatTwo}`}>
            <small>LIVE-DEMO</small>
            <b>3 Branchen</b>
          </div>
        </div>
      </section>
      <section className={styles.metricStrip}>
        <div className={`${styles.metricStripInner} ${styles.shell}`}>
          <article>
            <b>3</b>
            <span>vollständige Live-Demos</span>
          </article>
          <article>
            <b>399 €</b>
            <span>Einstiegspreis</span>
          </article>
          <article>
            <b>100%</b>
            <span>individuell anpassbar</span>
          </article>
          <article>
            <b>1</b>
            <span>Ansprechpartner</span>
          </article>
        </div>
      </section>
      <section className={`${styles.section} ${styles.shell}`} id="leistungen">
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.kicker}>Was WebForge anders macht</div>
            <h2>Keine Baukasten-Seite. Ein digitales Verkaufssystem.</h2>
          </div>
          <p>
            Jede Website bekommt ein klares Ziel: Vertrauen aufbauen, Leistung verständlich machen und Besucher zur
            nächsten sinnvollen Aktion führen.
          </p>
        </div>
        <div className={styles.serviceGrid}>
          {services.map((s) => (
            <article className={styles.serviceCard} key={s.title}>
              <div className={styles.serviceIcon}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={`${styles.demos} ${styles.section}`} id="demos">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.kicker}>Echte Live-Demos</div>
              <h2>Drei Branchen. Drei komplett eigene Erlebnisse.</h2>
            </div>
            <p>
              Keine austauschbaren Templates. Jede Demo zeigt, wie Design, Inhalte und Funktionen an das jeweilige
              Geschäft angepasst werden können.
            </p>
          </div>
          <div className={styles.demoGrid}>
            {demos.map((d) => (
              <article className={styles.demoCard} key={d.name}>
                <div className={`${styles.demoVisual} ${d.visual}`}>
                  <span>{d.type}</span>
                </div>
                <div className={styles.demoCopy}>
                  <small>WEBFORGE LIVE-DEMO</small>
                  <h3>{d.name}</h3>
                  <p>{d.text}</p>
                  <a className={styles.demoButton} href={d.href}>
                    Demo vollständig öffnen →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={`${styles.section} ${styles.shell}`} id="ablauf">
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.kicker}>Einfacher Ablauf</div>
            <h2>Von der Idee bis live – ohne Agentur-Chaos.</h2>
          </div>
          <p>Ein fester Ablauf spart Zeit und verhindert endlose Abstimmungsschleifen.</p>
        </div>
        <div className={styles.processGrid}>
          {[
            ["01", "Kurz kennenlernen", "Unternehmen, Zielgruppe, Leistungen und gewünschte Funktionen klären."],
            ["02", "Richtung zeigen", "Ein erster visueller Entwurf macht Stil und Struktur sofort greifbar."],
            ["03", "Komplett umsetzen", "Responsive Website, Inhalte, Funktionen und technische Basis fertig bauen."],
            ["04", "Live & weiter", "Veröffentlichen, testen und bei Bedarf laufend betreuen."],
          ].map((x) => (
            <article key={x[0]}>
              <b>{x[0]}</b>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={`${styles.pricingWrap} ${styles.section}`} id="preise">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.kicker}>Klare Preise</div>
              <h2>Ein Paket, das zum Projekt passt.</h2>
            </div>
            <p>Keine versteckten Agenturkosten. Der genaue Umfang wird vor Umsetzung klar festgelegt.</p>
          </div>
          <div className={styles.pricingGrid}>
            {packages.map((p) => (
              <article className={`${styles.priceCard} ${p.popular ? styles.featured : ""}`} key={p.name}>
                {p.popular && <div className={styles.badge}>BELIEBT</div>}
                <h3>{p.name}</h3>
                <strong>{p.price}</strong>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                {canSell ? (
                  <a className={styles.priceButton} href={p.checkout} rel="noreferrer">
                    Paket starten →
                  </a>
                ) : (
                  <a className={styles.priceButton} href="#kontakt">
                    Paket anfragen →
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className={styles.care}>
            Optional: Betreuung, Hosting und kleine Änderungen für <strong>99 €/Monat</strong>.{" "}
            {canSell ? (
              <a href={maintenanceCheckout} rel="noreferrer">
                Betreuung starten →
              </a>
            ) : (
              <a href="#kontakt">Betreuung anfragen →</a>
            )}
          </p>
        </div>
      </section>
      <section className={styles.cta} id="kontakt">
        <div className={`${styles.ctaInner} ${styles.shell}`}>
          <div>
            <div className={styles.kicker}>Der erste Schritt kostet nichts</div>
            <h2>Wie könnte Ihre neue Website aussehen?</h2>
            <p>
              Schicken Sie uns Ihr Unternehmen, Ihre aktuelle Website oder einfach eine kurze Beschreibung. Daraus
              entsteht eine konkrete Richtung.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>
      <footer className={`${styles.footer} ${styles.shell}`}>
        <a className={styles.brand} href="#top">
          <span>W</span>WebForge
        </a>
        <p>Moderne Websites, die lokale Unternehmen professionell verkaufen.</p>
        <div className={styles.footerLinks}>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
        </div>
      </footer>
    </main>
  );
}
