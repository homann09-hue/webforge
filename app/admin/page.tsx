import { sites } from "@/lib/site-config";
import { isLeadStoreConfigured, listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const configured = isLeadStoreConfigured();
  let leads = [] as Awaited<ReturnType<typeof listLeads>>;
  let loadFailed = false;

  if (configured) {
    try {
      leads = await listLeads(50);
    } catch {
      loadFailed = true;
    }
  }

  const newLeads = leads.filter((lead) => lead.status === "new").length;

  return (
    <main className="admin">
      <aside>
        <a className="brand" href="/"><span>W</span> WebForge</a>
        <nav><b>Übersicht</b><span>Leads</span><span>Kunden</span><span>Websites</span><span>Einstellungen</span></nav>
      </aside>
      <section>
        <div className="adminhead">
          <div><small>WEBFORGE CONTROL</small><h1>Guten Morgen.</h1></div>
          <a className="button" href="/">Website öffnen ↗</a>
        </div>

        <div className="stats">
          <article>
            <small>NEUE LEADS</small>
            <strong>{configured && !loadFailed ? newLeads : "—"}</strong>
            <span>{configured ? (loadFailed ? "Abruf fehlgeschlagen" : `${leads.length} gesamt geladen`) : "DB-Konfiguration ausstehend"}</span>
          </article>
          <article><small>DEMO-SITES</small><strong>{Object.keys(sites).length}</strong><span>bereit zur Präsentation</span></article>
          <article><small>MRR</small><strong>0 €</strong><span>Startphase</span></article>
        </div>

        <div className="adminpanel">
          <div><small>LEADS</small><h2>Neueste Anfragen</h2></div>
          {!configured && <p>Setze SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY, damit Leads persistent gespeichert und hier angezeigt werden.</p>}
          {loadFailed && <p>Die Lead-Datenbank ist konfiguriert, konnte aber nicht gelesen werden.</p>}
          {configured && !loadFailed && leads.length === 0 && <p>Noch keine Anfragen vorhanden.</p>}
          {leads.map((lead) => (
            <div className="adminrow" key={lead.id}>
              <span className="dot" />
              <div><strong>{lead.company}</strong><small>{lead.email}{lead.website ? ` · ${lead.website}` : ""}</small></div>
              <b>{lead.status}</b>
              <small>{new Date(lead.created_at).toLocaleString("de-DE")}</small>
            </div>
          ))}
        </div>

        <div className="adminpanel">
          <div><small>KUNDEN-WEBSITES</small><h2>Vorlagen & Demos</h2></div>
          {Object.values(sites).map((site) => (
            <div className="adminrow" key={site.slug}>
              <span className="dot" />
              <div><strong>{site.business}</strong><small>{site.category}</small></div>
              <b>Demo</b><a href={`/demo/${site.slug}`}>Öffnen ↗</a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
