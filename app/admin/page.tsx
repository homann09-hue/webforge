"use client";

import { useEffect, useMemo, useState } from "react";
import { sites } from "@/lib/site-config";
import type { Lead, LeadStatus } from "@/lib/leads";

const statusLabels: Record<LeadStatus, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  qualified: "Qualifiziert",
  won: "Gewonnen",
  lost: "Verloren",
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const newLeads = useMemo(() => leads.filter((lead) => lead.status === "new").length, [leads]);
  const wonLeads = useMemo(() => leads.filter((lead) => lead.status === "won").length, [leads]);

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

  async function changeStatus(leadId: string, status: LeadStatus) {
    setSavingId(leadId);
    setError("");
    try {
      const response = await fetch("/api/admin/leads/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, leadId, status }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Status konnte nicht gespeichert werden.");
      setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, status } : lead));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" onClick={() => void loadLeads()} disabled={loading}>{loading ? "Lädt …" : "Aktualisieren"}</button>
            <button className="button" onClick={logout}>Abmelden</button>
          </div>
        </div>

        <div className="stats">
          <article><small>NEUE LEADS</small><strong>{newLeads}</strong><span>{leads.length} gesamt</span></article>
          <article><small>GEWONNEN</small><strong>{wonLeads}</strong><span>als Kunde markiert</span></article>
          <article><small>DEMO-SITES</small><strong>{Object.keys(sites).length}</strong><span>bereit zur Präsentation</span></article>
        </div>

        <div className="adminpanel">
          <div><small>LEADS</small><h2>Neueste Anfragen</h2></div>
          {error && <p>{error}</p>}
          {!loading && leads.length === 0 && <p>Noch keine Anfragen vorhanden.</p>}
          {leads.map((lead) => (
            <div className="adminrow" key={lead.id}>
              <span className="dot" />
              <div>
                <strong>{lead.company}</strong>
                <small>
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                  {lead.website ? <> · <a href={/^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a></> : null}
                </small>
              </div>
              <select
                value={lead.status}
                disabled={savingId === lead.id}
                onChange={(event) => void changeStatus(lead.id, event.target.value as LeadStatus)}
                aria-label={`Status für ${lead.company}`}
              >
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
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
