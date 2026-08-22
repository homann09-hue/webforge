import type { Metadata } from "next";
import HomeMotion from "@/components/home-motion";
import LeadForm from "@/components/lead-form";
import ShowcaseLab from "@/components/showcase-lab";
import { isLegalComplete } from "@/lib/company";
import styles from "./home-experience.module.css";

export const metadata: Metadata = {
  title: "WebForge — Moderne Websites für Unternehmen",
  description:
    "WebForge erstellt moderne Websites mit Anfrageformularen, Bestellsystemen, Kundenbereichen und praktischen Funktionen für Unternehmen.",
  alternates: { canonical: "/" },
};

const capabilities = [
  [
    "01",
    "Professioneller Auftritt",
    "Eine moderne Website, die zu Ihrem Unternehmen passt und auf Handy, Tablet und Computer sauber funktioniert.",
    "#c9ff4b",
  ],
  [
    "02",
    "Online verkaufen oder Bestellungen annehmen",
    "Produkte, Varianten, Warenkorb und Bestellablauf direkt auf Ihrer eigenen Website – ohne unnötige Umwege.",
    "#ff6b42",
  ],
  [
    "03",
    "Kundenbereich",
    "Kunden können Projekte, Dateien, Angebote oder den aktuellen Stand bequem online ansehen.",
    "#86a8ff",
  ],
  [
    "04",
    "Weniger Arbeit im Alltag",
    "Anfragen, Formulare, Benachrichtigungen und Abläufe können so verbunden werden, dass weniger manuell erledigt werden muss.",
    "#e38bff",
  ],
];

const demos = [
  {
    number: "01",
    type: "HANDWERK",
    name: "Nordwerk",
    copy: "Beispiel für einen Handwerksbetrieb mit Leistungen, Referenzen, Anfrageformular und einem Rechner für eine erste Kosteneinschätzung.",
    href: "/demo/handwerk",
    features: ["Kostenrechner", "Referenzen", "Projektablauf", "Anfrageformular"],
    visual: styles.craftVisual,
    ui: ["AKTUELLES PROJEKT", "Sanierung · 180 m²", "82%"],
  },
  {
    number: "02",
    type: "LIEFERDIENST",
    name: "Forno 37",
    copy: "Beispiel für einen Lieferdienst mit Speisekarte, Größen, Extras, Warenkorb und Bestellstatus.",
    href: "/demo/gastro",
    features: ["Speisekarte", "Extras", "Warenkorb", "Bestellstatus"],
    visual: styles.foodVisual,
    ui: ["BESTELLUNG", "Burrata Club · L", "13:42"],
  },
  {
    number: "03",
    type: "EINZELHANDEL",
    name: "Blütenliebe",
    copy: "Beispiel für ein Blumenatelier mit Sortiment und einem einfachen Strauß-Konfigurator für Anlass, Stil, Farben und Größe.",
    href: "/demo/blumen",
    features: ["Strauß zusammenstellen", "Sortiment", "Vorschau", "Anfrage"],
    visual: styles.flowerVisual,
    ui: ["STRAUSS PLANEN", "Rosé Signature", "39 €"],
  },
];

const packages = [
  {
    name: "Starter",
    price: "399 €",
    text: "Für kleine Unternehmen, die schnell mit einer professionellen Website starten möchten.",
    checkout: "https://buy.stripe.com/aFa9AT6HI9EO470cMCbV600",
    features: ["Eine moderne Seite", "Für Handy & Computer", "Kontaktformular", "Grundlegende Suchmaschinen-Optimierung"],
  },
  {
    name: "Business",
    price: "699 €",
    text: "Für Unternehmen mit mehreren Leistungen oder Bereichen und einer umfangreicheren Website.",
    checkout: "https://buy.stripe.com/7sY8wP8PQdV46f83c2bV601",
    popular: true,
    features: ["Mehrere Seiten", "Individuelle Bereiche", "Klare Anfragewege", "Erweiterte Suchmaschinen-Optimierung"],
  },
  {
    name: "Pro",
    price: "ab 1.249 €",
    text: "Für Unternehmen, die mehr als eine normale Website brauchen – zum Beispiel Bestellungen, Kundenbereiche oder Rechner.",
    checkout: "https://buy.stripe.com/dRm00jfee3gqfPIcMCbV602",
    features: ["Bestellsysteme oder Kundenbereiche", "Rechner & Konfiguratoren", "Automatische Abläufe", "Individuelle Funktionen"],
  },
];

export default function Home() {
  const canSell = isLegalComplete();

  return (
    <main className={styles.home} data-home>
      <HomeMotion />
      <div className={styles.noise} aria-hidden="true" />

      <nav className={styles.nav}>
        <a className={styles.brand} href="#top" aria-label="WebForge Startseite">
          <span className={styles.brandMark}>WF</span>
          <b>WebForge</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#lab">Was ist möglich?</a>
          <a href="#demos">Beispiele</a>
          <a href="#system">Leistungen</a>
          <a href="#preise">Preise</a>
        </div>
        <a className={styles.navCta} href="#kontakt">
          Website anfragen ↗
        </a>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy} data-reveal>
          <div className={styles.status}>
            <i /> Websites · Bestellungen · Kundenbereiche · Automatische Abläufe
          </div>
          <h1>
            Eine Website, die <em>mehr für Sie erledigt.</em>
          </h1>
          <p className={styles.heroLead}>
            WebForge erstellt moderne Websites für Unternehmen. Auf Wunsch nicht nur mit Text und Bildern, sondern auch
            mit Bestellungen, Rechnern, Kundenbereichen und anderen Funktionen, die im Alltag wirklich helfen.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#demos">
              Beispiele ansehen ↗
            </a>
            <a className={styles.secondary} href="#kontakt">
              Kostenlosen Entwurf anfragen
            </a>
          </div>
          <div className={styles.heroStats}>
            <div>
              <b>3</b>
              <span>interaktive Beispiel-Websites</span>
            </div>
            <div>
              <b>399 €</b>
              <span>ab Einstieg</span>
            </div>
            <div>
              <b>100%</b>
              <span>auf Ihr Unternehmen angepasst</span>
            </div>
          </div>
        </div>

        <div className={styles.heroStage} data-reveal data-tilt>
          <div className={styles.orbit} />
          <div className={styles.orbit} />
          <div className={styles.stageCore}>
            <div className={styles.stageTop}>
              <div className={styles.stageDots}>
                <i />
                <i />
                <i />
              </div>
              <span>WEBFORGE / WEBSITE</span>
              <b>LIVE</b>
            </div>
            <div className={styles.stageBody}>
              <small>MODERN · SCHNELL · INDIVIDUELL</small>
              <h2>
                Gut aussehen.
                <br />
                <span>Einfach funktionieren.</span>
              </h2>
              <div className={styles.stageMetricGrid}>
                <article className={styles.stageMetric}>
                  <small>QUALITÄT</small>
                  <b>95</b>
                  <div className={styles.stageMetricOrb} />
                </article>
                <article className={styles.stageMetric}>
                  <small>ANFRAGEWEG</small>
                  <b>KLAR</b>
                  <div className={styles.flow}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </article>
              </div>
            </div>
          </div>
          <div className={`${styles.floatChip} ${styles.chip1}`}>
            <small>TECHNIK</small>
            <b>Schnell & sicher</b>
          </div>
          <div className={`${styles.floatChip} ${styles.chip2}`}>
            <small>ZIEL</small>
            <b>Mehr Anfragen</b>
          </div>
        </div>
      </section>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[...Array(2)]
            .flatMap(() => ["WEBSITES", "BESTELLUNGEN", "KUNDENBEREICHE", "FORMULARE", "RECHNER", "MOBILE", "SEO", "WEBSITES"])
            .map((item, index) => (
              <span key={`${item}-${index}`}>
                {item}
                <i />
              </span>
            ))}
        </div>
      </div>

      <section className={`${styles.section} ${styles.labSection}`} id="lab">
        <div className={styles.shell}>
          <div className={styles.sectionHead} data-reveal>
            <span className={styles.eyebrow}>/ 01 — WAS IST MÖGLICH?</span>
            <div>
              <h2>
                Probieren Sie es <em>direkt aus.</em>
              </h2>
              <p>
                Wählen Sie aus, welche Art Website Sie brauchen. Das Beispiel zeigt, wie unterschiedlich eine Website
                für Dienstleister, Shops oder Kundenbereiche aufgebaut sein kann.
              </p>
            </div>
          </div>
          <div data-reveal>
            <ShowcaseLab />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="system">
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.eyebrow}>/ 02 — WAS WIR BAUEN</span>
          <div>
            <h2>
              Nicht nur schön. <em>Auch praktisch.</em>
            </h2>
            <p>
              Ihre Website soll verständlich sein, Vertrauen schaffen und Kunden schnell zum nächsten Schritt führen –
              zum Beispiel zu einer Anfrage, Bestellung oder Terminbuchung.
            </p>
          </div>
        </div>
        <div className={styles.capGrid}>
          {capabilities.map(([n, title, text, color]) => (
            <article
              className={styles.capCard}
              style={{ "--cap": color } as React.CSSProperties}
              data-reveal
              data-tilt
              key={title}
            >
              <small>{n} / WEBFORGE</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.demoSection}`} id="demos">
        <div className={styles.shell}>
          <div className={styles.sectionHead} data-reveal>
            <span className={styles.eyebrow}>/ 03 — BEISPIEL-WEBSITES</span>
            <div>
              <h2>
                So könnte Ihre Website <em>funktionieren.</em>
              </h2>
              <p>
                Die Beispiele zeigen nicht nur verschiedene Designs, sondern auch verschiedene Funktionen für echte
                Unternehmen.
              </p>
            </div>
          </div>
          <div className={styles.demoGrid}>
            {demos.map((demo) => (
              <article className={styles.demoCard} data-reveal key={demo.name}>
                <div className={styles.demoCopy}>
                  <div>
                    <div className={styles.demoMeta}>
                      <span>{demo.number}</span>
                      <span>{demo.type}</span>
                    </div>
                    <h3>{demo.name}</h3>
                    <p>{demo.copy}</p>
                    <div className={styles.featurePills}>
                      {demo.features.map((feature) => (
                        <span key={feature}>{feature}</span>
                      ))}
                    </div>
                  </div>
                  <a className={styles.demoLink} href={demo.href}>
                    <span>Beispiel öffnen</span>
                    <span>↗</span>
                  </a>
                </div>
                <div className={`${styles.demoVisual} ${demo.visual}`}>
                  <div className={styles.visualUi}>
                    <div>
                      <small>{demo.ui[0]}</small>
                      <b>{demo.ui[1]}</b>
                    </div>
                    <strong>{demo.ui[2]}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="preise">
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.eyebrow}>/ 04 — PREISE</span>
          <div>
            <h2>
              Klarer Einstieg. <em>Mehr nur, wenn Sie es brauchen.</em>
            </h2>
            <p>
              Sie starten mit dem passenden Grundpaket. Zusätzliche Funktionen wie Bestellungen, Kundenbereiche oder
              Rechner kommen nur dazu, wenn sie für Ihr Unternehmen sinnvoll sind.
            </p>
          </div>
        </div>
        <div className={styles.pricingGrid}>
          {packages.map((pkg) => (
            <article className={styles.priceCard} data-popular={Boolean(pkg.popular)} data-reveal key={pkg.name}>
              <div className={styles.priceTop}>
                <span>WEBFORGE / {pkg.name.toUpperCase()}</span>
                {pkg.popular && <b>BELIEBT</b>}
              </div>
              <h3>{pkg.name}</h3>
              <div className={styles.price}>{pkg.price}</div>
              <p>{pkg.text}</p>
              <ul>
                {pkg.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {canSell ? (
                <a href={pkg.checkout}>Paket auswählen ↗</a>
              ) : (
                <span className={styles.disabled}>Nach Anfrage verfügbar</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`}>
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.eyebrow}>/ 05 — SO LÄUFT ES AB</span>
          <div>
            <h2>
              Von der Idee bis zur <em>fertigen Website.</em>
            </h2>
          </div>
        </div>
        <div className={styles.process}>
          {[
            ["01", "Wir klären, was Sie brauchen", "Wir besprechen Ihr Unternehmen, Ihre Kunden und was die Website für Sie erreichen soll."],
            ["02", "Sie sehen einen ersten Entwurf", "Wir legen Aufbau, Stil und die wichtigsten Bereiche fest, bevor alles fertig gebaut wird."],
            ["03", "Wir bauen die Website", "Die Website wird für Handy und Computer umgesetzt und die gewünschten Funktionen werden eingebaut."],
            ["04", "Die Website geht online", "Wir testen alles, veröffentlichen die Seite und können sie auf Wunsch später weiter ausbauen."],
          ].map(([n, title, text]) => (
            <article key={n}>
              <b>{n}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div data-reveal>
            <span className={styles.eyebrow}>/ WEBSITE ANFRAGEN</span>
            <h2>
              Was braucht <em>Ihr Unternehmen?</em>
            </h2>
            <p>
              Schicken Sie uns kurz Ihr Unternehmen und Ihre Kontaktdaten. Wenn bereits eine Website oder ein
              Google-Eintrag vorhanden ist, können Sie den Link direkt mitsenden.
            </p>
          </div>
          <div className={styles.formWrap} data-reveal>
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <div>
          <strong>WebForge</strong>
          <br /> Moderne Websites für Unternehmen
        </div>
        <div>Deutschland · Remote</div>
        <div className={styles.footerLinks}>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="#top">Nach oben ↑</a>
        </div>
      </footer>
    </main>
  );
}
