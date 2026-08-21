import LeadForm from "@/components/lead-form";
import type { Metadata } from "next";
import { isLegalComplete } from "@/lib/company";
import styles from "./home-modern.module.css";

export const metadata: Metadata = {
  title: "Ovara — Technologie. Innovation. Zukunft.",
  description:
    "Ovara entwickelt moderne Websites, Web-Apps, Mobile-Lösungen, Cloud-Systeme und KI-Automationen für Unternehmen.",
  alternates: { canonical: "/" },
};

const services = [
  ["01", "Websites", "Hochwertige Unternehmensseiten, Landingpages und Shops mit klarer Conversion-Strategie."],
  ["02", "Web Apps", "Individuelle Kundenportale, Dashboards, Buchungs- und Bestellsysteme für echte Geschäftsprozesse."],
  ["03", "Mobile", "Mobile-first Anwendungen und installierbare Apps, die sich sauber in vorhandene Systeme einfügen."],
  ["04", "Cloud", "Moderne Backends, Datenbanken, Authentifizierung und skalierbare Infrastruktur."],
  ["05", "KI & Automation", "Automatisierte Workflows, intelligente Assistenten und KI-Funktionen, die Zeit und Kosten reduzieren."],
];

const packages = [
  {
    name: "Starter",
    price: "399 €",
    text: "Für einen starken professionellen Einstieg.",
    checkout: "https://buy.stripe.com/aFa9AT6HI9EO470cMCbV600",
    features: ["Moderne One-Page Website", "Mobile & Desktop", "Kontakt & SEO-Basis", "Individuelles Ovara-Design"],
  },
  {
    name: "Business",
    price: "699 €",
    text: "Für Unternehmen, die mehr als eine digitale Visitenkarte brauchen.",
    checkout: "https://buy.stripe.com/7sY8wP8PQdV46f83c2bV601",
    popular: true,
    features: ["Mehrere individuelle Seiten", "Leistungen / Speisekarte / Portfolio", "Conversion-Optimierung", "Erweiterte Funktionen"],
  },
  {
    name: "Custom",
    price: "ab 1.249 €",
    text: "Für Apps, Portale, Automationen und individuelle Systeme.",
    checkout: "https://buy.stripe.com/dRm00jfee3gqfPIcMCbV602",
    features: ["Individuelle Web-App", "Admin- & Kundenbereiche", "APIs & Automationen", "Technische Projektplanung"],
  },
];

const process = [
  ["01", "Verstehen", "Wir klären Ziel, Zielgruppe, Funktionen und den wirtschaftlichen Zweck des Projekts."],
  ["02", "Konzipieren", "Struktur, Nutzerführung, Designrichtung und technische Architektur werden festgelegt."],
  ["03", "Bauen", "Ovara setzt Design und Funktionen sauber, responsive und performant um."],
  ["04", "Launch", "Nach Tests geht das Projekt live. Danach kann es erweitert und weiterentwickelt werden."],
];

export default function Home() {
  const canSell = isLegalComplete();

  return (
    <main className={styles.home}>
      <div className={styles.ambient} aria-hidden="true" />

      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.brand} href="#top" aria-label="Ovara Startseite">
          <span className={styles.brandMark}>OVARA</span>
        </a>
        <div className={styles.navLinks}>
          <a href="#leistungen">Leistungen</a>
          <a href="#projekte">Projekte</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#preise">Preise</a>
        </div>
        <a className={styles.navCta} href="#kontakt">Projekt starten</a>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Technologie · Innovation · Zukunft</div>
          <h1>
            Wir entwickeln digitale Produkte, <span>die funktionieren.</span>
          </h1>
          <p className={styles.heroLead}>
            Ovara verbindet starkes Design mit sauberer Softwareentwicklung. Von der Website bis zur individuellen
            Web-App, vom Kundenportal bis zur KI-Automation.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#kontakt">Projekt besprechen</a>
            <a className={styles.secondary} href="#leistungen">Leistungen ansehen</a>
          </div>
          <div className={styles.contactMini}>
            <a href="tel:+4915146227737">0151 46227737</a>
            <a href="mailto:homann@ovara.de">homann@ovara.de</a>
            <a href="https://ovara.de">ovara.de</a>
          </div>
        </div>

        <div className={styles.heroOrbital} aria-hidden="true">
          <div className={styles.orbitOne} />
          <div className={styles.orbitTwo} />
          <div className={styles.glowCore} />
          <div className={`${styles.floatCard} ${styles.cardOne}`}>
            <span>WEB APPS</span><b>Individuell gebaut</b>
          </div>
          <div className={`${styles.floatCard} ${styles.cardTwo}`}>
            <span>KI & AUTOMATION</span><b>Weniger Handarbeit</b>
          </div>
          <div className={`${styles.floatCard} ${styles.cardThree}`}>
            <span>OVARA</span><b>Digital by design.</b>
          </div>
        </div>
      </section>

      <section className={styles.capabilityStrip}>
        <div className={`${styles.shell} ${styles.capabilityInner}`}>
          {[["</>", "Software"], ["▥", "Web Apps"], ["▯", "Mobile"], ["☁", "Cloud"], ["✦", "KI & Automation"]].map(([icon, label]) => (
            <div key={label}><strong>{icon}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="leistungen">
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.kicker}>Was wir entwickeln</div>
            <h2>Keine Standardlösung. Sondern das System, das zum Geschäft passt.</h2>
          </div>
          <p>
            Ovara übernimmt Design, Entwicklung und technische Umsetzung aus einer Hand. Der Fokus liegt auf Produkten,
            die professionell wirken, einfach zu bedienen sind und einen klaren geschäftlichen Zweck erfüllen.
          </p>
        </div>
        <div className={styles.serviceGrid}>
          {services.map(([number, title, text]) => (
            <article className={styles.serviceCard} key={title}>
              <span>{number}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.showcase} id="projekte">
        <div className={`${styles.shell} ${styles.showcaseGrid}`}>
          <div>
            <div className={styles.kicker}>Ovara Projects</div>
            <h2>Eine technische Basis für viele digitale Produkte.</h2>
            <p>
              Websites, Plattformen, interne Tools, SaaS-Produkte und Automationen können unter einer gemeinsamen
              technischen Linie entstehen. Dadurch lassen sich neue Projekte schneller entwickeln und bestehende Systeme
              gezielt erweitern.
            </p>
            <a className={styles.secondary} href="#kontakt">Projektidee anfragen</a>
          </div>
          <div className={styles.productPanel}>
            <div className={styles.productTop}><span>OVARA / SYSTEM</span><span>LIVE ARCHITECTURE</span></div>
            <div className={styles.productTitle}>Design. Code. Automation.</div>
            <div className={styles.moduleGrid}>
              <div><small>FRONTEND</small><b>Next.js</b></div>
              <div><small>BACKEND</small><b>Cloud APIs</b></div>
              <div><small>DATA</small><b>Postgres</b></div>
              <div><small>AI</small><b>Automation</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="ablauf">
        <div className={styles.sectionHead}>
          <div><div className={styles.kicker}>Vom ersten Gespräch bis live</div><h2>Klare Schritte. Keine Agentur-Komplexität.</h2></div>
          <p>Jedes Projekt wird in überschaubare Phasen zerlegt. So bleibt jederzeit klar, was gebaut wird und was als Nächstes passiert.</p>
        </div>
        <div className={styles.processGrid}>
          {process.map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className={styles.pricing} id="preise">
        <div className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionHead}>
            <div><div className={styles.kicker}>Preise</div><h2>Einfach starten. Später erweitern.</h2></div>
            <p>Die Paketpreise decken typische Einstiegsprojekte ab. Individuelle Web-Apps und Automationen werden nach Umfang kalkuliert.</p>
          </div>
          <div className={styles.pricingGrid}>
            {packages.map((p) => (
              <article className={`${styles.priceCard} ${p.popular ? styles.featured : ""}`} key={p.name}>
                {p.popular && <span className={styles.badge}>EMPFOHLEN</span>}
                <h3>{p.name}</h3><strong>{p.price}</strong><p>{p.text}</p>
                <ul>{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
                <a className={styles.priceButton} href={canSell ? p.checkout : "#kontakt"} rel="noreferrer">
                  {canSell ? "Paket starten" : "Paket anfragen"} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div>
            <div className={styles.kicker}>Projekt starten</div>
            <h2>Was soll Ovara für dich bauen?</h2>
            <p>Kurze Beschreibung reicht. Wir melden uns mit einer konkreten Richtung für Design, Funktionen und Umsetzung.</p>
            <div className={styles.contactDetails}>
              <a href="tel:+4915146227737">0151 46227737</a>
              <a href="mailto:homann@ovara.de">homann@ovara.de</a>
              <span>ovara.de</span>
            </div>
          </div>
          <LeadForm />
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <a className={styles.brandMark} href="#top">OVARA</a>
        <p>Technologie · Innovation · Zukunft</p>
        <div><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a></div>
      </footer>
    </main>
  );
}
