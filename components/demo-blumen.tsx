"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

const bouquets = [
  { name: "Sonnenglück", price: 29, text: "Gelb, Apricot und Creme · locker und saisonal" },
  { name: "Rosé Atelier", price: 39, text: "Rosé, Mauve und feines Grün · ruhig und elegant" },
  { name: "Wild & Frei", price: 34, text: "Kräftige Wiesenfarben · locker und lebendig" },
  { name: "Pur Weiß", price: 42, text: "Creme, Weiß und Salbeigrün · modern und klar" },
];
const palettes = [
  { name: "Rosé", colors: ["#ee90aa", "#c7769c", "#f3c5cf"] },
  { name: "Sonnenuntergang", colors: ["#ff7c61", "#ffbd4b", "#f1d66d"] },
  { name: "Wiese", colors: ["#8f67aa", "#f06475", "#e8b940"] },
  { name: "Creme", colors: ["#f6f0dc", "#dbe2cb", "#afc1a1"] },
];
function photo(position: string): CSSProperties {
  return {
    backgroundImage: "url('/demo/ai-demo-sprite.webp')",
    backgroundSize: "300% 300%",
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  };
}

export default function DemoBlumen() {
  const [occasion, setOccasion] = useState("Geburtstag");
  const [mood, setMood] = useState("Elegant");
  const [palette, setPalette] = useState(0);
  const [size, setSize] = useState("M");
  const [selected, setSelected] = useState<string | null>(null);
  const builder = useMemo(() => {
    const base = size === "S" ? 28 : size === "L" ? 58 : 39;
    const occasionPlus = occasion === "Hochzeit" ? 14 : occasion === "Jubiläum" ? 8 : 0;
    const moodPlus = mood === "Opulent" ? 9 : 0;
    return { price: base + occasionPlus + moodPlus, palette: palettes[palette] };
  }, [occasion, mood, palette, size]);

  return (
    <main className={`${styles.demo} ${styles.flower}`}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.logo} href="#top" aria-label="Blütenliebe Startseite">
          <span className={styles.logoMark}>BL</span>
          <b>BLÜTENLIEBE</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#collection">Sträuße</a>
          <a href="#builder">Strauß zusammenstellen</a>
          <a href="#atelier">Über uns</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <div className={styles.navActions}>
          <a className={styles.ghostButton} href="#atelier">
            Über das Atelier
          </a>
          <a className={styles.pill} href="#builder">
            Strauß planen ↗
          </a>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Blumenatelier · Hildesheim</div>
          <h1>
            Blumen, die wirklich <em>zu Ihnen passen.</em>
          </h1>
          <p>
            Frische, saisonale Sträuße für Geburtstag, Hochzeit, Jubiläum oder einfach so. Mit dem Strauß-Planer können
            Kunden vorab Stil, Farben und Größe auswählen.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.solidButton} href="#builder">
              Strauß zusammenstellen ↗
            </a>
            <a className={styles.ghostButton} href="#collection">
              Sträuße ansehen
            </a>
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <b>2h</b>
              <span>Abholung möglich</span>
            </div>
            <div className={styles.fact}>
              <b>4×</b>
              <span>frische Ware pro Woche</span>
            </div>
            <div className={styles.fact}>
              <b>100%</b>
              <span>handgebunden</span>
            </div>
          </div>
        </div>
        <div className={styles.stage} style={photo("0% 0%")}>
          <div className={styles.stageTop}>
            <span>BLÜTENLIEBE / HEUTE</span>
            <span className={styles.live}>
              <i />
              Frisch eingetroffen
            </span>
          </div>
          <div className={styles.stageCard}>
            <div>
              <small>HEUTE IM ATELIER</small>
              <b>Pfingstrosen · Levkojen · Wiesenmix</b>
            </div>
            <strong>08:42</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="collection">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 01 AKTUELLE STRÄUSSE</small>
            <div>
              <h2>Einfach auswählen, was gefällt.</h2>
              <p>Realistische Bilder zeigen sofort die Qualität und Stimmung, die Kunden erwarten können.</p>
            </div>
          </div>
          <div
            style={{ ...photo("50% 50%"), minHeight: 430, borderRadius: 30, marginBottom: 28 }}
            role="img"
            aria-label="KI-generiertes Beispielbild eines handgebundenen Blumenstraußes"
          />
          <div className={styles.bouquetGrid}>
            {bouquets.map((bouquet) => (
              <article className={styles.bouquetCard} key={bouquet.name}>
                <div className={styles.bouquetCopy}>
                  <h3>{bouquet.name}</h3>
                  <p>{bouquet.text}</p>
                  <div className={styles.bouquetBottom}>
                    <b>{bouquet.price} €</b>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(bouquet.name);
                        document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Auswählen ↗
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="builder">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 02 STRAUSS-PLANER</small>
            <div>
              <h2>In wenigen Schritten zum passenden Strauß.</h2>
              <p>Anlass, Größe, Stil und Farben auswählen. Der Preis ändert sich sofort.</p>
            </div>
          </div>
          <div className={styles.tool}>
            <div className={styles.toolPanel}>
              <div className={styles.moodGrid}>
                <div>
                  <div className={styles.field}>
                    <label htmlFor="flower-occasion">Anlass</label>
                    <select id="flower-occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)}>
                      <option>Geburtstag</option>
                      <option>Jubiläum</option>
                      <option>Hochzeit</option>
                      <option>Einfach so</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="flower-size">Größe</label>
                    <select id="flower-size" value={size} onChange={(event) => setSize(event.target.value)}>
                      <option value="S">S · klein</option>
                      <option value="M">M · mittel</option>
                      <option value="L">L · groß</option>
                    </select>
                  </div>
                  <label>
                    <b style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#a8b0bb" }}>
                      Stil
                    </b>
                  </label>
                  <div className={styles.moodChoices} style={{ marginTop: 9 }}>
                    {["Elegant", "Wild", "Soft", "Opulent"].map((item) => (
                      <button
                        className={styles.moodChoice}
                        data-active={mood === item}
                        type="button"
                        key={item}
                        onClick={() => setMood(item)}
                      >
                        <b>{item}</b>
                        <br />
                        <small>
                          {item === "Elegant"
                            ? "ruhig und klar"
                            : item === "Wild"
                              ? "locker und lebendig"
                              : item === "Soft"
                                ? "leicht und fein"
                                : "groß und auffällig"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <label>
                    <b
                      style={{
                        display: "block",
                        marginTop: 20,
                        fontSize: 11,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        color: "#a8b0bb",
                      }}
                    >
                      Farben
                    </b>
                  </label>
                  <div className={styles.palette}>
                    {palettes.map((item, index) => (
                      <button
                        className={styles.swatch}
                        data-active={palette === index}
                        type="button"
                        aria-label={`Farbauswahl ${item.name}`}
                        key={item.name}
                        onClick={() => setPalette(index)}
                        style={{ background: `linear-gradient(135deg,${item.colors.join(",")})` }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  style={{ ...photo("50% 50%"), minHeight: 420, borderRadius: 24, position: "relative" }}
                  role="img"
                  aria-label="KI-generiertes Blumenstrauß-Beispielbild"
                >
                  <div className={styles.previewInfo}>
                    <div>
                      <small>
                        {occasion.toUpperCase()} · {mood.toUpperCase()}
                      </small>
                      <b>
                        {builder.palette.name} · Größe {size}
                      </b>
                    </div>
                    <strong>{builder.price} €</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.toolCopy}>
              <div className={styles.kicker}>Ihre Auswahl</div>
              <h3>Vorher sehen, was ungefähr entsteht.</h3>
              <p>
                Der Planer zeigt Preis und Auswahl direkt an. In einer echten Website könnte daraus anschließend eine
                Bestellung oder Anfrage werden.
              </p>
              <div className={styles.result}>
                <small>IHRE AUSWAHL</small>
                <b>{builder.price} €</b>
                <p>
                  {occasion} · {mood} · {builder.palette.name} · Größe {size}
                </p>
              </div>
              <button
                className={styles.solidButton}
                style={{ marginTop: 16 }}
                type="button"
                onClick={() => {
                  setSelected(`${builder.palette.name} · ${occasion} · ${mood} · Größe ${size}`);
                  document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Auswahl übernehmen ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="atelier">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 03 ÜBER UNS</small>
            <div>
              <h2>Klein, lokal und persönlich.</h2>
              <p>Mehrmals pro Woche frische Ware, kleine Mengen und Sträuße, die nicht alle gleich aussehen.</p>
            </div>
          </div>
          <div
            style={{ ...photo("50% 100%"), minHeight: 420, borderRadius: 30, marginBottom: 28 }}
            role="img"
            aria-label="KI-generiertes Beispielbild einer Floristin bei der Kundenübergabe"
          />
          <div className={styles.grid3}>
            {[
              ["01", "Saisonale Blumen", "Wir arbeiten möglichst mit Blumen, die gerade Saison haben."],
              ["02", "Von Hand gebunden", "Jeder Strauß wird einzeln zusammengestellt und gebunden."],
              ["03", "Einfach bestellen", "Online auswählen, Wunsch senden und später abholen oder liefern lassen."],
            ].map(([n, title, text]) => (
              <article className={styles.card} key={n}>
                <div className={styles.cardNumber}>
                  <span>{n}</span>
                  <span>BLÜTENLIEBE</span>
                </div>
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
            <div className={styles.kicker}>Kontakt</div>
            <h2>Besuchen Sie uns oder schicken Sie Ihren Wunsch.</h2>
            <p>
              Rosenstraße 8 · 31134 Hildesheim
              <br />
              Mo–Fr 09:00–18:00 · Sa 09:00–14:00
            </p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="flower-name">
              Name
              <input id="flower-name" placeholder="Name" />
            </label>
            <label htmlFor="flower-contact">
              E-Mail oder Telefon
              <input id="flower-contact" placeholder="Kontakt" />
            </label>
            <label htmlFor="flower-choice">
              Auswahl
              <input
                id="flower-choice"
                value={selected || ""}
                onChange={(event) => setSelected(event.target.value)}
                placeholder="Strauß oder Anlass"
              />
            </label>
            <label htmlFor="flower-message">
              Wünsche
              <textarea id="flower-message" rows={4} placeholder="Farben, Abholtag, Grußkarte ..." />
            </label>
            <button className={styles.solidButton} type="submit">
              Anfrage testen ↗
            </button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <div>
          <strong>BLÜTENLIEBE</strong>
          <br />
          Blumenatelier · Hildesheim
        </div>
        <div>Rosenstraße 8 · 05121 200000</div>
        <div className={styles.footerLinks}>
          <span>Impressum</span>
          <span>Datenschutz</span>
          <span>WebForge Demo</span>
        </div>
      </footer>
    </main>
  );
}
