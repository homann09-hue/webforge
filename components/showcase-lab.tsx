"use client";

import { useState } from "react";
import styles from "./showcase-lab.module.css";

const archetypes = [
  {
    id: "service",
    label: "Dienstleister",
    title: "Website für Dienstleistungen",
    accent: "#c8ff4f",
    copy: "Leistungen zeigen, Vertrauen schaffen und Anfragen einfacher machen.",
    photoClass: styles.photoService,
    badge: "HANDWERK / DIENSTLEISTUNG",
    headline: "Zuverlässige Arbeit. Klar erklärt.",
    meta: "Referenzen · Leistungen · Anfrage",
  },
  {
    id: "commerce",
    label: "Verkauf",
    title: "Website mit Bestellsystem",
    accent: "#ff6b42",
    copy: "Produkte zeigen, Auswahl vereinfachen und Bestellungen direkt annehmen.",
    photoClass: styles.photoCommerce,
    badge: "GASTRO / VERKAUF",
    headline: "Direkt bestellen. Ohne Umwege.",
    meta: "Speisekarte · Warenkorb · Bestellung",
  },
  {
    id: "portal",
    label: "Kundenbereich",
    title: "Website mit Kundenbereich",
    accent: "#84a7ff",
    copy: "Projekte, Dateien und aktuelle Informationen an einem Ort bereitstellen.",
    photoClass: styles.photoPortal,
    badge: "KUNDENBEREICH / SERVICE",
    headline: "Alles Wichtige für Kunden an einem Ort.",
    meta: "Projekte · Dateien · aktueller Stand",
  },
];

export default function ShowcaseLab() {
  const [type, setType] = useState(0);
  const [motion, setMotion] = useState(true);
  const [automation, setAutomation] = useState(true);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const current = archetypes[type];

  return (
    <div className={styles.lab} style={{ "--lab-accent": current.accent } as React.CSSProperties}>
      <div className={styles.controls}>
        <div className={styles.controlBlock}>
          <small>ART DER WEBSITE</small>
          <div className={styles.segmented}>
            {archetypes.map((item, index) => (
              <button type="button" data-active={type === index} key={item.id} onClick={() => setType(index)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlBlock}>
          <small>ZUSATZFUNKTIONEN</small>
          <label className={styles.switch}>
            <input type="checkbox" checked={motion} onChange={(event) => setMotion(event.target.checked)} />
            <span /> Bewegungen
          </label>
          <label className={styles.switch}>
            <input type="checkbox" checked={automation} onChange={(event) => setAutomation(event.target.checked)} />
            <span /> Automatische Abläufe
          </label>
        </div>
        <div className={styles.controlBlock}>
          <small>ANSICHT</small>
          <div className={styles.segmented}>
            <button type="button" data-active={device === "desktop"} onClick={() => setDevice("desktop")}>
              Computer
            </button>
            <button type="button" data-active={device === "mobile"} onClick={() => setDevice("mobile")}>
              Handy
            </button>
          </div>
        </div>
      </div>

      <div className={styles.previewWrap} data-device={device} data-motion={motion}>
        <div className={styles.preview}>
          <div className={styles.previewTop}>
            <span className={styles.mark}>WF</span>
            <div>
              <i />
              <i />
              <i />
            </div>
            <b>Anfragen ↗</b>
          </div>

          <div className={`${styles.realisticHero} ${current.photoClass}`}>
            <div className={styles.photoShade} />
            <div className={styles.photoCopy}>
              <small>{current.badge}</small>
              <h3>{current.headline}</h3>
              <p>{current.copy}</p>
              <button type="button">Mehr ansehen ↗</button>
            </div>
            <div className={styles.photoMeta}>{current.meta}</div>
          </div>

          <div className={styles.realisticInfo}>
            <article>
              <small>KUNDENWEG</small>
              <b>Einfach und verständlich</b>
              <span>Besucher erkennen schnell, was angeboten wird und was sie als Nächstes tun können.</span>
            </article>
            <article>
              <small>{automation ? "AUTOMATISCHE ABLÄUFE" : "MANUELLE ABLÄUFE"}</small>
              <b>{automation ? "Weniger Arbeit im Alltag" : "Klassisch und direkt"}</b>
              <span>
                {automation
                  ? "Anfragen und Informationen können automatisch weitergegeben werden."
                  : "Alle Schritte können auch ganz normal manuell bearbeitet werden."}
              </span>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
