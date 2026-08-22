import type { CSSProperties } from "react";
import type { SiteConfig, SiteModule } from "@/lib/site-config";
import { moduleCatalog } from "@/lib/site-engine";
import styles from "./customer-site.module.css";

const fallbackModuleCopy: Record<SiteModule, { title: string; text: string }> = {
  services: { title: "Leistungen", text: "Die wichtigsten Leistungen verständlich und übersichtlich dargestellt." },
  references: { title: "Referenzen", text: "Ausgewählte Arbeiten und Projekte schaffen Vertrauen vor der Anfrage." },
  contact: { title: "Anfrage", text: "Ein klarer Kontaktweg macht den nächsten Schritt für Interessenten einfach." },
  "cost-estimator": { title: "Kostenrechner", text: "Kunden erhalten direkt eine erste unverbindliche Preisorientierung." },
  menu: { title: "Speisekarte", text: "Gerichte, Preise und Varianten sind direkt auf der eigenen Website verfügbar." },
  cart: { title: "Warenkorb", text: "Produkte und Extras können direkt ausgewählt und gesammelt werden." },
  "order-status": { title: "Bestellstatus", text: "Kunden sehen, wie weit ihre Bestellung oder ihr Auftrag ist." },
  catalog: { title: "Sortiment", text: "Produkte werden strukturiert und auf dem Smartphone gut erfassbar präsentiert." },
  configurator: { title: "Konfigurator", text: "Kunden stellen Produkt oder Leistung passend zu ihren Wünschen zusammen." },
  "customer-portal": { title: "Kundenbereich", text: "Projekte, Dateien und Informationen stehen geschützt an einem Ort bereit." },
  "file-upload": { title: "Datei-Upload", text: "Fotos und Unterlagen können direkt über die Website übermittelt werden." },
  booking: { title: "Terminbuchung", text: "Freie Termine können ohne Rückruf oder E-Mail-Pingpong ausgewählt werden." },
};

function cssVariables(site: SiteConfig): CSSProperties {
  return {
    "--site-primary": site.theme.primary,
    "--site-bg": site.theme.background,
    "--site-fg": site.theme.foreground,
    "--site-muted": site.theme.muted,
  } as CSSProperties;
}

function ModuleCards({ modules }: { modules: readonly SiteModule[] }) {
  return (
    <div className={styles.grid}>
      {modules.map((module, index) => {
        const catalog = moduleCatalog.find((item) => item.id === module);
        const copy = fallbackModuleCopy[module];
        return (
          <article className={styles.card} key={module}>
            <small>{String(index + 1).padStart(2, "0")} · {catalog?.label ?? copy.title}</small>
            <h3>{copy.title}</h3>
            <p>{catalog?.customerValue ?? copy.text}</p>
          </article>
        );
      })}
    </div>
  );
}

export default function CustomerSite({ site }: { site: SiteConfig }) {
  const contactValues = [
    site.contact.phone && ["Telefon", site.contact.phone],
    site.contact.email && ["E-Mail", site.contact.email],
    site.contact.city && ["Ort", [site.contact.postalCode, site.contact.city].filter(Boolean).join(" ")],
    site.contact.openingHours?.length && ["Öffnungszeiten", site.contact.openingHours.join(" · ")],
  ].filter(Boolean) as string[][];

  return (
    <main className={styles.site} style={cssVariables(site)}>
      <nav className={`${styles.nav} ${styles.shell}`}>
        <strong className={styles.brand}>{site.business}</strong>
        <div className={styles.navLinks}>
          <a href="#leistungen">Leistungen</a>
          <a href="#funktionen">Funktionen</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <a className={styles.cta} href="#kontakt">Anfragen ↗</a>
      </nav>

      <section className={`${styles.hero} ${styles.shell}`}>
        <div>
          <span className={styles.eyebrow}>{site.category}</span>
          <h1>{site.tagline}</h1>
          <p>{site.description}</p>
          <a className={styles.cta} href="#kontakt">Unverbindlich anfragen ↗</a>
        </div>
        <aside className={styles.heroCard}>
          <small>{site.business.toUpperCase()}</small>
          <strong>{site.modules.length} Funktionen passend zum Betrieb.</strong>
        </aside>
      </section>

      <section className={styles.section} id="leistungen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Was die Website erledigt</span>
            <div>
              <h2>Einfach für Kunden. Praktisch für den Betrieb.</h2>
              <p>Die Website wird aus wiederverwendbaren Modulen zusammengestellt. Nur die Funktionen, die für das Unternehmen sinnvoll sind, werden aktiviert.</p>
            </div>
          </div>
          <ModuleCards modules={site.modules} />
        </div>
      </section>

      <section className={styles.section} id="funktionen">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Aktivierte Module</span>
            <div>
              <h2>Auf das Unternehmen zugeschnitten.</h2>
              <p>Farben, Inhalte, Kontaktdaten und Module kommen aus einer zentralen Konfiguration. Für einen neuen Kunden muss kein neues Seitengerüst programmiert werden.</p>
            </div>
          </div>
          <div className={styles.modulePills}>
            {site.modules.map((module) => (
              <span key={module}>{moduleCatalog.find((item) => item.id === module)?.label ?? module}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contact} id="kontakt">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div>
            <span className={styles.eyebrow}>Kontakt</span>
            <h2>Wie können wir helfen?</h2>
            <p>Dieser Bereich wird pro Kunde mit echten Kontaktdaten, Formularen oder Terminbuchung verbunden.</p>
          </div>
          <div className={styles.contactBox}>
            {contactValues.length > 0 ? (
              contactValues.map(([label, value]) => (
                <div key={label}><small>{label}</small><strong>{value}</strong></div>
              ))
            ) : (
              <div><small>Kontakt</small><strong>Kontaktdaten werden im Kunden-Onboarding ergänzt.</strong></div>
            )}
          </div>
        </div>
      </section>

      <footer className={`${styles.footer} ${styles.shell}`}>
        <strong>{site.business}</strong>
        <span>Erstellt mit WebForge</span>
      </footer>
    </main>
  );
}
