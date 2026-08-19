"use client";

import { useEffect, useMemo, useState } from "react";
import { sites } from "@/lib/site-config";
import type { Lead, LeadStatus } from "@/lib/leads";

const statusLabels: Record<LeadStatus, string> = { new: "Neu", contacted: "Kontaktiert", qualified: "Qualifiziert", won: "Gewonnen", lost: "Verloren" };

export default function Admin() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [lead.company, lead.email, lead.website || "", lead.notes || ""].some((value) => value.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesArchive = showArchived ? Boolean(lead.archived_at) : !lead.archived_at;
    return matchesSearch && matchesStatus && matchesArchive;
  }), [leads, search, statusFilter, showArchived]);

  const newLeads = leads.filter((lead) => lead.status === "new" && !lead.archived_at).length;
  const wonLeads = leads.filter((lead) => lead.status === "won" && !lead.archived_at).length;

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) { setPassword(saved); void loadLeads(saved); }
  }, []);

  async function loadLeads(candidate = password) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: candidate }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
      setLeads(data.leads as Lead[]);
      setDraftNotes(Object.fromEntries((data.leads as Lead[]).map((lead) => [lead.id, lead.notes || ""])));
      setAuthenticated(true);
      sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false); sessionStorage.removeItem("webforge_admin_password"); setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally { setLoading(false); }
  }

  async function post(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, ...body }) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Änderung fehlgeschlagen.");
    return data;
  }

  async function changeStatus(leadId: number, status: LeadStatus) {
    setSavingId(leadId); setError("");
    try { await post("/api/admin/leads/status", { leadId, status }); setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, status } : lead)); }
    catch (err) { setError(err instanceof Error ? err.message : "Status konnte nicht gespeichert werden."); }
    finally { setSavingId(null); }
  }

  async function saveNotes(leadId: number) {
    setSavingId(leadId); setError("");
    try { const notes = draftNotes[leadId] || ""; await post("/api/admin/leads/manage", { action: "notes", leadId, notes }); setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, notes: notes.trim() || null } : lead)); }
    catch (err) { setError(err instanceof Error ? err.message : "Notiz konnte nicht gespeichert werden."); }
    finally { setSavingId(null); }
  }

  async function markContacted(leadId: number) {
    setSavingId(leadId); setError("");
    try { const data = await post("/api/admin/leads/manage", { action: "contacted", leadId }); setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, last_contacted_at: data.lastContactedAt, status: lead.status === "new" ? "contacted" : lead.status } : lead)); }
    catch (err) { setError(err instanceof Error ? err.message : "Kontakt konnte nicht gespeichert werden."); }
    finally { setSavingId(null); }
  }

  async function toggleArchive(lead: Lead) {
    setSavingId(lead.id); setError("");
    try { await post("/api/admin/leads/manage", { action: "archive", leadId: lead.id, archived: !lead.archived_at }); setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, archived_at: lead.archived_at ? null : new Date().toISOString() } : item)); }
    catch (err) { setError(err instanceof Error ? err.message : "Archivierung fehlgeschlagen."); }
    finally { setSavingId(null); }
  }

  async function removeLead(lead: Lead) {
    if (!confirm(`Lead „${lead.company}“ endgültig löschen?`)) return;
    setSavingId(lead.id); setError("");
    try { await post("/api/admin/leads/manage", { action: "delete", leadId: lead.id }); setLeads((items) => items.filter((item) => item.id !== lead.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Lead konnte nicht gelöscht werden."); }
    finally { setSavingId(null); }
  }

  function logout() { sessionStorage.removeItem("webforge_admin_password"); setPassword(""); setLeads([]); setAuthenticated(false); setError(""); }

  if (!authenticated) return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a><nav><b>Admin</b></nav></aside><section><div className="adminhead"><div><small>WEBFORGE CONTROL</small><h1>Admin Login</h1></div><a className="button" href="/">Website öffnen ↗</a></div><div className="adminpanel"><small>SICHERER ZUGANG</small><h2>Leads & Websites verwalten</h2><form onSubmit={(event) => { event.preventDefault(); void loadLeads(); }} style={{ display: "grid", gap: 12, maxWidth: 440 }}><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Adminpasswort" required/><button className="button" type="submit" disabled={loading}>{loading ? "Prüfe …" : "Einloggen"}</button>{error && <p>{error}</p>}</form></div></section></main>;

  return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a><nav><b>Übersicht</b><span>Leads</span><span>Kunden</span><span>Websites</span></nav></aside><section>
    <div className="adminhead"><div><small>WEBFORGE CONTROL</small><h1>Mini-CRM</h1></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="button" onClick={() => void loadLeads()}>{loading ? "Lädt …" : "Aktualisieren"}</button><button className="button" onClick={logout}>Abmelden</button></div></div>
    <div className="stats"><article><small>NEUE LEADS</small><strong>{newLeads}</strong><span>offen</span></article><article><small>GEWONNEN</small><strong>{wonLeads}</strong><span>Kunden</span></article><article><small>DEMO-SITES</small><strong>{Object.keys(sites).length}</strong><span>bereit</span></article></div>
    <div className="adminpanel"><div><small>FILTER</small><h2>Leads finden</h2></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Firma, E-Mail, Website, Notiz suchen" style={{minWidth:280}}/><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as "all"|LeadStatus)}><option value="all">Alle Status</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={showArchived} onChange={(e)=>setShowArchived(e.target.checked)}/> Archiv anzeigen</label></div></div>
    <div className="adminpanel"><div><small>LEADS</small><h2>{filteredLeads.length} Treffer</h2></div>{error && <p>{error}</p>}{filteredLeads.map((lead)=><div key={lead.id} style={{padding:"18px 0",borderBottom:"1px solid rgba(255,255,255,.08)",display:"grid",gap:10}}><div className="adminrow"><span className="dot"/><div><strong>{lead.company}</strong><small><a href={`mailto:${lead.email}`}>{lead.email}</a>{lead.website ? <> · <a href={/^https?:\/\//i.test(lead.website)?lead.website:`https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a></>:null}</small></div><select value={lead.status} disabled={savingId===lead.id} onChange={(e)=>void changeStatus(lead.id,e.target.value as LeadStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><small>{new Date(lead.created_at).toLocaleString("de-DE")}</small></div><textarea value={draftNotes[lead.id] || ""} onChange={(e)=>setDraftNotes((n)=>({...n,[lead.id]:e.target.value}))} placeholder="Interne Notiz …" rows={3}/><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button" disabled={savingId===lead.id} onClick={()=>void saveNotes(lead.id)}>Notiz speichern</button><button className="button" disabled={savingId===lead.id} onClick={()=>void markContacted(lead.id)}>Kontakt jetzt</button><button className="button" disabled={savingId===lead.id} onClick={()=>void toggleArchive(lead)}>{lead.archived_at?"Wiederherstellen":"Archivieren"}</button><button className="button" disabled={savingId===lead.id} onClick={()=>void removeLead(lead)}>Löschen</button>{lead.last_contacted_at && <small>Letzter Kontakt: {new Date(lead.last_contacted_at).toLocaleString("de-DE")}</small>}</div></div>)}</div>
  </section></main>;
}
