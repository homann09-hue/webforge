import type { SiteConfig } from "@/lib/site-config";

export default function CustomerSite({ site }: { site: SiteConfig }) {
  return <main className="customer" style={{"--accent":site.accent} as React.CSSProperties}>
    <nav className="cnav cshell"><a className="clogo" href="#home">{site.business}</a><div><a href="#leistungen">Angebot</a><a href="#ueber">Über uns</a><a href="#kontakt">Kontakt</a></div><a className="cbutton" href={`tel:${site.phone.replace(/\s/g,"")}`}>Anrufen</a></nav>
    <section className="chero cshell" id="home"><div><div className="ceyebrow">{site.category}</div><p className="ctag">{site.tagline}</p><h1>{site.headline}</h1><p className="cintro">{site.intro}</p><div className="cactions"><a className="cbutton" href="#kontakt">{site.cta} →</a><a className="ctext" href="#leistungen">Angebot ansehen ↓</a></div></div><div className="cvisual"><span>{site.business.split(" ")[0]}</span><small>WEBFORGE DEMO</small></div></section>
    <section className="cstrip"><div className="cshell">{site.highlights.map(x=><span key={x}>✓ {x}</span>)}</div></section>
    <section className="csection cshell" id="leistungen"><div className="ceyebrow">Unser Angebot</div><h2>Einfach gut gemacht.</h2><div className="cgrid">{site.services.map((s,i)=><article key={s.title}><b>0{i+1}</b><h3>{s.title}</h3><p>{s.text}</p>{s.price&&<strong>{s.price}</strong>}</article>)}</div></section>
    <section className="cabout" id="ueber"><div className="cshell"><div><div className="ceyebrow">Warum {site.business}?</div><h2>Persönlich statt kompliziert.</h2></div><p>Gute Arbeit beginnt mit klarer Kommunikation. Deshalb wissen unsere Kunden, was passiert, was es kostet und wer ihr Ansprechpartner ist. Genau so sollte ein moderner lokaler Betrieb funktionieren.</p></div></section>
    <section className="ccontact cshell" id="kontakt"><div><div className="ceyebrow">Kontakt</div><h2>Bereit? Wir auch.</h2><p>{site.address}<br/>{site.hours}</p></div><div className="ccontactbox"><a href={`tel:${site.phone.replace(/\s/g,"")}`}><small>TELEFON</small><strong>{site.phone}</strong></a><a href={`mailto:${site.email}`}><small>E-MAIL</small><strong>{site.email}</strong></a></div></section>
    <footer className="cfooter cshell"><strong>{site.business}</strong><span>Demo-Website · erstellt mit WebForge</span><div>Impressum · Datenschutz</div></footer>
  </main>
}