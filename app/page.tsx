import type { Metadata } from "next";
import HomeMotion from "@/components/home-motion";
import LeadForm from "@/components/lead-form";
import { isLegalComplete } from "@/lib/company";
import styles from "./home-v2.module.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const packages = [
  {
    name: "Starter",
    price: "399 €",
    checkout: "https://buy.stripe.com/aFa9AT6HI9EO470cMCbV600",
    text: "Für kleine Unternehmen, die sofort professionell auftreten wollen.",
    features: ["One-Page Experience", "Mobile & Desktop", "Kontakt, Maps & SEO", "Performance-Basis"],
  },
  {
    name: "Business",
    price: "699 €",
    checkout: "https://buy.stripe.com/7sY8wP8PQdV46f83c2bV601",
    text: "Für Unternehmen mit mehreren Leistungen, Seiten und klaren Conversion-Zielen.",
    popular: true,
    features: ["Mehrere individuelle Seiten", "Conversion-System", "Erweiterte SEO-Basis", "Individuelle Komponenten"],
  },
  {
    name: "Pro",
    price: "1.249 €",
    checkout: "https://buy.stripe.com/dRm00jfee3gqfPIcMCbV602",
    text: "Für digitale Produkte, Bestellflows, Portale und anspruchsvolle Abläufe.",
    features: ["Bestell- & Anfrageflows", "Admin-Optionen", "Portale & Automationen", "Priorisierte Umsetzung"],
  },
];
const maintenanceCheckout = "https://buy.stripe.com/28EbJ18PQg3ccDwaEubV603";
const capabilities = [
  {
    number: "01",
    title: "Digital Experiences",
    text: "Marke, Typografie, Motion und Interaktion greifen als ein System ineinander – nicht als zufällige Effekte.",
    className: styles.capExperience,
  },
  {
    number: "02",
    title: "Commerce & Orders",
    text: "Produkte, Varianten, Warenkorb und Checkout-Flows so aufgebaut, dass Kunden nicht suchen müssen.",
    className: styles.capCommerce,
  },
  {
    number: "03",
    title: "Portals & Operations",
    text: "Kundenportale, Admin-Flächen, Angebote, Projekte und Rechnungen als echte digitale Prozesse.",
    className: styles.capPortal,
  },
  {
    number: "04",
    title: "Performance",
    text: "Schnelle Ladezeiten, klare Informationsarchitektur und technische Qualität als Teil des Designs.",
    className: styles.capPerformance,
  },
];
const demos = [
  {
    type: "Handwerk",
    name: "Nordwerk Dach & Bau",
    text: "Vertrauen, Leistungen, Referenzen und Anfrageflow in einer starken Handwerker-Experience.",
    href: "/demo/handwerk",
    accent: styles.demoCraft,
  },
  {
    type: "Lieferdienst",
    name: "Forno 37",
    text: "Speisekarte, Größen, Toppings, Warenkorb und Checkout als vollständiger digitaler Bestellflow.",
    href: "/demo/gastro",
    accent: styles.demoFood,
  },
  {
    type: "Retail",
    name: "Blütenliebe",
    text: "Editorialer Markenauftritt mit Sortiment, Anlässen, Größenwahl und Anfrageprozess.",
    href: "/demo/blumen",
    accent: styles.demoFlower,
  },
];

export default function Home() {
  const canSell = isLegalComplete();
  return (
    <main className={styles.home} data-home>
      <HomeMotion />
      <div className={styles.cursorGlow} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.scrollProgress} aria-hidden="true" />
      <nav className={styles.navWrap}>
        <div className={`${styles.nav} ${styles.shell}`}>
          <a className={styles.brand} href="#top" aria-label="WebForge Startseite">
            <span className={styles.brandMark}>W</span>
            <span className={styles.brandText}>WebForge</span>
          </a>
          <div className={styles.navLinks}>
            <a href="#system">System</a>
            <a href="#demos">Demos</a>
            <a href="#prozess">Prozess</a>
            <a href="#preise">Preise</a>
          </div>
          <a className={styles.navCta} href="#kontakt">
            Projekt starten <span>↗</span>
          </a>
        </div>
      </nav>
      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy} data-reveal>
          <div className={styles.availability}>
            <span className={styles.liveDot} />
            Neue Projekte verfügbar · Deutschlandweit
          </div>
          <h1 className={styles.heroTitle}>
            <span>Websites, die</span>
            <span className={styles.heroAccent}>nicht stillstehen.</span>
          </h1>
          <p className={styles.heroLead}>
            WebForge baut digitale Auftritte, die zeigen, was heute möglich ist: starke Markenführung, flüssige Motion,
            echte Funktionen und eine User Experience, die Besucher in Kunden verwandelt.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#kontakt">
              Kostenlosen Entwurf anfragen <span>↗</span>
            </a>
            <a className={styles.secondary} href="#demos">
              Live-Erlebnisse ansehen <span>↓</span>
            </a>
          </div>
          <div className={styles.heroProof}>
            <div>
              <b>3</b>
              <span>Live-Demos</span>
            </div>
            <div>
              <b>399 €</b>
              <span>Einstieg</span>
            </div>
            <div>
              <b>100%</b>
              <span>maßgeschneidert</span>
            </div>
          </div>
        </div>
        <div className={styles.heroStage} data-reveal data-tilt>
          <div className={styles.stageHalo} />
          <div className={styles.browserShell}>
            <div className={styles.browserTop}>
              <div className={styles.browserDots}>
                <i />
                <i />
                <i />
              </div>
              <div className={styles.addressBar}>webforge / live-experience</div>
              <span className={styles.browserStatus}>LIVE</span>
            </div>
            <div className={styles.browserBody}>
              <div className={styles.miniNav}>
                <span className={styles.miniLogo}>WF</span>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
                <b>Start ↗</b>
              </div>
              <div className={styles.miniHero}>
                <small>NEXT-GEN DIGITAL</small>
                <strong>
                  Built to move.
                  <br />
                  Built to convert.
                </strong>
                <p>Strategy · Design · Product</p>
              </div>
              <div className={styles.miniGrid}>
                <div className={styles.miniCardA}>
                  <span>98</span>
                  <small>PERFORMANCE</small>
                </div>
                <div className={styles.miniCardB}>
                  <i />
                  <i />
                  <i />
                  <b>Live system</b>
                </div>
                <div className={styles.miniCardC}>
                  <span>↗</span>
                  <small>CONVERSION FLOW</small>
                </div>
              </div>
              <div className={styles.miniTicker}>
                <span>DESIGN</span>
                <span>MOTION</span>
                <span>COMMERCE</span>
                <span>PORTALS</span>
              </div>
            </div>
          </div>
          <div className={`${styles.stageChip} ${styles.stageChipOne}`}>
            <small>INTERACTION</small>
            <b>60 FPS</b>
          </div>
          <div className={`${styles.stageChip} ${styles.stageChipTwo}`}>
            <small>EXPERIENCE</small>
            <b>Premium</b>
          </div>
          <div className={`${styles.stageChip} ${styles.stageChipThree}`}>
            <span className={styles.pulseIcon}>●</span>
            <b>Live System</b>
          </div>
        </div>
      </section>
      <section className={styles.marquee} aria-label="WebForge Leistungen">
        <div className={styles.marqueeTrack}>
          {[
            "STRATEGY",
            "DESIGN",
            "MOTION",
            "WEB APPS",
            "COMMERCE",
            "PORTALS",
            "AUTOMATION",
            "SEO",
            "PERFORMANCE",
            "STRATEGY",
            "DESIGN",
            "MOTION",
            "WEB APPS",
            "COMMERCE",
            "PORTALS",
            "AUTOMATION",
          ].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              <i>✦</i>
            </span>
          ))}
        </div>
      </section>
      <section className={`${styles.section} ${styles.shell}`} id="system">
        <div className={styles.sectionIntro} data-reveal>
          <span className={styles.eyebrow}>/ 01 — DAS SYSTEM</span>
          <div>
            <h2>
              Design ist nur dann stark,
              <br />
              <em>wenn es etwas tut.</em>
            </h2>
            <p>
              Unsere Website ist selbst der Beweis: Motion, Interface, Information und Conversion werden als ein
              zusammenhängendes Produkt gedacht.
            </p>
          </div>
        </div>
        <div className={styles.capGrid}>
          {capabilities.map((cap, index) => (
            <article className={`${styles.capCard} ${cap.className}`} data-reveal data-tilt key={cap.title}>
              <div className={styles.capHead}>
                <span>{cap.number}</span>
                <small>WEBFORGE CAPABILITY</small>
              </div>
              <div className={styles.capVisual} aria-hidden="true">
                {index === 0 && (
                  <>
                    <div className={styles.orbitOne} />
                    <div className={styles.orbitTwo} />
                    <b className={styles.orbitCore}>WF</b>
                  </>
                )}
                {index === 1 && (
                  <>
                    <div className={styles.orderItem}>
                      <span>01</span>
                      <b>Product</b>
                      <small>+ 24,90 €</small>
                    </div>
                    <div className={styles.orderItem}>
                      <span>02</span>
                      <b>Variant</b>
                      <small>+ 3,50 €</small>
                    </div>
                    <div className={styles.orderBar}>
                      <i />
                      <b>Checkout</b>
                      <span>→</span>
                    </div>
                  </>
                )}
                {index === 2 && (
                  <>
                    <div className={styles.portalSidebar}>
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className={styles.portalPanel}>
                      <small>PROJECT</small>
                      <b>82%</b>
                      <div>
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                    <div className={styles.portalPanelSmall}>
                      <span>4</span>
                      <small>OPEN TASKS</small>
                    </div>
                  </>
                )}
                {index === 3 && (
                  <>
                    <div className={styles.scoreRing}>
                      <span>98</span>
                      <small>SCORE</small>
                    </div>
                    <div className={styles.performanceBars}>
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </>
                )}
              </div>
              <div className={styles.capCopy}>
                <h3>{cap.title}</h3>
                <p>{cap.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.showcase} id="demos">
        <div className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionIntro} data-reveal>
            <span className={styles.eyebrow}>/ 02 — LIVE EXPERIENCES</span>
            <div>
              <h2>
                Drei Branchen.
                <br />
                <em>Drei eigene Welten.</em>
              </h2>
              <p>
                Kein Template-Feeling. Jede Demo besitzt ein eigenes visuelles System, eigene Interaktionen und einen
                zur Branche passenden Conversion-Flow.
              </p>
            </div>
          </div>
          <div className={styles.demoStack}>
            {demos.map((demo, index) => (
              <article className={`${styles.demoPanel} ${demo.accent}`} data-reveal data-tilt key={demo.name}>
                <div className={styles.demoMeta}>
                  <span>0{index + 1}</span>
                  <small>{demo.type}</small>
                </div>
                <div className={styles.demoPreview}>
                  {index === 0 && (
                    <div className={styles.craftPreview}>
                      <div className={styles.previewNav}>
                        <b>NORDWERK</b>
                        <span>ANFRAGE ↗</span>
                      </div>
                      <strong>
                        Dächer,
                        <br />
                        die bleiben.
                      </strong>
                      <div className={styles.previewStats}>
                        <span>
                          <b>24h</b>
                          <small>Reaktion</small>
                        </span>
                        <span>
                          <b>18+</b>
                          <small>Jahre</small>
                        </span>
                      </div>
                    </div>
                  )}
                  {index === 1 && (
                    <div className={styles.foodPreview}>
                      <div className={styles.foodNav}>
                        <b>FORNO 37</b>
                        <span>🛒 2</span>
                      </div>
                      <strong>
                        Hot.
                        <br />
                        Fast.
                        <br />
                        Forno.
                      </strong>
                      <div className={styles.foodOrder}>
                        <span>Pizza No. 7</span>
                        <b>14,90 €</b>
                        <i>+</i>
                      </div>
                    </div>
                  )}
                  {index === 2 && (
                    <div className={styles.flowerPreview}>
                      <div className={styles.flowerNav}>
                        <b>BLÜTENLIEBE</b>
                        <span>SHOP ↗</span>
                      </div>
                      <strong>
                        Flowers
                        <br />
                        <em>with feeling.</em>
                      </strong>
                      <div className={styles.flowerProduct}>
                        <i />
                        <div>
                          <small>BOUQUET 04</small>
                          <b>Rosé Edit</b>
                        </div>
                        <span>39 €</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.demoInfo}>
                  <div>
                    <small>WEBFORGE / LIVE DEMO</small>
                    <h3>{demo.name}</h3>
                  </div>
                  <p>{demo.text}</p>
                  <a href={demo.href}>
                    Experience öffnen <span>↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={`${styles.section} ${styles.shell}`} id="prozess">
        <div className={styles.sectionIntro} data-reveal>
          <span className={styles.eyebrow}>/ 03 — PROZESS</span>
          <div>
            <h2>
              Von null zu live.
              <br />
              <em>Ohne Agentur-Chaos.</em>
            </h2>
            <p>Ein klarer Prozess sorgt dafür, dass Geschwindigkeit nicht auf Kosten von Qualität geht.</p>
          </div>
        </div>
        <div className={styles.processLine} data-reveal>
          {[
            ["01", "Discover", "Zielgruppe, Angebot, Wettbewerb und Conversion-Ziel klären."],
            ["02", "Direction", "Look, Struktur und erste Interaktion als visuelle Richtung definieren."],
            ["03", "Build", "Designsystem, responsive Umsetzung und Funktionen vollständig bauen."],
            ["04", "Launch", "Testen, optimieren, veröffentlichen und auf Wunsch weiter betreuen."],
          ].map((step) => (
            <article key={step[0]}>
              <span>{step[0]}</span>
              <div className={styles.processDot} />
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.pricingSection} id="preise">
        <div className={`${styles.section} ${styles.shell}`}>
          <div className={styles.sectionIntro} data-reveal>
            <span className={styles.eyebrow}>/ 04 — INVESTMENT</span>
            <div>
              <h2>
                Klare Pakete.
                <br />
                <em>Keine Agenturpreise.</em>
              </h2>
              <p>Der Umfang steht vor Projektstart fest. Keine versteckten Stunden, keine Überraschungen.</p>
            </div>
          </div>
          <div className={styles.pricingGrid}>
            {packages.map((item) => (
              <article
                className={`${styles.priceCard} ${item.popular ? styles.priceFeatured : ""}`}
                data-reveal
                data-tilt
                key={item.name}
              >
                <div className={styles.priceTop}>
                  <small>{item.popular ? "MOST CHOSEN" : "WEBFORGE PACKAGE"}</small>
                  {item.popular && <span>POPULAR</span>}
                </div>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
                <strong>{item.price}</strong>
                <ul>
                  {item.features.map((feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {canSell ? (
                  <a href={item.checkout} rel="noreferrer">
                    Paket starten <span>↗</span>
                  </a>
                ) : (
                  <a href="#kontakt">
                    Paket anfragen <span>↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
          <div className={styles.maintenance} data-reveal>
            <div>
              <small>OPTIONAL CARE PLAN</small>
              <b>Hosting, Betreuung & kleine Änderungen</b>
            </div>
            <strong>
              99 €<span>/Monat</span>
            </strong>
            {canSell ? (
              <a href={maintenanceCheckout} rel="noreferrer">
                Betreuung starten ↗
              </a>
            ) : (
              <a href="#kontakt">Betreuung anfragen ↗</a>
            )}
          </div>
        </div>
      </section>
      <section className={styles.finalCta} id="kontakt">
        <div className={styles.ctaOrb} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.ctaGrid}`}>
          <div data-reveal>
            <span className={styles.eyebrow}>/ START A PROJECT</span>
            <h2>
              Ihre Website sollte
              <br />
              nicht aussehen wie <em>gestern.</em>
            </h2>
            <p>
              Schicken Sie uns Ihr Unternehmen oder Ihre bestehende Website. Wir zeigen Ihnen, in welche Richtung ein
              moderner digitaler Auftritt gehen kann.
            </p>
            <div className={styles.ctaNotes}>
              <span>✓ unverbindlich</span>
              <span>✓ konkrete Richtung</span>
              <span>✓ kein Sales-Call-Zwang</span>
            </div>
          </div>
          <div className={styles.formCard} data-reveal data-tilt>
            <LeadForm />
          </div>
        </div>
      </section>
      <footer className={`${styles.footer} ${styles.shell}`}>
        <div className={styles.footerBrand}>
          <span className={styles.brandMark}>W</span>
          <div>
            <b>WebForge</b>
            <small>DIGITAL EXPERIENCES</small>
          </div>
        </div>
        <p>Strategy · Design · Motion · Web Apps</p>
        <div className={styles.footerLinks}>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="#top">Nach oben ↑</a>
        </div>
      </footer>
    </main>
  );
}
