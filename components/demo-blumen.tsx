"use client";

import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

const bouquets = [
  { name: "Sonnenglück", price: 29, text: "Gelb, Apricot und Creme · locker & saisonal", colors: "linear-gradient(145deg,#ffd564,#ff9f74,#f9edd2)" },
  { name: "Rosé Atelier", price: 39, text: "Rosé, Mauve und feines Grün · ruhig & elegant", colors: "linear-gradient(145deg,#f4a7b9,#bd819e,#d5dec8)" },
  { name: "Wild & Frei", price: 34, text: "Kräftige Wiesenfarben · locker & lebendig", colors: "linear-gradient(145deg,#ff785f,#f6c84f,#8761a9)" },
  { name: "Pur Weiß", price: 42, text: "Creme, Weiß und Salbeigrün · modern & klar", colors: "linear-gradient(145deg,#fffdf2,#d9decf,#a5b19a)" },
];

const palettes = [
  { name: "Rosé", colors: ["#ee90aa", "#c7769c", "#f3c5cf"] },
  { name: "Sunset", colors: ["#ff7c61", "#ffbd4b", "#f1d66d"] },
  { name: "Meadow", colors: ["#8f67aa", "#f06475", "#e8b940"] },
  { name: "Ivory", colors: ["#f6f0dc", "#dbe2cb", "#afc1a1"] },
];

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
        <a className={styles.logo} href="#top" aria-label="Blütenliebe Startseite"><span className={styles.logoMark}>BL</span><b>BLÜTENLIEBE</b></a>
        <div className={styles.navLinks}><a href="#collection">Kollektion</a><a href="#builder">Bouquet Builder</a><a href="#atelier">Atelier</a><a href="#kontakt">Kontakt</a></div>
        <div className={styles.navActions}><a className={styles.ghostButton} href="#atelier">Story</a><a className={styles.pill} href="#builder">Strauß gestalten ↗</a></div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Blumenatelier · Hildesheim</div>
          <h1>Flowers with <em>feeling.</em></h1>
          <p>Frische, saisonale Floristik mit eigener Handschrift – ergänzt um einen digitalen Bouquet Builder, der Stimmung, Anlass und Budget zusammenbringt.</p>
          <div className={styles.heroActions}><a className={styles.solidButton} href="#builder">Bouquet gestalten ↗</a><a className={styles.ghostButton} href="#collection">Kollektion ansehen</a></div>
          <div className={styles.facts}>
            <div className={styles.fact}><b>2h</b><span>Abholung</span></div>
            <div className={styles.fact}><b>4×</b><span>frisch / Woche</span></div>
            <div className={styles.fact}><b>100%</b><span>handgebunden</span></div>
          </div>
        </div>
        <div className={`${styles.stage} ${styles.flowerStage}`}>
          <div className={styles.stageTop}><span>BLÜTENLIEBE / TODAY</span><span className={styles.live}><i />Fresh drop</span></div>
          <div className={styles.stageCard}><div><small>HEUTE IM ATELIER</small><b>Pfingstrosen · Levkojen · Wiesenmix</b></div><strong>08:42</strong></div>
        </div>
      </section>

      <section className={styles.section} id="collection">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 01 COLLECTION</small><div><h2>Vier Stimmungen. Kein Standardstrauß.</h2><p>Die Kollektion wirkt wie ein kleiner Shop, bleibt aber bewusst editorial und hochwertig statt nach klassischem Produktgrid auszusehen.</p></div></div>
          <div className={styles.bouquetGrid}>
            {bouquets.map((bouquet) => (
              <article className={styles.bouquetCard} key={bouquet.name}>
                <div className={styles.bouquetVisual} style={{ "--bouquet": bouquet.colors } as React.CSSProperties} />
                <div className={styles.bouquetCopy}><h3>{bouquet.name}</h3><p>{bouquet.text}</p><div className={styles.bouquetBottom}><b>{bouquet.price} €</b><button type="button" onClick={() => { setSelected(bouquet.name); document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" }); }}>Auswählen ↗</button></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="builder">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 02 BOUQUET BUILDER</small><div><h2>Stimmung wählen. Bouquet entsteht.</h2><p>Ein interaktiver Produktberater zeigt, wie eine kleine lokale Marke Beratung digitalisieren kann – ohne komplizierten Shop.</p></div></div>
          <div className={styles.tool}>
            <div className={styles.toolPanel}>
              <div className={styles.moodGrid}>
                <div>
                  <div className={styles.field}><label htmlFor="flower-occasion">Anlass</label><select id="flower-occasion" value={occasion} onChange={(e)=>setOccasion(e.target.value)}><option>Geburtstag</option><option>Jubiläum</option><option>Hochzeit</option><option>Einfach so</option></select></div>
                  <div className={styles.field}><label htmlFor="flower-size">Größe</label><select id="flower-size" value={size} onChange={(e)=>setSize(e.target.value)}><option value="S">S · fein</option><option value="M">M · signature</option><option value="L">L · statement</option></select></div>
                  <label><b style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"#a8b0bb" }}>Stimmung</b></label>
                  <div className={styles.moodChoices} style={{ marginTop:9 }}>
                    {["Elegant","Wild","Soft","Opulent"].map((item)=><button className={styles.moodChoice} data-active={mood===item} type="button" key={item} onClick={()=>setMood(item)}><b>{item}</b><br/><small>{item==="Elegant"?"ruhig & klar":item==="Wild"?"locker & lebendig":item==="Soft"?"leicht & fein":"groß & dramatisch"}</small></button>)}
                  </div>
                  <label><b style={{ display:"block", marginTop:20, fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"#a8b0bb" }}>Palette</b></label>
                  <div className={styles.palette}>{palettes.map((item,index)=><button className={styles.swatch} data-active={palette===index} type="button" aria-label={`Palette ${item.name}`} key={item.name} onClick={()=>setPalette(index)} style={{ background:`linear-gradient(135deg,${item.colors.join(",")})` }} />)}</div>
                </div>
                <div className={styles.previewBouquet} style={{ "--m1": builder.palette.colors[0], "--m2": builder.palette.colors[1], "--m3": builder.palette.colors[2] } as React.CSSProperties}>
                  <div className={styles.previewInfo}><div><small>{occasion.toUpperCase()} · {mood.toUpperCase()}</small><b>{builder.palette.name} Signature</b></div><strong>{builder.price} €</strong></div>
                </div>
              </div>
            </div>
            <div className={styles.toolCopy}>
              <div className={styles.kicker}>Live Recommendation</div><h3>Dein Strauß, bevor er gebunden wird.</h3><p>Der Builder verändert Preis, Farbwelt und Stil direkt. In einem echten Projekt könnte daraus anschließend Warenkorb, Reservierung oder Beratungstermin entstehen.</p>
              <div className={styles.result}><small>DEINE KONFIGURATION</small><b>{builder.price} €</b><p>{occasion} · {mood} · {builder.palette.name} · Größe {size}</p></div>
              <button className={styles.solidButton} style={{ marginTop:16 }} type="button" onClick={()=>{ setSelected(`${builder.palette.name} Signature · ${occasion} · ${mood} · ${size}`); document.getElementById("kontakt")?.scrollIntoView({ behavior:"smooth" }); }}>Konfiguration übernehmen ↗</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="atelier">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 03 ATELIER</small><div><h2>Klein, lokal, bewusst besonders.</h2><p>Mehrmals pro Woche frische Ware, kleine Stückzahlen und saisonale Auswahl – übersetzt in eine ruhige, charaktervolle digitale Marke.</p></div></div>
          <div className={styles.grid3}>
            {[["01","Season first","Blumen nach Saison statt immer dieselbe Massenware."],["02","Handmade","Jeder Strauß wird individuell aufgebaut und gebunden."],["03","Local flow","Online auswählen, Wunsch senden, lokal abholen oder liefern lassen."]].map(([n,t,p])=><article className={styles.card} key={n}><div className={styles.cardNumber}><span>{n}</span><span>ATELIER NOTE</span></div><h3>{t}</h3><p>{p}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div><div className={styles.kicker}>Visit / request</div><h2>Persönlich statt kompliziert.</h2><p>Rosenstraße 8 · 31134 Hildesheim<br/>Mo–Fr 09:00–18:00 · Sa 09:00–14:00</p></div>
          <form onSubmit={(e)=>e.preventDefault()}>
            <label htmlFor="flower-name">Name<input id="flower-name" placeholder="Name" /></label>
            <label htmlFor="flower-contact">E-Mail oder Telefon<input id="flower-contact" placeholder="Kontakt" /></label>
            <label htmlFor="flower-choice">Auswahl<input id="flower-choice" value={selected || ""} onChange={(e)=>setSelected(e.target.value)} placeholder="Bouquet / Anlass" /></label>
            <label htmlFor="flower-message">Wünsche<textarea id="flower-message" rows={4} placeholder="Farben, Abholtag, Grußkarte ..." /></label>
            <button className={styles.solidButton} type="submit">Anfrage simulieren ↗</button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}><div><strong>BLÜTENLIEBE</strong><br/>Blumenatelier · Hildesheim</div><div>Rosenstraße 8 · 05121 200000</div><div className={styles.footerLinks}><span>Impressum</span><span>Datenschutz</span><span>WebForge Demo</span></div></footer>
    </main>
  );
}
