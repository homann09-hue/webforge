"use client";

import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

type MenuItem = { id: number; name: string; desc: string; price: number; tag: string };
type CartItem = MenuItem & { qty: number; size: "M" | "L"; extras: string[] };

const menu: MenuItem[] = [
  { id: 1, name: "Margherita 2.0", desc: "San Marzano · Fior di Latte · Basilikum", price: 9.9, tag: "CLASSIC" },
  { id: 2, name: "Inferno", desc: "Scharfe Salami · Chili · Honig · Mozzarella", price: 12.9, tag: "SPICY" },
  { id: 3, name: "Burrata Club", desc: "Burrata · Tomate · Pesto · Rucola", price: 13.9, tag: "BESTSELLER" },
  { id: 4, name: "Trüffel Bianca", desc: "Pilze · Trüffelcreme · Parmesan · Fior di Latte", price: 14.9, tag: "SPECIAL" },
  { id: 5, name: "Pasta Verde", desc: "Pesto · Parmesan · Kirschtomaten · Rucola", price: 11.9, tag: "PASTA" },
  { id: 6, name: "Tiramisu", desc: "Mascarpone · Espresso · Kakao", price: 5.9, tag: "SWEET" },
];

const extraPrices: Record<string, number> = { "Extra Käse": 1.5, Salami: 2, Jalapeños: 1, Champignons: 1.5, Burrata: 3.5 };
const money = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;

export default function DemoGastro() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [config, setConfig] = useState<MenuItem | null>(null);
  const [size, setSize] = useState<"M" | "L">("M");
  const [extras, setExtras] = useState<string[]>([]);
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [kitchenStep, setKitchenStep] = useState(1);

  const subtotal = useMemo(() => cart.reduce((sum, item) => {
    const unit = item.price + (item.size === "L" ? 3 : 0) + item.extras.reduce((a, e) => a + (extraPrices[e] || 0), 0);
    return sum + unit * item.qty;
  }, 0), [cart]);
  const delivery = mode === "delivery" && subtotal < 25 ? 2.9 : 0;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  function startConfig(item: MenuItem) { setConfig(item); setSize("M"); setExtras([]); }
  function toggleExtra(extra: string) { setExtras((current) => current.includes(extra) ? current.filter((x) => x !== extra) : [...current, extra]); }
  function addConfigured() {
    if (!config) return;
    setCart((current) => [...current, { ...config, size, extras, qty: 1 }]);
    setConfig(null); setDrawer(true);
  }
  function changeQty(index: number, delta: number) {
    setCart((current) => current.map((item, i) => i === index ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter((item) => item.qty > 0));
  }
  function simulateOrder() {
    if (!cart.length) return;
    setDrawer(false); setKitchenStep(2);
    window.setTimeout(() => setKitchenStep(3), 900);
    window.setTimeout(() => setKitchenStep(4), 1800);
  }

  return (
    <main className={`${styles.demo} ${styles.gastro}`}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.logo} href="#top" aria-label="Forno 37 Startseite"><span className={styles.logoMark}>F37</span><b>FORNO 37</b></a>
        <div className={styles.navLinks}><a href="#menu">Menu</a><a href="#kitchen">Kitchen Live</a><a href="#story">Story</a><a href="#info">Info</a></div>
        <div className={styles.navActions}>
          <button className={styles.ghostButton} type="button" onClick={() => setMode(mode === "delivery" ? "pickup" : "delivery")}>{mode === "delivery" ? "Lieferung" : "Abholung"}</button>
          <button className={styles.pill} type="button" onClick={() => setDrawer(true)}>Warenkorb · {count}</button>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Pizza · Pasta · Hildesheim</div>
          <h1>Hot. Fast. <em>Forno.</em></h1>
          <p>48 Stunden Teigruhe, 430°C Ofen und ein Bestellflow ohne Marktplatz-Umwege. Größen, Extras, Cart und Order-Status direkt in der Demo.</p>
          <div className={styles.heroActions}><a className={styles.solidButton} href="#menu">Jetzt konfigurieren ↗</a><a className={styles.ghostButton} href="#kitchen">Kitchen live ansehen</a></div>
          <div className={styles.facts}>
            <div className={styles.fact}><b>25–40</b><span>Minuten</span></div>
            <div className={styles.fact}><b>4,8 ★</b><span>Rating</span></div>
            <div className={styles.fact}><b>430°C</b><span>Ofen</span></div>
          </div>
        </div>
        <div className={`${styles.stage} ${styles.gastroStage}`}>
          <div className={styles.stageTop}><span>FORNO 37 / KITCHEN</span><span className={styles.live}><i />Open now</span></div>
          <div className={styles.pizzaOrbit} />
          <div className={styles.stageCard}><div><small>FASTEST PICK</small><b>Burrata Club · L</b></div><strong>13:42</strong></div>
        </div>
      </section>

      <section className={styles.section} id="menu">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 01 MENU</small><div><h2>Tippen. Anpassen. Fertig.</h2><p>Jedes Produkt öffnet einen echten Konfigurator für Größe und Extras – genau die Art Funktion, die ein Lieferdienst direkt monetarisieren kann.</p></div></div>
          <div className={styles.menuGrid}>
            {menu.map((item) => (
              <article className={styles.menuCard} key={item.id}>
                <div className={styles.foodVisual}><span className={styles.foodTag}>{item.tag}</span></div>
                <div className={styles.menuCopy}><h3>{item.name}</h3><p>{item.desc}</p><div className={styles.menuBuy}><b>ab {money(item.price)}</b><button type="button" aria-label={`${item.name} konfigurieren`} onClick={() => startConfig(item)}>+</button></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="kitchen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 02 KITCHEN LIVE</small><div><h2>Bestellung sichtbar machen.</h2><p>Nach der simulierten Bestellung läuft der Status durch die Küchenstationen – ein Beispiel für Live-Order-Tracking.</p></div></div>
          <div className={styles.kitchen}>
            {[[1,"Eingang","Order empfangen"],[2,"Prep","Zutaten + Teig"],[3,"Ofen","430°C · 90 Sek."],[4,"Ready","Abholung / Fahrer"]].map(([step,title,text]) => (
              <article className={styles.kitchenStep} data-active={kitchenStep >= Number(step)} key={title}><small>0{step}</small><b>{title}</b><p>{text}</p></article>
            ))}
          </div>
          <div style={{ marginTop: 20 }}><button className={styles.solidButton} type="button" onClick={() => { if (!cart.length) startConfig(menu[2]); else simulateOrder(); }}>{cart.length ? "Demo-Bestellung starten ↗" : "Erst Bestseller hinzufügen ↗"}</button></div>
        </div>
      </section>

      <section className={styles.section} id="story">
        <div className={styles.shell}>
          <div className={styles.sectionHead}><small>/ 03 BRAND STORY</small><div><h2>Wenig Schnickschnack. Viel Geschmack.</h2><p>Das visuelle System ist bewusst warm, schnell und direkt. Keine generische Restaurant-Seite, sondern eine eigene Marke mit Commerce-Fokus.</p></div></div>
          <div className={styles.grid3}>
            {["48h Teigruhe","Direkt statt Plattform","Mobile-first Order"].map((title, i) => <article className={styles.card} key={title}><div className={styles.cardNumber}><span>0{i+1}</span><span>FORNO SYSTEM</span></div><h3>{title}</h3><p>{i===0?"Mehr Geschmack und bessere Struktur im Teig.":i===1?"Kundendaten und Marge bleiben beim Betrieb.":"Konfigurieren, bezahlen und Status prüfen auf dem Smartphone."}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="info">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div><div className={styles.kicker}>Delivery info</div><h2>Heute bis 23 Uhr.</h2><p>Hildesheim + 8 km · Ab 15 € Mindestbestellwert · ab 25 € kostenlose Lieferung. Diese Demo löst keine echte Bestellung aus.</p></div>
          <form onSubmit={(e) => { e.preventDefault(); setDrawer(true); }}>
            <label htmlFor="g-mode">Bestellart<select id="g-mode" value={mode} onChange={(e)=>setMode(e.target.value as "delivery"|"pickup")}><option value="delivery">Lieferung</option><option value="pickup">Abholung</option></select></label>
            <label htmlFor="g-street">Adresse<input id="g-street" placeholder="Straße & Hausnummer" /></label>
            <label htmlFor="g-city">PLZ / Ort<input id="g-city" placeholder="31134 Hildesheim" /></label>
            <button className={styles.solidButton} type="submit">Bestellung öffnen ↗</button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}><div><strong>FORNO 37</strong><br/>Pizza · Pasta · Hildesheim</div><div>Di–So · 16–23 Uhr</div><div className={styles.footerLinks}><span>Impressum</span><span>Datenschutz</span><span>WebForge Demo</span></div></footer>

      {config && <div className={styles.overlay} onClick={() => setConfig(null)}>
        <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
          <button className={styles.drawerClose} style={{ position:"absolute", right:20, top:20 }} type="button" onClick={() => setConfig(null)}>×</button>
          <div className={styles.kicker}>Configure</div><h2>{config.name}</h2><p>{config.desc}</p>
          <label htmlFor="g-size"><b>Größe</b></label>
          <div className={styles.optionRow} id="g-size"><button data-active={size==="M"} type="button" onClick={()=>setSize("M")}>M · 28 cm</button><button data-active={size==="L"} type="button" onClick={()=>setSize("L")}>L · 32 cm +3 €</button></div>
          <label htmlFor="g-extras"><b>Extras</b></label>
          <div className={styles.optionRow} id="g-extras">{Object.entries(extraPrices).map(([extra,price])=><button data-active={extras.includes(extra)} type="button" key={extra} onClick={()=>toggleExtra(extra)}>{extra} +{money(price)}</button>)}</div>
          <div className={styles.result}><small>DEIN PREIS</small><b>{money(config.price + (size==="L"?3:0) + extras.reduce((a,e)=>a+extraPrices[e],0))}</b><p>Alle Anpassungen werden direkt im Warenkorb übernommen.</p></div>
          <button className={styles.solidButton} style={{ width:"100%", marginTop:16 }} type="button" onClick={addConfigured}>In den Warenkorb ↗</button>
        </div>
      </div>}

      {drawer && <aside className={styles.drawer} aria-label="Warenkorb">
        <div className={styles.drawerHead}><div><small>DEINE BESTELLUNG</small><h2>Warenkorb</h2></div><button className={styles.drawerClose} type="button" onClick={()=>setDrawer(false)}>×</button></div>
        {!cart.length ? <p style={{ color:"var(--muted)", marginTop:30 }}>Noch leer. Öffne ein Gericht und konfiguriere deine erste Bestellung.</p> : cart.map((item,index)=><div className={styles.cartLine} key={`${item.id}-${index}`}><div><b>{item.name} · {item.size}</b><small>{item.extras.length?item.extras.join(", "):"ohne Extras"}</small><span>{money((item.price+(item.size==="L"?3:0)+item.extras.reduce((a,e)=>a+extraPrices[e],0))*item.qty)}</span></div><div className={styles.qty}><button type="button" onClick={()=>changeQty(index,-1)}>−</button><b>{item.qty}</b><button type="button" onClick={()=>changeQty(index,1)}>+</button></div></div>)}
        {cart.length>0 && <div className={styles.cartTotals}><div><span>Zwischensumme</span><b>{money(subtotal)}</b></div><div><span>{mode==="delivery"?"Lieferung":"Abholung"}</span><b>{money(delivery)}</b></div><div className={styles.grand}><span>Gesamt</span><b>{money(subtotal+delivery)}</b></div><button className={styles.solidButton} type="button" onClick={simulateOrder}>Bestellung simulieren ↗</button><small>Demo – keine Zahlung, keine echte Bestellung.</small></div>}
      </aside>}
    </main>
  );
}
