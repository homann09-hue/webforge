"use client";

import { useMemo, useState } from "react";
import styles from "./showcase-lab.module.css";

const archetypes = [
  { id: "service", label: "Service", title: "Premium Service", accent: "#c8ff4f", copy: "Lead Flow · Trust · Booking" },
  { id: "commerce", label: "Commerce", title: "Direct Commerce", accent: "#ff6b42", copy: "Products · Cart · Checkout" },
  { id: "portal", label: "Portal", title: "Client Portal", accent: "#84a7ff", copy: "Projects · Files · Status" },
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
          <small>EXPERIENCE TYPE</small>
          <div className={styles.segmented}>{archetypes.map((item,index)=><button type="button" data-active={type===index} key={item.id} onClick={()=>setType(index)}>{item.label}</button>)}</div>
        </div>
        <div className={styles.controlBlock}>
          <small>SYSTEM</small>
          <label className={styles.switch}><input type="checkbox" checked={motion} onChange={(e)=>setMotion(e.target.checked)} /><span />Motion</label>
          <label className={styles.switch}><input type="checkbox" checked={automation} onChange={(e)=>setAutomation(e.target.checked)} /><span />Automation</label>
        </div>
        <div className={styles.controlBlock}>
          <small>VIEWPORT</small>
          <div className={styles.segmented}><button type="button" data-active={device==="desktop"} onClick={()=>setDevice("desktop")}>Desktop</button><button type="button" data-active={device==="mobile"} onClick={()=>setDevice("mobile")}>Mobile</button></div>
        </div>
        <div className={styles.score}><small>EXPERIENCE SCORE</small><strong>{score}</strong><span>/100</span></div>
      </div>

      <div className={styles.previewWrap} data-device={device} data-motion={motion}>
        <div className={styles.preview}>
          <div className={styles.previewTop}><span className={styles.mark}>WF</span><div><i/><i/><i/></div><b>Start ↗</b></div>
          <div className={styles.previewHero}>
            <small>NEXT-GEN / {current.label.toUpperCase()}</small>
            <h3>{current.title}</h3>
            <p>{current.copy}</p>
            <button type="button">Explore system ↗</button>
          </div>
          <div className={styles.previewGrid}>
            <article><small>FLOW</small><b>01 → 04</b><span>Conversion path</span></article>
            <article className={styles.visualCard}><div className={styles.orb}/><small>{motion?"MOTION ACTIVE":"STATIC MODE"}</small></article>
            <article><small>AUTOMATION</small><b>{automation?"LIVE":"OFF"}</b><span>{automation?"Connected workflow":"Manual process"}</span></article>
          </div>
          <div className={styles.ticker}><span>DESIGN</span><i/> <span>INTERACTION</span><i/> <span>COMMERCE</span><i/> <span>PORTALS</span></div>
        </div>
      </div>
    </div>
  );
}
