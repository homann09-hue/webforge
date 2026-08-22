"use client";

import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

const services = [
  ["01", "Dachsanierung", "Komplettaufbau, Dämmung, Eindeckung und Details aus einer Hand.", "92%"],
  ["02", "Flachdach", "Abdichtung, Gefälle, Entwässerung und Wartung für langlebige Systeme.", "84%"],
  ["03", "Dachfenster", "Mehr Licht, bessere Dämmung und saubere Innenanschlüsse.", "76%"],
  ["04", "Reparatur", "Schnelle Hilfe bei Sturm, Leckage und akuten Schäden.", "96%"],
];

const projects = [
  ["Hildesheim", "Einfamilienhaus", "180 m²", "Energetische Komplettsanierung"],
  ["Sarstedt", "Moderner Anbau", "86 m²", "Flachdach + Entwässerung"],
  ["Alfeld", "Sturmschaden", "24h", "Sicherung + Reparatur"],
];

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
          <span className={styles.logoMark}>NW</span><b>NORDWERK</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#leistungen">Leistungen</a><a href="#projekte">Projekte</a><a href="#kalkulator">Kalkulator</a><a href="#ablauf">Ablauf</a>
        </div>
        <div className={styles.navActions}>
          <a className={styles.ghostButton} href="#projekte">Referenzen</a>
          <a className={styles.pill} href="#kontakt">Projekt anfragen ↗</a>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Dachdeckermeister · Hildesheim & Region</div>
          <h1>Dächer, die <em>Ruhe geben.</em></h1>
          <p>Planung, Sanierung und Reparatur ohne Baustellenchaos. Mit digitaler Projektübersicht, Fotodokumentation und einem festen Ansprechpartner.</p>
          <div className={styles.heroActions}>
            <a className={styles.solidButton} href="#kalkulator">Kosten grob einschätzen ↗</a>
            <a className={styles.ghostButton} href="#projekte">Projekte ansehen</a>
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}><b>18+</b><span>Jahre Erfahrung</span></div>
            <div className={styles.fact}><b>4,9/5</b><span>Kundenbewertung</span></div>
            <div className={styles.fact}><b>48h</b><span>Rückmeldung</span></div>
          </div>
        </div>
        <div className={`${styles.stage} ${styles.craftStage}`}>
          <div className={styles.stageTop}><span>NORDWERK / LIVE PROJECT</span><span className={styles.live}><i />Baustelle aktiv</span></div>
          <div className={styles.roofShape} />
          <div className={styles.craftBadge}>MEISTER<br/>BETRIEB<br/>18+ JAHRE</div>
          <div className={styles.stageCard}>
            <div><small>AKTUELLES PROJEKT</small><b>Komplettsanierung · Bad Salzdetfurth</b></div>
            <strong>82%</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="leistungen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 01 LEISTUNGEN</small>
            <div><h2>Handwerk mit System.</h2><p>Jede Leistung wird digital dokumentiert, sauber kalkuliert und mit nachvollziehbaren Projektständen geführt.</p></div>
          </div>
          <div className={styles.grid4}>
            {services.map(([n,title,text,metric]) => (
              <article className={styles.card} key={title}>
                <div className={styles.cardNumber}><span>{n}</span><span>{metric} MATCH</span></div>
                <h3>{title}</h3><p>{text}</p>
                <div className={styles.metricBar}><i style={{ width: metric }} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="projekte">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 02 REFERENZEN</small>
            <div><h2>Ergebnisse statt Stockfotos.</h2><p>Drei typische Projektarten als Beispiel für eine moderne, visuell starke Referenzdarstellung.</p></div>
          </div>
          <div className={styles.grid3}>
            {projects.map(([place,type,size,label], index) => (
              <article className={styles.card} key={place}>
                <div className={styles.projectVisual} style={{ filter: `hue-rotate(${index * 12}deg)` }} />
                <small>{label}</small><h3>{type}</h3><p>{place} · {size}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="kalkulator">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 03 SMART ESTIMATOR</small>
            <div><h2>In 20 Sekunden eine Hausnummer.</h2><p>Kein echtes Angebot, aber ein starkes Beispiel dafür, wie interaktive Tools aus Besuchern konkrete Anfragen machen.</p></div>
          </div>
          <div className={styles.tool}>
            <div className={styles.toolCopy}>
              <div className={styles.kicker}>Live Kalkulator</div>
              <h3>Projekt grob einschätzen</h3>
              <p>Fläche, Dachform und Leistungsumfang auswählen. Die Demo berechnet sofort einen orientierenden Bereich.</p>
              <div className={styles.facts}>
                <div className={styles.fact}><b>~20s</b><span>bis Ergebnis</span></div>
                <div className={styles.fact}><b>3</b><span>Eingaben</span></div>
                <div className={styles.fact}><b>0€</b><span>unverbindlich</span></div>
              </div>
            </div>
            <div className={styles.toolPanel}>
              <div className={styles.field}>
                <label htmlFor="hw-area">Dachfläche</label>
                <div className={styles.rangeRow}>
                  <input id="hw-area" type="range" min="50" max="350" step="10" value={area} onChange={(e)=>setArea(Number(e.target.value))} />
                  <output>{area} m²</output>
                </div>
              </div>
              <div className={styles.field}><label htmlFor="hw-roof">Dachform</label><select id="hw-roof" value={roof} onChange={(e)=>setRoof(e.target.value)}><option>Satteldach</option><option>Walmdach</option><option>Flachdach</option></select></div>
              <div className={styles.field}><label htmlFor="hw-scope">Umfang</label><select id="hw-scope" value={scope} onChange={(e)=>setScope(e.target.value)}><option>Komplettsanierung</option><option>Neueindeckung</option><option>Reparatur</option></select></div>
              <div className={styles.result}><small>ORIENTIERUNGSBEREICH</small><b>{estimate}</b><p>Demo-Schätzung inkl. Material und Montage. Vor-Ort-Termin erforderlich.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="ablauf">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 04 ABLAUF</small><div><h2>Vier Schritte. Kein Chaos.</h2></div></div>
          <div className={styles.timeline}>
            {[["01","Vor-Ort-Check","Zustand, Maße, Wünsche und technische Rahmenbedingungen."],["02","Digitales Angebot","Klare Positionen, Optionen und nachvollziehbarer Leistungsumfang."],["03","Live-Projekt","Fortschritt, Fotos und Abstimmungen in einer strukturierten Projektansicht."],["04","Abnahme","Gemeinsame Prüfung, Dokumentation und sauberer Abschluss."]].map(([n,t,p])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{p}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div><div className={styles.kicker}>Projekt starten</div><h2>Was steht bei Ihnen an?</h2><p>Kurze Anfrage senden. Diese Demo zeigt nur den Flow – es werden keine echten Projektdaten übertragen.</p></div>
          <form onSubmit={(e)=>e.preventDefault()}>
            <label htmlFor="hw-name">Name<input id="hw-name" placeholder="Max Mustermann" /></label>
            <label htmlFor="hw-mail">E-Mail<input id="hw-mail" type="email" placeholder="max@beispiel.de" /></label>
            <label htmlFor="hw-topic">Projekt<select id="hw-topic"><option>Dachsanierung</option><option>Flachdach</option><option>Reparatur</option><option>Dachfenster</option></select></label>
            <label htmlFor="hw-msg">Kurzbeschreibung<textarea id="hw-msg" rows={4} placeholder="Worum geht es?" /></label>
            <button className={styles.solidButton} type="submit">Anfrage simulieren ↗</button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <div><strong>NORDWERK Dach & Bau</strong><br/>Hildesheim & Region</div><div>Mo–Fr 07:00–17:00</div><div className={styles.footerLinks}><span>Impressum</span><span>Datenschutz</span><span>WebForge Demo</span></div>
      </footer>
    </main>
  );
}
