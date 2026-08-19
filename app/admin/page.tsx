"use client";

import { useEffect, useMemo, useState } from "react";
import { sites } from "@/lib/site-config";
import type { Lead } from "@/lib/leads";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const newLeads = useMemo(() => leads.filter((lead) => lead.status === "new").length, [leads]);

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) {
      setPassword(saved);
      void loadLeads(saved);
    }
  }, []);

  async function loadLeads(candidate = password) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: candidate }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
      setLeads(data.leads as Lead[]);
      setAuthenticated(true);
      sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false);
      sessionStorage.removeItem("webforge_admin_password");
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("webforge_admin_password");
    setPassword("");
    setLeads([]);
    setAuthenticated(false);
    setError("");
  }

  if (!authenticated) {
    return (
      <main className="admin">
        <aside>
          <a className="brand" href="/"><span>W</span> WebForge</a>
          <nav><b>Admin</b></nav>
        </aside>
        <section>
          <div className="adminhead">
            <div><small>WEBFORGE CONTROL</small><h1>Admin Login</h1></div>
            <a className="button" href="/">Website öffnen ↗</a>
          </div>
          <div className="adminpanel">
            <small>SICHERER ZUGANG</small>
            <h2>Leads & Websites verwalten</h2>
            <p>Gib dein WebForge-Adminpasswort ein.</p>
            <form onSubmit={(event) => { event.preventDefault(); void loadLeads(); }} style={{ display: "grid", gap: 12, maxWidth: 440 }}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Adminpasswort"
                autoComplete="current-password"
                required
              />
              <button className="button" type="submit" disabled={loading}>{loading ? "Prüfe …" : "Einloggen"}</button>
              {error && <p>{error}</p>}
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin">
      <aside>
        <a className="brand" href="/"><span>W</span> WebForge</a>
        <nav><b>Übersicht</b><span>Leads</span><span>Kunden</span><span>Websites</span></nav>
      </aside>
      <section>
        <div className="adminhead">
          <div><small>WEBFORGE CONTROL</small><h1>Übersicht</h1></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" onClick={() => void loadLeads()} disabled={loading}>{loading ? "Lädt …" : "Aktualisieren"}</button>
            <button className="button" onClick={logout}>Abmelden</button>
          </div>
        </div>

        <div className="stats">
          <article><small>NEUE LEADS</small><strong>{newLeads}</strong><span>{leads.length} gesamt geladen</span></article>
          <article><small>DEMO-SITES</small><strong>{Object.keys(sites).length}</strong><span>bereit zur Präsentation</span></article>
          <article><small>MRR</small><strong>0 €</strong><span>Startphase</span></article>
        </div>

        <div className="adminpanel">
          <div><small>LEADS</small><h2>Neueste Anfragen</h2></div>
          {error && <p>{error}</p>}
          {!loading && leads.length === 0 && <p>Noch keine Anfragen vorhanden.</p>}
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
