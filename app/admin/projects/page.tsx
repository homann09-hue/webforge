"use client";

import { useEffect, useMemo, useState } from "react";
import type { CustomerProject, ProjectStatus } from "@/lib/projects";

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planung",
  waiting_content: "Warten auf Inhalte",
  design: "Design",
  development: "Entwicklung",
  review: "Kundenprüfung",
  live: "Live",
  paused: "Pausiert",
  cancelled: "Abgebrochen",
};

type ProjectDraft = { status: ProjectStatus; progress: number; domain: string; liveUrl: string; targetLaunchDate: string; notes: string };

function draftFromProject(project: CustomerProject): ProjectDraft {
  return {
    status: project.status,
    progress: project.progress,
    domain: project.domain || "",
    liveUrl: project.live_url || "",
    targetLaunchDate: project.target_launch_date || "",
    notes: project.notes || "",
  };
}

export default function ProjectsAdmin() {
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ProjectDraft>>({});
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

  const visible = useMemo(() => projects.filter((project) => filter === "all" || project.status === filter), [projects, filter]);
  const liveCount = projects.filter((project) => project.status === "live").length;
  const activeCount = projects.filter((project) => !["live", "cancelled"].includes(project.status)).length;

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) { setPassword(saved); void loadProjects(saved); }
  }, []);

  async function api(body: Record<string, unknown>, candidate = password) {
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: candidate, ...body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
    return data;
  }

  async function loadProjects(candidate = password) {
    setLoading(true); setError("");
    try {
      const data = await api({ action: "list" }, candidate);
      const loaded = data.projects as CustomerProject[];
      setProjects(loaded);
      setDrafts(Object.fromEntries(loaded.map((project) => [project.id, draftFromProject(project)])));
      setAuthenticated(true);
      setPassword(candidate);
      sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false);
      sessionStorage.removeItem("webforge_admin_password");
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally { setLoading(false); }
  }

  function updateDraft(projectId: number, patch: Partial<ProjectDraft>) {
    setDrafts((current) => ({ ...current, [projectId]: { ...current[projectId], ...patch } }));
  }

  async function saveProject(projectId: number) {
    const draft = drafts[projectId]; if (!draft) return;
    setSavingId(projectId); setError("");
    try {
      await api({ action: "update", projectId, status: draft.status, progress: draft.progress, domain: draft.domain, liveUrl: draft.liveUrl, targetLaunchDate: draft.targetLaunchDate, notes: draft.notes });
      await loadProjects();
    } catch (err) { setError(err instanceof Error ? err.message : "Projekt konnte nicht gespeichert werden."); }
    finally { setSavingId(null); }
  }

  if (!authenticated) return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a></aside><section><div className="adminhead"><div><small>WEBFORGE CONTROL</small><h1>Projekte</h1></div><a className="button" href="/admin">CRM öffnen</a></div><div className="adminpanel"><h2>Admin Login</h2><form onSubmit={(event)=>{event.preventDefault();void loadProjects();}} style={{display:"grid",gap:10,maxWidth:420}}><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Adminpasswort" required/><button className="button" disabled={loading}>{loading?"Prüfe …":"Einloggen"}</button>{error&&<p>{error}</p>}</form></div></section></main>;

  return <main className="admin"><aside><a className="brand" href="/"><span>W</span> WebForge</a><nav><a href="/admin">CRM</a><b>Projekte</b></nav></aside><section>
    <div className="adminhead"><div><small>DELIVERY CONTROL</small><h1>Kundenprojekte</h1></div><div style={{display:"flex",gap:8}}><button className="button" onClick={()=>void loadProjects()} disabled={loading}>{loading?"Lädt …":"Aktualisieren"}</button><a className="button" href="/admin">Zurück zum CRM</a></div></div>
    <div className="stats"><article><small>PROJEKTE</small><strong>{projects.length}</strong><span>gesamt</span></article><article><small>AKTIV</small><strong>{activeCount}</strong><span>in Bearbeitung</span></article><article><small>LIVE</small><strong>{liveCount}</strong><span>veröffentlicht</span></article></div>
    <div className="adminpanel"><div><small>FILTER</small><h2>Projektstatus</h2></div><select value={filter} onChange={(e)=>setFilter(e.target.value as "all"|ProjectStatus)}><option value="all">Alle Projekte</option>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="adminpanel"><div><small>DELIVERY PIPELINE</small><h2>{visible.length} Projekte</h2></div>{error&&<p>{error}</p>}{visible.length===0&&<p>Noch keine Projekte. Ein Projekt wird automatisch erzeugt, sobald ein Angebot angenommen wird.</p>}{visible.map((project)=>{const draft=drafts[project.id]||draftFromProject(project);return <div key={project.id} style={{padding:"20px 0",borderBottom:"1px solid rgba(255,255,255,.08)",display:"grid",gap:12}}><div className="adminrow"><span className="dot"/><div><strong>{project.project_number} · {project.name}</strong><small>{project.company}{project.offer_number?` · ${project.offer_number}`:""}</small></div><select value={draft.status} onChange={(e)=>updateDraft(project.id,{status:e.target.value as ProjectStatus})}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><strong>{draft.progress}%</strong></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}><label>Fortschritt<input type="range" min="0" max="100" value={draft.progress} onChange={(e)=>updateDraft(project.id,{progress:Number(e.target.value)})}/></label><input value={draft.domain} onChange={(e)=>updateDraft(project.id,{domain:e.target.value})} placeholder="Domain"/><input value={draft.liveUrl} onChange={(e)=>updateDraft(project.id,{liveUrl:e.target.value})} placeholder="Live-URL"/><label>Zieltermin<input type="date" value={draft.targetLaunchDate} onChange={(e)=>updateDraft(project.id,{targetLaunchDate:e.target.value})}/></label></div><textarea rows={3} value={draft.notes} onChange={(e)=>updateDraft(project.id,{notes:e.target.value})} placeholder="Projekt-Notizen, fehlende Inhalte, nächste Schritte …"/><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><button className="button" disabled={savingId===project.id} onClick={()=>void saveProject(project.id)}>{savingId===project.id?"Speichert …":"Projekt speichern"}</button>{project.live_url&&<a className="button" href={/^https?:\/\//i.test(project.live_url)?project.live_url:`https://${project.live_url}`} target="_blank" rel="noreferrer">Live öffnen ↗</a>}{project.launched_at&&<small>Live seit {new Date(project.launched_at).toLocaleDateString("de-DE")}</small>}</div></div>})}</div>
  </section></main>;
}
