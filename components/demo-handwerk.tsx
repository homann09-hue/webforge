"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

const services = [
  ["01", "Dachsanierung", "Dämmung, neue Eindeckung und alle wichtigen Details aus einer Hand.", "92%"],
  ["02", "Flachdach", "Abdichtung, Gefälle und Entwässerung für ein dauerhaft dichtes Dach.", "84%"],
  ["03", "Dachfenster", "Mehr Licht im Dachgeschoss und fachgerechter Einbau mit sauberem Anschluss.", "76%"],
  ["04", "Reparatur", "Schnelle Hilfe bei Sturm, undichten Stellen oder anderen akuten Schäden.", "96%"],
];

const projects = [
  ["Hildesheim", "Einfamilienhaus", "180 m²", "Komplette Dachsanierung", "50% 0%"],
  ["Sarstedt", "Moderner Anbau", "86 m²", "Dachdetails und Eindeckung", "100% 50%"],
  ["Alfeld", "Sturmschaden", "24h", "Sicherung und Reparatur", "100% 0%"],
];

function photo(position: string): CSSProperties {
  return {
    backgroundImage: "url('/demo/ai-demo-sprite.webp')",
    backgroundSize: "300% 300%",
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  };
}

export default function DemoHandwerk() {
  const [area, setArea] = useState(140);
  const [roof, setRoof] = useState("Satteldach");
  const [scope, setScope] = useState("Komplettsanierung");
  const estimate = useMemo(() => {
    const roofFactor = roof === "Flachdach" ? 1.12 : roof === "Walmdach" ? 1.18 : 1;
    const scopeFactor = scope === "Reparatur" ? 0.22 : scope === "Neueindeckung" ? 0.68 : 1;
    const low = Math.round((area * 165 * roofFactor * scopeFactor) / 500) * 500;
    const high = Math.round((low * 1.28) / 500) * 500;
    return `${low.toLocaleString("de-DE")}–${high.toLocaleString("de-DE")} €`;
  }, [area, roof, scope]);

  return (
    <main className={`${styles.demo} ${styles.craft}`}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.logo} href="#top" aria-label="Nordwerk Startseite">
          <span className={styles.logoMark}>NW</span>
          <b>NORDWERK</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#leistungen">Leistungen</a>
          <a href="#projekte">Referenzen</a>
          <a href="#kalkulator">Kostenrechner</a>
          <a href="#ablauf">So läuft es ab</a>
        </div>
        <div className={styles.navActions}>
          <a className={styles.ghostButton} href="#projekte">
            Projekte ansehen
          </a>
          <a className={styles.pill} href="#kontakt">
            Anfrage senden ↗
          </a>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Dachdeckermeister · Hildesheim & Region</div>
          <h1>
            Ein gutes Dach soll vor allem <em>Ruhe geben.</em>
          </h1>
          <p>
            Wir kümmern uns um Sanierung, Reparatur und Ausbau. Sie bekommen einen festen Ansprechpartner, klare
            Informationen und können den Stand Ihres Projekts jederzeit nachvollziehen.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.solidButton} href="#kalkulator">
              Kosten grob einschätzen ↗
            </a>
            <a className={styles.ghostButton} href="#projekte">
              Referenzen ansehen
            </a>
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <b>18+</b>
              <span>Jahre Erfahrung</span>
            </div>
            <div className={styles.fact}>
              <b>4,9/5</b>
              <span>Kundenbewertung</span>
            </div>
            <div className={styles.fact}>
              <b>48h</b>
              <span>Rückmeldung</span>
            </div>
          </div>
        </div>
        <div className={styles.stage} style={photo("100% 0%")}>
          <div className={styles.stageTop}>
            <span>NORDWERK / AKTUELLES PROJEKT</span>
            <span className={styles.live}>
              <i />
              Baustelle aktiv
            </span>
          </div>
          <div className={styles.craftBadge}>
            MEISTER
            <br />
            BETRIEB
            <br />
            18+ JAHRE
          </div>
          <div className={styles.stageCard}>
            <div>
              <small>AKTUELLES PROJEKT</small>
              <b>Komplettsanierung · Bad Salzdetfurth</b>
            </div>
            <strong>82%</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="leistungen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 01 LEISTUNGEN</small>
            <div>
              <h2>Alles rund ums Dach – klar erklärt.</h2>
              <p>Sie sehen auf einen Blick, welche Arbeiten wir übernehmen und was dabei gemacht wird.</p>
            </div>
          </div>
          <div className={styles.grid4}>
            {services.map(([n, title, text, metric]) => (
              <article className={styles.card} key={title}>
                <div className={styles.cardNumber}>
                  <span>{n}</span>
                  <span>{metric} PASSEND</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className={styles.metricBar}>
                  <i style={{ width: metric }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="projekte">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 02 REFERENZEN</small>
            <div>
              <h2>Sehen, was bereits gemacht wurde.</h2>
              <p>Realistische Beispielbilder zeigen sofort, wie Referenzen auf einer Kundenseite wirken können.</p>
            </div>
          </div>
          <div className={styles.grid3}>
            {projects.map(([place, type, size, label, position]) => (
              <article className={styles.card} key={place}>
                <div
                  style={{
                    ...photo(position),
                    minHeight: 300,
                    borderRadius: 22,
                    marginBottom: 20,
                    backgroundColor: "#222",
                  }}
                  role="img"
                  aria-label={`${type} – KI-generiertes Beispielbild`}
                />
                <small>{label}</small>
                <h3>{type}</h3>
                <p>
                  {place} · {size}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="kalkulator">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 03 KOSTENRECHNER</small>
            <div>
              <h2>Eine erste Preisidee in wenigen Sekunden.</h2>
              <p>Der Rechner ersetzt kein Angebot, gibt Kunden aber sofort eine grobe Orientierung.</p>
            </div>
          </div>
          <div className={styles.tool}>
            <div className={styles.toolCopy}>
              <div className={styles.kicker}>Kosten grob einschätzen</div>
              <h3>Was könnte mein Dach ungefähr kosten?</h3>
              <p>Fläche, Dachform und gewünschte Arbeit auswählen. Danach erscheint sofort ein grober Preisbereich.</p>
              <div className={styles.facts}>
                <div className={styles.fact}>
                  <b>~20s</b>
                  <span>bis zum Ergebnis</span>
                </div>
                <div className={styles.fact}>
                  <b>3</b>
                  <span>einfache Angaben</span>
                </div>
                <div className={styles.fact}>
                  <b>0€</b>
                  <span>unverbindlich</span>
                </div>
              </div>
            </div>
            <div className={styles.toolPanel}>
              <div className={styles.field}>
                <label htmlFor="hw-area">Dachfläche</label>
                <div className={styles.rangeRow}>
                  <input
                    id="hw-area"
                    type="range"
                    min="50"
                    max="350"
                    step="10"
                    value={area}
                    onChange={(event) => setArea(Number(event.target.value))}
                  />
                  <output>{area} m²</output>
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="hw-roof">Dachform</label>
                <select id="hw-roof" value={roof} onChange={(event) => setRoof(event.target.value)}>
                  <option>Satteldach</option>
                  <option>Walmdach</option>
                  <option>Flachdach</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="hw-scope">Welche Arbeit ist geplant?</label>
                <select id="hw-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
                  <option>Komplettsanierung</option>
                  <option>Neueindeckung</option>
                  <option>Reparatur</option>
                </select>
              </div>
              <div className={styles.result}>
                <small>GROBE PREISSPANNE</small>
                <b>{estimate}</b>
                <p>Nur eine Demo-Schätzung. Ein genauer Preis ist erst nach Besichtigung möglich.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="ablauf">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 04 SO LÄUFT ES AB</small>
            <div>
              <h2>Vier einfache Schritte bis zum fertigen Dach.</h2>
            </div>
          </div>
          <div className={styles.timeline}>
            {[
              ["01", "Termin vor Ort", "Wir schauen uns das Dach an, nehmen Maße auf und besprechen Ihre Wünsche."],
              ["02", "Klares Angebot", "Sie bekommen eine verständliche Aufstellung der Arbeiten und Kosten."],
              [
                "03",
                "Umsetzung",
                "Während der Arbeiten sehen Sie Fortschritt, Fotos und wichtige Informationen zum Projekt.",
              ],
              ["04", "Abnahme", "Zum Schluss prüfen wir alles gemeinsam und dokumentieren den fertigen Stand."],
            ].map(([n, title, text]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div>
            <div className={styles.kicker}>Unverbindlich anfragen</div>
            <h2>Was steht bei Ihnen an?</h2>
            <p>Beschreiben Sie kurz Ihr Projekt. Diese Beispielseite sendet keine echten Daten.</p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="hw-name">
              Name
              <input id="hw-name" placeholder="Max Mustermann" />
            </label>
            <label htmlFor="hw-mail">
              E-Mail
              <input id="hw-mail" type="email" placeholder="max@beispiel.de" />
            </label>
            <label htmlFor="hw-topic">
              Worum geht es?
              <select id="hw-topic">
                <option>Dachsanierung</option>
                <option>Flachdach</option>
                <option>Reparatur</option>
                <option>Dachfenster</option>
              </select>
            </label>
            <label htmlFor="hw-msg">
              Kurze Beschreibung
              <textarea
                id="hw-msg"
                rows={4}
                placeholder="Zum Beispiel: Dach ist undicht und soll komplett saniert werden."
              />
            </label>
            <button className={styles.solidButton} type="submit">
              Anfrage testen ↗
            </button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <div>
          <strong>NORDWERK Dach & Bau</strong>
          <br />
          Hildesheim & Region
        </div>
        <div>Mo–Fr 07:00–17:00</div>
        <div className={styles.footerLinks}>
          <span>Impressum</span>
          <span>Datenschutz</span>
          <span>WebForge Demo</span>
        </div>
      </footer>
    </main>
  );
}
