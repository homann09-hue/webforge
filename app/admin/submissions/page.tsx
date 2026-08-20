"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortalSubmissionAdmin, SubmissionReviewStatus } from "@/lib/submissions";

const statusLabels: Record<SubmissionReviewStatus, string> = {
  new: "Neu",
  reviewed: "Geprüft",
  incorporated: "Übernommen",
};

export default function SubmissionsAdmin() {
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<PortalSubmissionAdmin[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionReviewStatus>("all");
  const [notes, setNotes] = useState<Record<number, string>>({});

  const visible = useMemo(
    () =>
      submissions.filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          [
            item.project_number || "",
            item.project_name || "",
            item.company || "",
            item.label,
            item.content || "",
            item.file_name || "",
          ].some((value) => value.toLowerCase().includes(q));
        const matchesStatus = statusFilter === "all" || item.review_status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [submissions, search, statusFilter],
  );

  const newCount = submissions.filter((item) => item.review_status === "new").length;
  const reviewedCount = submissions.filter((item) => item.review_status === "reviewed").length;
  const incorporatedCount = submissions.filter((item) => item.review_status === "incorporated").length;

  useEffect(() => {
    const saved = sessionStorage.getItem("webforge_admin_password");
    if (saved) {
      setPassword(saved);
      void load(saved);
    }
  }, []);

  async function api(body: Record<string, unknown>, candidate = password) {
    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: candidate, ...body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
    return data;
  }

  async function load(candidate = password) {
    setLoading(true);
    setError("");
    try {
      const data = await api({ action: "list" }, candidate);
      const loaded = data.submissions as PortalSubmissionAdmin[];
      setSubmissions(loaded);
      setNotes(Object.fromEntries(loaded.map((item) => [item.id, item.reviewed_note || ""])));
      setAuthenticated(true);
      setPassword(candidate);
      sessionStorage.setItem("webforge_admin_password", candidate);
    } catch (err) {
      setAuthenticated(false);
      sessionStorage.removeItem("webforge_admin_password");
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function setReview(item: PortalSubmissionAdmin, status: SubmissionReviewStatus) {
    setSavingId(item.id);
    setError("");
    try {
      await api({ action: "review", submissionId: item.id, status, note: notes[item.id] || "" });
      setSubmissions((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                review_status: status,
                reviewed_note: (notes[item.id] || "").trim() || null,
                reviewed_at: status === "new" ? null : new Date().toISOString(),
              }
            : entry,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function openFile(item: PortalSubmissionAdmin) {
    setSavingId(item.id);
    setError("");
    try {
      const data = await api({ action: "file-url", submissionId: item.id });
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datei konnte nicht geöffnet werden.");
    } finally {
      setSavingId(null);
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
              <h1>Kundenabgaben</h1>
            </div>
            <a className="button" href="/admin/projects">
              Projekte
            </a>
          </div>
          <div className="adminpanel">
            <h2>Admin Login</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
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
              <button className="button" disabled={loading}>
                {loading ? "Prüfe …" : "Einloggen"}
              </button>
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
          <b>Kundenabgaben</b>
        </nav>
      </aside>
      <section>
        <div className="adminhead">
          <div>
            <small>PORTAL INBOX</small>
            <h1>Kundenabgaben prüfen</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button" onClick={() => void load()} disabled={loading}>
              {loading ? "Lädt …" : "Aktualisieren"}
            </button>
            <a className="button" href="/admin/projects">
              Projekte
            </a>
          </div>
        </div>
        <div className="stats">
          <article>
            <small>NEU</small>
            <strong>{newCount}</strong>
            <span>ungeprüft</span>
          </article>
          <article>
            <small>GEPRÜFT</small>
            <strong>{reviewedCount}</strong>
            <span>gesichtet</span>
          </article>
          <article>
            <small>ÜBERNOMMEN</small>
            <strong>{incorporatedCount}</strong>
            <span>ins Projekt übernommen</span>
          </article>
        </div>
        <div className="adminpanel">
          <div>
            <small>FILTER</small>
            <h2>Abgaben finden</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Projekt, Kunde, Datei, Inhalt …"
              style={{ minWidth: 300 }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | SubmissionReviewStatus)}
            >
              <option value="all">Alle Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="adminpanel">
          <div>
            <small>ABGABEN</small>
            <h2>{visible.length} Einträge</h2>
          </div>
          {error && <p>{error}</p>}
          {visible.length === 0 && <p>Noch keine passenden Kundenabgaben vorhanden.</p>}
          {visible.map((item) => (
            <div
              key={item.id}
              style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}
            >
              <div className="adminrow">
                <span className="dot" />
                <div>
                  <strong>
                    {item.project_number} · {item.company}
                  </strong>
                  <small>
                    {item.label} · {new Date(item.created_at).toLocaleString("de-DE")}
                  </small>
                </div>
                <select
                  value={item.review_status}
                  disabled={savingId === item.id}
                  onChange={(e) => void setReview(item, e.target.value as SubmissionReviewStatus)}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <b>{item.kind}</b>
              </div>
              {item.content && (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: "12px",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 10,
                  }}
                >
                  {item.content}
                </div>
              )}
              {item.file_path && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="button" disabled={savingId === item.id} onClick={() => void openFile(item)}>
                    Datei sicher öffnen ↗
                  </button>
                  <small>{item.file_name || "Datei"}</small>
                </div>
              )}
              <textarea
                rows={2}
                value={notes[item.id] || ""}
                onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))}
                placeholder="Interne Prüfnotiz …"
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  className="button"
                  disabled={savingId === item.id}
                  onClick={() => void setReview(item, "reviewed")}
                >
                  Als geprüft markieren
                </button>
                <button
                  className="button"
                  disabled={savingId === item.id}
                  onClick={() => void setReview(item, "incorporated")}
                >
                  Als übernommen markieren
                </button>
                {item.reviewed_at && <small>Bearbeitet: {new Date(item.reviewed_at).toLocaleString("de-DE")}</small>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
