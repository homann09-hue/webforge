"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./demo-experience.module.css";

type MenuItem = { id: number; name: string; desc: string; price: number; tag: string };
type CartItem = MenuItem & { qty: number; size: "M" | "L"; extras: string[] };

const menu: MenuItem[] = [
  { id: 1, name: "Margherita 2.0", desc: "San Marzano · Fior di Latte · Basilikum", price: 9.9, tag: "KLASSIKER" },
  { id: 2, name: "Inferno", desc: "Scharfe Salami · Chili · Honig · Mozzarella", price: 12.9, tag: "SCHARF" },
  { id: 3, name: "Burrata Club", desc: "Burrata · Tomate · Pesto · Rucola", price: 13.9, tag: "BELIEBT" },
  {
    id: 4,
    name: "Trüffel Bianca",
    desc: "Pilze · Trüffelcreme · Parmesan · Fior di Latte",
    price: 14.9,
    tag: "SPECIAL",
  },
  { id: 5, name: "Pasta Verde", desc: "Pesto · Parmesan · Kirschtomaten · Rucola", price: 11.9, tag: "PASTA" },
  { id: 6, name: "Tiramisu", desc: "Mascarpone · Espresso · Kakao", price: 5.9, tag: "DESSERT" },
];
const extraPrices: Record<string, number> = {
  "Extra Käse": 1.5,
  Salami: 2,
  Jalapeños: 1,
  Champignons: 1.5,
  Burrata: 3.5,
};
const money = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;
function photo(position: string): CSSProperties {
  return {
    backgroundImage: "url('/demo/ai-demo-sprite.webp')",
    backgroundSize: "300% 300%",
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  };
}

export default function DemoGastro() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [config, setConfig] = useState<MenuItem | null>(null);
  const [size, setSize] = useState<"M" | "L">("M");
  const [extras, setExtras] = useState<string[]>([]);
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [kitchenStep, setKitchenStep] = useState(1);
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item.price +
            (item.size === "L" ? 3 : 0) +
            item.extras.reduce((total, extra) => total + (extraPrices[extra] || 0), 0)) *
            item.qty,
        0,
      ),
    [cart],
  );
  const delivery = mode === "delivery" && subtotal < 25 ? 2.9 : 0;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  function startConfig(item: MenuItem) {
    setConfig(item);
    setSize("M");
    setExtras([]);
  }
  function toggleExtra(extra: string) {
    setExtras((current) => (current.includes(extra) ? current.filter((item) => item !== extra) : [...current, extra]));
  }
  function addConfigured() {
    if (!config) return;
    setCart((current) => [...current, { ...config, size, extras, qty: 1 }]);
    setConfig(null);
    setDrawer(true);
  }
  function changeQty(index: number, delta: number) {
    setCart((current) =>
      current
        .map((item, itemIndex) => (itemIndex === index ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0),
    );
  }
  function simulateOrder() {
    if (!cart.length) return;
    setDrawer(false);
    setKitchenStep(2);
    window.setTimeout(() => setKitchenStep(3), 900);
    window.setTimeout(() => setKitchenStep(4), 1800);
  }

  return (
    <main className={`${styles.demo} ${styles.gastro}`}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <a className={styles.logo} href="#top" aria-label="Forno 37 Startseite">
          <span className={styles.logoMark}>F37</span>
          <b>FORNO 37</b>
        </a>
        <div className={styles.navLinks}>
          <a href="#menu">Speisekarte</a>
          <a href="#kitchen">Bestellstatus</a>
          <a href="#story">Über uns</a>
          <a href="#info">Lieferung</a>
        </div>
        <div className={styles.navActions}>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => setMode(mode === "delivery" ? "pickup" : "delivery")}
          >
            {mode === "delivery" ? "Lieferung" : "Abholung"}
          </button>
          <button className={styles.pill} type="button" onClick={() => setDrawer(true)}>
            Warenkorb · {count}
          </button>
        </div>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>Pizza · Pasta · Hildesheim</div>
          <h1>
            Einfach auswählen. <em>Direkt bestellen.</em>
          </h1>
          <p>
            Kunden wählen ihr Gericht, passen Größe und Extras an und bestellen direkt beim Restaurant – ohne fremde
            Plattform.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.solidButton} href="#menu">
              Speisekarte öffnen ↗
            </a>
            <a className={styles.ghostButton} href="#kitchen">
              Bestellstatus ansehen
            </a>
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <b>25–40</b>
              <span>Minuten Lieferzeit</span>
            </div>
            <div className={styles.fact}>
              <b>4,8 ★</b>
              <span>Bewertung</span>
            </div>
            <div className={styles.fact}>
              <b>430°C</b>
              <span>Pizzaofen</span>
            </div>
          </div>
        </div>
        <div className={styles.stage} style={photo("100% 100%")}>
          <div className={styles.stageTop}>
            <span>FORNO 37 / RESTAURANT</span>
            <span className={styles.live}>
              <i />
              Jetzt geöffnet
            </span>
          </div>
          <div className={styles.stageCard}>
            <div>
              <small>HEUTE ABEND</small>
              <b>Direkt bestellen · Lieferung oder Abholung</b>
            </div>
            <strong>16–23</strong>
          </div>
        </div>
      </section>

      <section className={styles.section} id="menu">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 01 SPEISEKARTE</small>
            <div>
              <h2>Gericht auswählen und direkt anpassen.</h2>
              <p>Größen und Extras lassen sich direkt beim Produkt wählen – ohne Anruf.</p>
            </div>
          </div>
          <div
            style={{ ...photo("0% 50%"), minHeight: 420, borderRadius: 30, marginBottom: 28 }}
            role="img"
            aria-label="KI-generiertes Beispielbild eines Gerichts"
          />
          <div className={styles.menuGrid}>
            {menu.map((item) => (
              <article className={styles.menuCard} key={item.id}>
                <div className={styles.menuCopy}>
                  <small>{item.tag}</small>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                  <div className={styles.menuBuy}>
                    <b>ab {money(item.price)}</b>
                    <button type="button" aria-label={`${item.name} auswählen`} onClick={() => startConfig(item)}>
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="kitchen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 02 BESTELLSTATUS</small>
            <div>
              <h2>Kunden sehen, was mit ihrer Bestellung passiert.</h2>
              <p>Vom Eingang bis zur Abholung oder Lieferung.</p>
            </div>
          </div>
          <div
            style={{ ...photo("0% 100%"), minHeight: 380, borderRadius: 28, marginBottom: 28 }}
            role="img"
            aria-label="KI-generiertes Beispielbild der Bestellvorbereitung"
          />
          <div className={styles.kitchen}>
            {[
              [1, "Bestellung eingegangen", "Im Restaurant angekommen."],
              [2, "Wird vorbereitet", "Zutaten und Teig werden vorbereitet."],
              [3, "Im Ofen", "Die Pizza wird gebacken."],
              [4, "Fertig", "Bereit zur Abholung oder für den Fahrer."],
            ].map(([step, title, text]) => (
              <article className={styles.kitchenStep} data-active={kitchenStep >= Number(step)} key={title}>
                <small>0{step}</small>
                <b>{title}</b>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button
              className={styles.solidButton}
              type="button"
              onClick={() => (cart.length ? simulateOrder() : startConfig(menu[2]))}
            >
              {cart.length ? "Bestellung testen ↗" : "Erst ein Gericht hinzufügen ↗"}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section} id="story">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <small>/ 03 ÜBER FORNO 37</small>
            <div>
              <h2>Direkte Bestellung statt Plattformgebühren.</h2>
              <p>Eine eigene Bestellseite gibt dem Restaurant mehr Kontrolle und bleibt für Kunden einfach.</p>
            </div>
          </div>
          <div className={styles.grid3}>
            {[
              ["48 Stunden Teigruhe", "Mehr Geschmack und bessere Struktur im Teig."],
              ["Direkt beim Restaurant", "Die Bestellung läuft über die eigene Website."],
              ["Fürs Handy gemacht", "Auswählen, anpassen und bestellen funktioniert bequem mobil."],
            ].map(([title, text], index) => (
              <article className={styles.card} key={title}>
                <div className={styles.cardNumber}>
                  <span>0{index + 1}</span>
                  <span>FORNO 37</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="info">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div>
            <div className={styles.kicker}>Lieferung & Abholung</div>
            <h2>Heute bis 23 Uhr geöffnet.</h2>
            <p>Lieferung in Hildesheim und bis 8 km Umgebung. Mindestbestellwert 15 €.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setDrawer(true);
            }}
          >
            <label htmlFor="g-mode">
              Bestellung
              <select
                id="g-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as "delivery" | "pickup")}
              >
                <option value="delivery">Lieferung</option>
                <option value="pickup">Abholung</option>
              </select>
            </label>
            <label htmlFor="g-street">
              Straße & Hausnummer
              <input id="g-street" placeholder="Musterstraße 12" />
            </label>
            <label htmlFor="g-city">
              PLZ / Ort
              <input id="g-city" placeholder="31134 Hildesheim" />
            </label>
            <button className={styles.solidButton} type="submit">
              Warenkorb öffnen ↗
            </button>
          </form>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <div>
          <strong>FORNO 37</strong>
          <br />
          Pizza · Pasta · Hildesheim
        </div>
        <div>Di–So · 16–23 Uhr</div>
        <div className={styles.footerLinks}>
          <span>Impressum</span>
          <span>Datenschutz</span>
          <span>WebForge Demo</span>
        </div>
      </footer>

      {config && (
        <div className={styles.overlay} onClick={() => setConfig(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <button
              className={styles.drawerClose}
              style={{ position: "absolute", right: 20, top: 20 }}
              type="button"
              onClick={() => setConfig(null)}
            >
              ×
            </button>
            <div className={styles.kicker}>Gericht anpassen</div>
            <h2>{config.name}</h2>
            <p>{config.desc}</p>
            <label htmlFor="g-size">
              <b>Größe</b>
            </label>
            <div className={styles.optionRow} id="g-size">
              <button data-active={size === "M"} type="button" onClick={() => setSize("M")}>
                M · 28 cm
              </button>
              <button data-active={size === "L"} type="button" onClick={() => setSize("L")}>
                L · 32 cm +3 €
              </button>
            </div>
            <label htmlFor="g-extras">
              <b>Extras</b>
            </label>
            <div className={styles.optionRow} id="g-extras">
              {Object.entries(extraPrices).map(([extra, price]) => (
                <button
                  data-active={extras.includes(extra)}
                  type="button"
                  key={extra}
                  onClick={() => toggleExtra(extra)}
                >
                  {extra} +{money(price)}
                </button>
              ))}
            </div>
            <div className={styles.result}>
              <small>PREIS</small>
              <b>
                {money(
                  config.price +
                    (size === "L" ? 3 : 0) +
                    extras.reduce((total, extra) => total + extraPrices[extra], 0),
                )}
              </b>
            </div>
            <button
              className={styles.solidButton}
              style={{ width: "100%", marginTop: 16 }}
              type="button"
              onClick={addConfigured}
            >
              In den Warenkorb ↗
            </button>
          </div>
        </div>
      )}

      {drawer && (
        <aside className={styles.drawer} aria-label="Warenkorb">
          <div className={styles.drawerHead}>
            <div>
              <small>IHRE BESTELLUNG</small>
              <h2>Warenkorb</h2>
            </div>
            <button className={styles.drawerClose} type="button" onClick={() => setDrawer(false)}>
              ×
            </button>
          </div>
          {!cart.length ? (
            <p style={{ color: "var(--muted)", marginTop: 30 }}>Der Warenkorb ist noch leer.</p>
          ) : (
            cart.map((item, index) => (
              <div className={styles.cartLine} key={`${item.id}-${index}`}>
                <div>
                  <b>
                    {item.name} · {item.size}
                  </b>
                  <small>{item.extras.length ? item.extras.join(", ") : "ohne Extras"}</small>
                  <span>
                    {money(
                      (item.price +
                        (item.size === "L" ? 3 : 0) +
                        item.extras.reduce((total, extra) => total + extraPrices[extra], 0)) *
                        item.qty,
                    )}
                  </span>
                </div>
                <div className={styles.qty}>
                  <button type="button" onClick={() => changeQty(index, -1)}>
                    −
                  </button>
                  <b>{item.qty}</b>
                  <button type="button" onClick={() => changeQty(index, 1)}>
                    +
                  </button>
                </div>
              </div>
            ))
          )}
          {cart.length > 0 && (
            <div className={styles.cartTotals}>
              <div>
                <span>Zwischensumme</span>
                <b>{money(subtotal)}</b>
              </div>
              <div>
                <span>{mode === "delivery" ? "Lieferung" : "Abholung"}</span>
                <b>{money(delivery)}</b>
              </div>
              <div className={styles.grand}>
                <span>Gesamt</span>
                <b>{money(subtotal + delivery)}</b>
              </div>
              <button className={styles.solidButton} type="button" onClick={simulateOrder}>
                Bestellung simulieren ↗
              </button>
              <small>Demo – keine Zahlung, keine echte Bestellung.</small>
            </div>
          )}
        </aside>
      )}
    </main>
  );
}
