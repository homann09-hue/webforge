"use client";
export default function DemoHandwerk() {
  const services = [
    {
      n: "01",
      title: "Dachsanierung",
      text: "Energetisch, langlebig und sauber geplant – von der Bestandsaufnahme bis zur letzten Ziegelreihe.",
    },
    {
      n: "02",
      title: "Flachdach & Abdichtung",
      text: "Sichere Abdichtungssysteme für Anbauten, Garagen und Gewerbe – inklusive Wartungskonzept.",
    },
    {
      n: "03",
      title: "Dachfenster & Ausbau",
      text: "Mehr Licht, bessere Dämmung und fachgerechte Anschlüsse aus einer Hand.",
    },
    {
      n: "04",
      title: "Reparatur & Notdienst",
      text: "Schnelle Hilfe bei Sturmschäden, Undichtigkeiten und akuten Dachproblemen.",
    },
  ];
  return (
    <main className="demo craft-demo">
      <nav className="demo-nav demo-shell">
        <a className="demo-logo" href="#top">
          <span>NW</span>
          <b>NORDWERK</b>
        </a>
        <div>
          <a href="#leistungen">Leistungen</a>
          <a href="#projekte">Projekte</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <a className="demo-pill" href="#kontakt">
          Projekt anfragen
        </a>
      </nav>
      <section className="craft-hero demo-shell" id="top">
        <div className="craft-copy">
          <div className="demo-kicker">Dachdeckermeister · Hildesheim & Region</div>
          <h1>
            Wir bauen Dächer, die <em>Ruhe geben.</em>
          </h1>
          <p>
            Sanierung, Reparatur und Ausbau für Wohnhäuser und Gewerbe. Klar kalkuliert, sauber organisiert und mit
            einem festen Ansprechpartner.
          </p>
          <div className="demo-actions">
            <a className="demo-primary" href="#kontakt">
              Kostenloses Erstgespräch
            </a>
            <a className="demo-secondary" href="#projekte">
              Referenzen ansehen
            </a>
          </div>
          <div className="craft-facts">
            <span>
              <b>18+</b> Jahre Erfahrung
            </span>
            <span>
              <b>4,9/5</b> Kundenbewertung
            </span>
            <span>
              <b>48h</b> Rückmeldung
            </span>
          </div>
        </div>
        <div className="craft-visual">
          <div className="craft-roof">
            <span>NORDWERK</span>
          </div>
          <div className="floating-card">
            <small>AKTUELLES PROJEKT</small>
            <b>Komplettsanierung · 180 m²</b>
            <span>Bad Salzdetfurth</span>
          </div>
        </div>
      </section>
      <section className="craft-trust">
        <div className="demo-shell">
          <span>✓ Meisterbetrieb</span>
          <span>✓ Festes Projektteam</span>
          <span>✓ Transparente Angebote</span>
          <span>✓ Dokumentation per Foto</span>
        </div>
      </section>
      <section className="demo-section demo-shell" id="leistungen">
        <div className="demo-section-head">
          <div>
            <div className="demo-kicker">Leistungen</div>
            <h2>Alles, was ein gutes Dach braucht.</h2>
          </div>
          <p>
            Keine unklaren Zuständigkeiten. Wir koordinieren Material, Gerüst, Ausführung und Abnahme als durchgängiges
            Projekt.
          </p>
        </div>
        <div className="craft-service-grid">
          {services.map((s) => (
            <article key={s.n}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <a href="#kontakt">Leistung anfragen →</a>
            </article>
          ))}
        </div>
      </section>
      <section className="craft-projects" id="projekte">
        <div className="demo-shell">
          <div className="demo-kicker">Ausgewählte Projekte</div>
          <div className="project-grid">
            <article className="project-card large">
              <div className="project-photo p1" />
              <div>
                <small>ENERGETISCHE SANIERUNG</small>
                <h3>Einfamilienhaus · Hildesheim</h3>
                <p>Neue Dämmung, Tonziegel, Dachflächenfenster und Spenglerarbeiten.</p>
              </div>
            </article>
            <article className="project-card">
              <div className="project-photo p2" />
              <div>
                <small>FLACHDACH</small>
                <h3>Anbau · Sarstedt</h3>
                <p>Gefälledämmung und moderne Abdichtung.</p>
              </div>
            </article>
            <article className="project-card">
              <div className="project-photo p3" />
              <div>
                <small>REPARATUR</small>
                <h3>Sturmschaden · Alfeld</h3>
                <p>Sicherung und Reparatur innerhalb von 24 Stunden.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="demo-section demo-shell" id="ablauf">
        <div className="demo-kicker">So läuft Ihr Projekt</div>
        <h2>Vier Schritte. Kein Chaos.</h2>
        <div className="process-grid">
          {[
            ["01", "Vor-Ort-Termin", "Wir prüfen Zustand, Wünsche und technische Rahmenbedingungen."],
            ["02", "Klares Angebot", "Sie erhalten einen nachvollziehbaren Leistungsumfang mit Festpreispositionen."],
            [
              "03",
              "Saubere Umsetzung",
              "Fester Ansprechpartner, abgestimmter Terminplan und tägliche Baustellenordnung.",
            ],
            ["04", "Abnahme", "Gemeinsame Prüfung, Fotodokumentation und klare Gewährleistung."],
          ].map((x) => (
            <article key={x[0]}>
              <b>{x[0]}</b>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="craft-contact" id="kontakt">
        <div className="demo-shell">
          <div>
            <div className="demo-kicker light">Projekt starten</div>
            <h2>Erzählen Sie uns kurz, was ansteht.</h2>
            <p>Wir melden uns werktags innerhalb von 48 Stunden und sagen direkt, ob und wann wir helfen können.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <input placeholder="Name" />
              <input placeholder="Telefon" />
            </div>
            <input placeholder="E-Mail" />
            <select defaultValue="">
              <option value="" disabled>
                Worum geht es?
              </option>
              <option>Dachsanierung</option>
              <option>Reparatur</option>
              <option>Flachdach</option>
              <option>Dachfenster / Ausbau</option>
            </select>
            <textarea placeholder="Projekt kurz beschreiben" rows={4} />
            <button className="demo-primary" type="submit">
              Anfrage senden
            </button>
            <small>Demoformular – es werden keine Daten versendet.</small>
          </form>
        </div>
      </section>
      <footer className="demo-footer demo-shell">
        <div>
          <b>NORDWERK Dach & Bau</b>
          <span>Musterstraße 12 · 31134 Hildesheim</span>
        </div>
        <div>Mo–Fr 07:00–17:00 · 05121 000000</div>
        <div>
          <span>Impressum</span>
          <span>Datenschutz</span>
          <span>WebForge Demo</span>
        </div>
      </footer>
    </main>
  );
}
