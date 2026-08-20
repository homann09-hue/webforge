"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminLogin, adminSessionActive } from "@/lib/admin-client";

type Project = { id: number; project_number: string; name: string; company: string; portal_enabled?: boolean };

export default function PortalsAdmin() {
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<Record<number, string>>({});
  useEffect(() => {
    void adminSessionActive().then((active) => {
      if (active) void load();
    });
  }, []);

  async function signIn() {
    setError("");
    try {
      await adminLogin(password);
      setPassword("");
      await load();
    } catch (err) {
      setAuthenticated(false);
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    }
  }
  async function load() {
    try {
      const data = await adminFetch<{ projects: Project[] }>("/api/admin/projects", { action: "list" });
      setProjects(data.projects);
      setAuthenticated(true);
      setError("");
    } catch (err) {
      setAuthenticated(false);
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    }
  }
  async function portal(projectId: number, action: "rotate" | "disable") {
    setError("");
    let d: { token?: string };
    try {
      d = await adminFetch<{ token?: string }>("/api/admin/projects/portal", { projectId, action });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal-Aktion fehlgeschlagen.");
      return;
    }
    if (action === "rotate") {
      const url = `${location.origin}/portal/${d.token}`;
      setLinks((v) => ({ ...v, [projectId]: url }));
      setProjects((v) => v.map((p) => (p.id === projectId ? { ...p, portal_enabled: true } : p)));
    } else {
      setLinks((v) => {
        const n = { ...v };
        delete n[projectId];
        return n;
      });
      setProjects((v) => v.map((p) => (p.id === projectId ? { ...p, portal_enabled: false } : p)));
    }
  }
  if (!authenticated)
    return (
      <main className="admin">
        <aside>
          <a className="brand" href="/">
            <span>W</span> WebForge
          </a>
        </aside>
        <section>
          <div className="adminhead">
            <div>
              <small>WEBFORGE CONTROL</small>
              <h1>Kundenportale</h1>
            </div>
            <a className="button" href="/admin/projects">
              Projekte
            </a>
          </div>
          <div className="adminpanel">
            <h2>Admin Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void signIn();
              }}
              style={{ display: "grid", gap: 10, maxWidth: 420 }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Adminpasswort"
                required
              />
              <button className="button">Einloggen</button>
              {error && <p>{error}</p>}
            </form>
          </div>
        </section>
      </main>
    );
  return (
    <main className="admin">
      <aside>
        <a className="brand" href="/">
          <span>W</span> WebForge
        </a>
        <nav>
          <a href="/admin">CRM</a>
          <a href="/admin/projects">Projekte</a>
          <b>Portale</b>
        </nav>
      </aside>
      <section>
        <div className="adminhead">
          <div>
            <small>CUSTOMER ACCESS</small>
            <h1>Kundenportale</h1>
          </div>
          <a className="button" href="/admin/projects">
            Zurück
          </a>
        </div>
        {error && <p>{error}</p>}
        <div className="adminpanel">
          <h2>Sichere Projektlinks</h2>
          <p>„Neuen Link erzeugen“ rotiert den Zugang. Ein alter Link ist danach ungültig.</p>
          {projects.map((p) => (
            <div
              key={p.id}
              style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}
            >
              <div className="adminrow">
                <span className="dot" />
                <div>
                  <strong>
                    {p.project_number} · {p.company}
                  </strong>
                  <small>{p.name}</small>
                </div>
                <b>{p.portal_enabled ? "Aktiv" : "Aus"}</b>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="button" onClick={() => void portal(p.id, "rotate")}>
                  Neuen Link erzeugen
                </button>
                {p.portal_enabled && (
                  <button className="button" onClick={() => void portal(p.id, "disable")}>
                    Portal deaktivieren
                  </button>
                )}
              </div>
              {links[p.id] && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input readOnly value={links[p.id]} style={{ minWidth: 420 }} />
                  <button className="button" onClick={() => navigator.clipboard.writeText(links[p.id])}>
                    Link kopieren
                  </button>
                  <a className="button" href={links[p.id]} target="_blank" rel="noreferrer">
                    Öffnen ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
