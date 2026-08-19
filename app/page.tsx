const services = [
  { icon: "✦", title: "Design, das überzeugt", text: "Individuell, modern und exakt auf Ihr Unternehmen abgestimmt — statt austauschbarer Baukasten-Optik." },
  { icon: "↗", title: "Mehr Anfragen", text: "Klare Nutzerführung, starke Handlungsaufforderungen und mobile Optimierung verwandeln Besucher in Kunden." },
  { icon: "⚡", title: "Schnell online", text: "Ein effizienter Prozess bringt Ihren neuen Auftritt ohne monatelanges Agenturprojekt ins Netz." },
];

const packages = [
  { name: "Starter", price: "499 €", text: "Der professionelle Einstieg", features: ["Moderne One-Page Website", "Optimiert für Smartphone & Desktop", "Kontakt, Öffnungszeiten & Maps", "SEO-Grundoptimierung"] },
  { name: "Business", price: "799 €", text: "Für Unternehmen, die wachsen wollen", popular: true, features: ["Alles aus Starter", "Mehrere individuelle Seiten", "Leistungen oder Speisekarte", "Conversion-Optimierung", "Erweiterte SEO-Basis"] },
  { name: "Pro", price: "ab 1.299 €", text: "Für anspruchsvolle Prozesse", features: ["Alles aus Business", "Anfrage- & Bestellfunktionen", "Individuelle Funktionen", "Admin-Optionen", "Priorisierte Umsetzung"] },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top"><span>W</span> WebForge</a>
        <div className="links"><a href="#leistungen">Leistungen</a><a href="#preise">Preise</a><a href="#ablauf">Ablauf</a></div>
        <a className="button small" href="#kontakt">Kostenlosen Entwurf anfragen</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow">Websites für lokale Unternehmen</div>
        <h1>Ihre Website sollte<br/><em>Kunden gewinnen.</em></h1>
        <p className="lead">Wir entwickeln moderne, schnelle Websites, die Ihr Unternehmen professionell präsentieren und Interessenten gezielt zur Anfrage führen — ohne klassische Agenturpreise.</p>
        <div className="actions"><a className="button" href="#kontakt">Kostenlosen Entwurf erhalten <b>→</b></a><a className="ghost" href="#preise">Pakete ansehen</a></div>
        <div className="trust"><span>✓ Unverbindlicher Erstentwurf</span><span>✓ Transparente Festpreise</span><span>✓ Persönliche Umsetzung</span></div>
        <div className="browser">
          <div className="browserbar"><i/><i/><i/><div>ihre-firma.de</div></div>
          <div className="mock"><div><small>MEISTERBETRIEB · REGION HILDESHEIM</small><h2>Qualität, auf die<br/>Sie bauen können.</h2><p>Handwerk mit Anspruch. Zuverlässig, sauber und persönlich.</p><button>Projekt anfragen →</button></div><div className="shape"><span>IHRE<br/>FIRMA</span></div></div>
        </div>
      </section>

      <section className="section shell" id="leistungen">
        <div className="eyebrow">Warum WebForge?</div><h2>Keine Website fürs Internet.<br/><em>Eine Website fürs Geschäft.</em></h2>
        <div className="grid3">{services.map((s) => <article className="card" key={s.title}><div className="icon">{s.icon}</div><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
      </section>

      <section className="dark" id="ablauf"><div className="shell section"><div className="eyebrow">Einfacher Ablauf</div><h2>Von der Idee zur neuen Website.</h2><div className="steps"><div><b>01</b><h3>Kurzes Kennenlernen</h3><p>Sie zeigen uns Ihr Unternehmen und was die Website erreichen soll.</p></div><div><b>02</b><h3>Kostenloser Entwurf</h3><p>Sie sehen eine konkrete Designrichtung, bevor Sie sich entscheiden.</p></div><div><b>03</b><h3>Umsetzung</h3><p>Nach Freigabe bauen, optimieren und testen wir Ihren Auftritt.</p></div><div><b>04</b><h3>Online</h3><p>Wir veröffentlichen die Website und kümmern uns auf Wunsch weiter darum.</p></div></div></div></section>

      <section className="section shell" id="preise"><div className="center"><div className="eyebrow">Klare Preise</div><h2>Das passende Paket für Ihr Unternehmen.</h2><p>Keine versteckten Agenturkosten. Sie wissen vorher, was Sie bekommen.</p></div><div className="pricing">{packages.map((p) => <article className={`price ${p.popular ? "featured" : ""}`} key={p.name}>{p.popular && <div className="badge">BELIEBT</div>}<h3>{p.name}</h3><p>{p.text}</p><strong>{p.price}</strong><ul>{p.features.map(f => <li key={f}>✓ {f}</li>)}</ul><a className={p.popular ? "button full" : "ghost full"} href="#kontakt">Paket anfragen</a></article>)}</div><p className="care">Optional: technische Betreuung, Hosting und kleine Änderungen ab <strong>59 €/Monat</strong>.</p></section>

      <section className="cta" id="kontakt"><div className="shell"><div><div className="eyebrow">Der erste Schritt kostet nichts</div><h2>Wie könnte Ihre neue<br/>Website aussehen?</h2><p>Schicken Sie uns den Namen Ihres Unternehmens oder Ihre aktuelle Website. Wir schauen uns Ihren Auftritt an und besprechen einen unverbindlichen Entwurf.</p></div><form><label>Unternehmen<input placeholder="z. B. Mustermann GmbH" /></label><label>Website oder Google-Eintrag<input placeholder="Link (falls vorhanden)" /></label><label>E-Mail<input type="email" placeholder="name@unternehmen.de" /></label><button className="button" type="button">Kostenlosen Entwurf anfragen →</button><small>Unverbindlich. Keine automatische Bestellung.</small></form></div></section>

      <footer className="shell"><a className="brand" href="#top"><span>W</span> WebForge</a><p>Websites, die Unternehmen voranbringen.</p><div><a href="#">Impressum</a><a href="#">Datenschutz</a></div></footer>
    </main>
  );
}