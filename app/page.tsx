import type { Metadata } from "next";
import HomeMotion from "@/components/home-motion";
import LeadForm from "@/components/lead-form";
import ShowcaseLab from "@/components/showcase-lab";
import { isLegalComplete } from "@/lib/company";
import styles from "./home-experience.module.css";

export const metadata: Metadata = {
  title: "WebForge — Websites, Commerce & digitale Systeme",
  description: "WebForge entwickelt moderne Websites, Bestellflows, Kundenportale und digitale Experiences für Unternehmen.",
  alternates: { canonical: "/" },
};

const capabilities = [
  ["01", "Experience Design", "Marke, Typografie, Motion und Interaktion als ein konsistentes digitales System.", "#c9ff4b"],
  ["02", "Commerce", "Produkte, Varianten, Warenkorb, Checkout und direkte Bestellflows ohne Plattform-Feeling.", "#ff6b42"],
  ["03", "Portals", "Kundenbereiche, Projekte, Dateien, Angebote, Status und interne Abläufe in einer Oberfläche.", "#86a8ff"],
  ["04", "Automation", "Formulare, Workflows, Benachrichtigungen und Datenflüsse so verbunden, dass weniger Handarbeit bleibt.", "#e38bff"],
];

const demos = [
  {
    number: "01",
    type: "HANDWERK / SERVICE",
    name: "Nordwerk",
    copy: "Premium Handwerker-Auftritt mit Trust-System, Referenzen, Projektlogik und interaktivem Dach-Kosten-Estimator.",
    href: "/demo/handwerk",
    features: ["Smart Estimator", "Projektstatus", "Referenzen", "Lead Flow"],
    visual: styles.craftVisual,
    ui: ["LIVE PROJECT", "Sanierung · 180 m²", "82%"],
  },
  {
    number: "02",
    type: "GASTRO / COMMERCE",
    name: "Forno 37",
    copy: "Direktbestellung mit Pizza-Konfigurator, Extras, Warenkorb, Liefermodus und simuliertem Kitchen-Live-Tracking.",
    href: "/demo/gastro",
    features: ["Product Config", "Cart", "Delivery", "Kitchen Live"],
    visual: styles.foodVisual,
    ui: ["ORDER FLOW", "Burrata Club · L", "13:42"],
  },
  {
    number: "03",
    type: "RETAIL / EDITORIAL",
    name: "Blütenliebe",
    copy: "Editoriale Markenwelt mit Kollektion und interaktivem Bouquet Builder für Anlass, Stimmung, Palette und Größe.",
    href: "/demo/blumen",
    features: ["Mood Builder", "Collection", "Live Preview", "Inquiry"],
    visual: styles.flowerVisual,
    ui: ["BOUQUET BUILDER", "Rosé Signature", "39 €"],
  },
];

const packages = [
  {
    name: "Starter",
    price: "399 €",
    text: "Für kleine Unternehmen, die schnell professionell und modern auftreten wollen.",
    checkout: "https://buy.stripe.com/aFa9AT6HI9EO470cMCbV600",
    features: ["One-Page Experience", "Responsive Design", "Kontakt & SEO-Basis", "Performance-Setup"],
  },
  {
    name: "Business",
    price: "699 €",
    text: "Für Unternehmen mit mehreren Leistungen, klarer Struktur und Conversion-Fokus.",
    checkout: "https://buy.stripe.com/7sY8wP8PQdV46f83c2bV601",
    popular: true,
    features: ["Mehrere Seiten", "Individuelle Komponenten", "Conversion-System", "Erweiterte SEO-Basis"],
  },
  {
    name: "Pro",
    price: "ab 1.249 €",
    text: "Für Bestellflows, Portale, Rechner, Integrationen und anspruchsvollere digitale Abläufe.",
    checkout: "https://buy.stripe.com/dRm00jfee3gqfPIcMCbV602",
    features: ["Commerce / Portale", "Smart Tools", "Automationen", "Individuelle Logik"],
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
          <span className={styles.brandMark}>WF</span><b>WebForge</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#lab">Experience Lab</a><a href="#demos">Demos</a><a href="#system">System</a><a href="#preise">Preise</a>
        </div>
        <a className={styles.navCta} href="#kontakt">Projekt starten ↗</a>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy} data-reveal>
          <div className={styles.status}><i />Websites · Commerce · Portals · Automation</div>
          <h1>Digital, das <em>mehr kann.</em></h1>
          <p className={styles.heroLead}>WebForge baut keine austauschbaren Firmenwebsites. Wir entwickeln digitale Auftritte mit eigener Identität, echter Funktion und Interfaces, die zeigen, was moderne Web-Technologie leisten kann.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#demos">Live-Demos erleben ↗</a>
            <a className={styles.secondary} href="#kontakt">Kostenlosen Entwurf anfragen</a>
          </div>
          <div className={styles.heroStats}>
            <div><b>3</b><span>interaktive Live-Demos</span></div>
            <div><b>399 €</b><span>ab Einstieg</span></div>
            <div><b>100%</b><span>individuelle Systeme</span></div>
          </div>
        </div>

        <div className={styles.heroStage} data-reveal data-tilt>
          <div className={styles.orbit} /><div className={styles.orbit} />
          <div className={styles.stageCore}>
            <div className={styles.stageTop}><div className={styles.stageDots}><i/><i/><i/></div><span>WEBFORGE / EXPERIENCE ENGINE</span><b>LIVE</b></div>
            <div className={styles.stageBody}>
              <small>BUILD SYSTEM / 2026</small>
              <h2>Designed to move.<br/><span>Built to convert.</span></h2>
              <div className={styles.stageMetricGrid}>
                <article className={styles.stageMetric}><small>EXPERIENCE SCORE</small><b>95</b><div className={styles.stageMetricOrb}/></article>
                <article className={styles.stageMetric}><small>FLOW QUALITY</small><b>+38%</b><div className={styles.flow}><i/><i/><i/><i/><i/></div></article>
              </div>
            </div>
          </div>
          <div className={`${styles.floatChip} ${styles.chip1}`}><small>STACK</small><b>Next · Neon · Vercel</b></div>
          <div className={`${styles.floatChip} ${styles.chip2}`}><small>MODE</small><b>Design × Product</b></div>
        </div>
      </section>

      <div className={styles.marquee} aria-hidden="true"><div className={styles.marqueeTrack}>{[...Array(2)].flatMap(() => ["STRATEGY","DESIGN","MOTION","COMMERCE","PORTALS","AUTOMATION","PERFORMANCE","STRATEGY"]).map((item,index)=><span key={`${item}-${index}`}>{item}<i/></span>)}</div></div>

      <section className={`${styles.section} ${styles.labSection}`} id="lab">
        <div className={styles.shell}>
          <div className={styles.sectionHead} data-reveal><span className={styles.eyebrow}>/ 01 — EXPERIENCE LAB</span><div><h2>Nicht nur erzählen. <em>Zeigen.</em></h2><p>Schalte live zwischen Service, Commerce und Portal um, aktiviere Motion und Automation und sieh, wie sich ein digitales Produkt verändert.</p></div></div>
          <div data-reveal><ShowcaseLab /></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="system">
        <div className={styles.sectionHead} data-reveal><span className={styles.eyebrow}>/ 02 — CAPABILITIES</span><div><h2>Design ist stark, wenn es <em>arbeitet.</em></h2><p>WebForge verbindet visuelle Qualität mit echten Prozessen. Das Ergebnis soll nicht nur besser aussehen, sondern Anfragen, Verkäufe und Abläufe verbessern.</p></div></div>
        <div className={styles.capGrid}>{capabilities.map(([n,title,text,color])=><article className={styles.capCard} style={{ "--cap":color } as React.CSSProperties} data-reveal data-tilt key={title}><small>{n} / WEBFORGE</small><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.demoSection}`} id="demos">
        <div className={styles.shell}>
          <div className={styles.sectionHead} data-reveal><span className={styles.eyebrow}>/ 03 — LIVE EXPERIENCES</span><div><h2>Drei Branchen. Drei <em>eigene Produkte.</em></h2><p>Keine Farbvarianten desselben Templates. Jede Demo hat ihre eigene Art Direction, Interaktionslogik und einen branchenspezifischen Conversion-Flow.</p></div></div>
          <div className={styles.demoGrid}>{demos.map((demo)=><article className={styles.demoCard} data-reveal key={demo.name}><div className={styles.demoCopy}><div><div className={styles.demoMeta}><span>{demo.number}</span><span>{demo.type}</span></div><h3>{demo.name}</h3><p>{demo.copy}</p><div className={styles.featurePills}>{demo.features.map((f)=><span key={f}>{f}</span>)}</div></div><a className={styles.demoLink} href={demo.href}><span>Experience öffnen</span><span>↗</span></a></div><div className={`${styles.demoVisual} ${demo.visual}`}><div className={styles.visualUi}><div><small>{demo.ui[0]}</small><b>{demo.ui[1]}</b></div><strong>{demo.ui[2]}</strong></div></div></article>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shell}`} id="preise">
        <div className={styles.sectionHead} data-reveal><span className={styles.eyebrow}>/ 04 — PACKAGES</span><div><h2>Klare Basis. <em>Skalierbar</em> nach oben.</h2><p>Die Pakete bilden den Einstieg. Rechner, Portale, Shops, Integrationen und individuelle Systeme werden passend zum Projekt ergänzt.</p></div></div>
        <div className={styles.pricingGrid}>{packages.map((pkg)=><article className={styles.priceCard} data-popular={Boolean(pkg.popular)} data-reveal key={pkg.name}><div className={styles.priceTop}><span>WEBFORGE / {pkg.name.toUpperCase()}</span>{pkg.popular&&<b>MOST CHOSEN</b>}</div><h3>{pkg.name}</h3><div className={styles.price}>{pkg.price}</div><p>{pkg.text}</p><ul>{pkg.features.map((f)=><li key={f}>{f}</li>)}</ul>{canSell?<a href={pkg.checkout}>Paket starten ↗</a>:<span className={styles.disabled}>Nach Anfrage verfügbar</span>}</article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.shell}`}>
        <div className={styles.sectionHead} data-reveal><span className={styles.eyebrow}>/ 05 — PROCESS</span><div><h2>Vom ersten Signal bis <em>live.</em></h2></div></div>
        <div className={styles.process}>{[["01","Verstehen","Geschäft, Zielgruppe, Angebot und echte Conversion-Ziele klären."],["02","Direction","Visuelles System, Seitenstruktur und entscheidende User Flows definieren."],["03","Build","Responsive Oberfläche, Funktionen, Daten und Interaktionen umsetzen."],["04","Launch","Testen, optimieren, veröffentlichen und auf Wunsch weiterentwickeln."]].map(([n,t,p])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{p}</p></article>)}</div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div data-reveal><span className={styles.eyebrow}>/ START A PROJECT</span><h2>Was soll deine Website <em>können?</em></h2><p>Schick Unternehmen, aktuellen Link und Kontakt. WebForge kann daraus einen ersten Ansatz für Struktur, Design und sinnvolle Funktionen ableiten.</p></div>
          <div className={styles.formWrap} data-reveal><LeadForm /></div>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}><div><strong>WebForge</strong><br/>Digital experiences & systems</div><div>Deutschland · Remote</div><div className={styles.footerLinks}><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="#top">Nach oben ↑</a></div></footer>
    </main>
  );
}
