"use client";

import { useMemo, useState } from "react";
import styles from "./showcase-lab.module.css";

const archetypes = [
  {
    id: "service",
    label: "Dienstleister",
    title: "Website für Dienstleistungen",
    accent: "#c8ff4f",
    copy: "Leistungen · Vertrauen · Anfrage",
  },
  {
    id: "commerce",
    label: "Verkauf",
    title: "Website mit Bestellsystem",
    accent: "#ff6b42",
    copy: "Produkte · Warenkorb · Bestellung",
  },
  {
    id: "portal",
    label: "Kundenbereich",
    title: "Geschützter Kundenbereich",
    accent: "#84a7ff",
    copy: "Projekte · Dateien · aktueller Stand",
  },
];

export default function ShowcaseLab() {
  const [type, setType] = useState(0);
  const [motion, setMotion] = useState(true);
  const [automation, setAutomation] = useState(true);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const current = archetypes[type];
  const score = useMemo(() => 78 + (motion ? 8 : 0) + (automation ? 9 : 0), [motion, automation]);

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
        <div className={styles.score}>
          <small>BEISPIEL-WERT</small>
          <strong>{score}</strong>
          <span>/100</span>
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
          <div className={styles.previewHero}>
            <small>BEISPIEL / {current.label.toUpperCase()}</small>
            <h3>{current.title}</h3>
            <p>{current.copy}</p>
            <button type="button">Mehr ansehen ↗</button>
          </div>
          <div className={styles.previewGrid}>
            <article>
              <small>ABLAUF</small>
              <b>01 → 04</b>
              <span>klarer Weg für Kunden</span>
            </article>
            <article className={styles.visualCard}>
              <div className={styles.orb} />
              <small>{motion ? "BEWEGUNGEN AN" : "OHNE BEWEGUNG"}</small>
            </article>
            <article>
              <small>AUTOMATIK</small>
              <b>{automation ? "AN" : "AUS"}</b>
              <span>{automation ? "Abläufe können automatisch weitergehen" : "Schritte werden manuell erledigt"}</span>
            </article>
          </div>
          <div className={styles.ticker}>
            <span>DESIGN</span>
            <i /> <span>ANFRAGEN</span>
            <i /> <span>BESTELLUNGEN</span>
            <i /> <span>KUNDENBEREICH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
