"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch, adminLogin, adminSessionActive, handleAdminError } from "@/lib/admin-client";
import type {
  CustomerProject,
  OnboardingStatus,
  ProjectStatus,
  ProjectTask,
  ProjectTaskCategory,
} from "@/lib/projects";

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
const onboardingLabels: Record<OnboardingStatus, string> = {
  not_started: "Nicht gestartet",
  waiting_customer: "Wartet auf Kunde",
  ready: "Bereit",
  completed: "Abgeschlossen",
};
const categoryLabels: Record<ProjectTaskCategory, string> = {
  general: "Allgemein",
  content: "Inhalte",
  branding: "Branding",
  domain: "Domain",
  legal: "Rechtliches",
  technical: "Technik",
};

type ProjectDraft = {
  status: ProjectStatus;
  progress: number;
  domain: string;
  liveUrl: string;
  targetLaunchDate: string;
  notes: string;
  onboardingStatus: OnboardingStatus;
  contentDeadline: string;
  logoReceived: boolean;
  imagesReceived: boolean;
  textsReceived: boolean;
  domainAccessReceived: boolean;
  legalDataReceived: boolean;
};

type NewTaskDraft = { title: string; category: ProjectTaskCategory; dueDate: string; notes: string; required: boolean };

function draftFromProject(project: CustomerProject): ProjectDraft {
  return {
    status: project.status,
    progress: project.progress,
    domain: project.domain || "",
    liveUrl: project.live_url || "",
    targetLaunchDate: project.target_launch_date || "",
    notes: project.notes || "",
    onboardingStatus: project.onboarding_status,
    contentDeadline: project.content_deadline || "",
    logoReceived: project.logo_received,
    imagesReceived: project.images_received,
    textsReceived: project.texts_received,
    domainAccessReceived: project.domain_access_received,
    legalDataReceived: project.legal_data_received,
  };
}

function defaultNewTask(): NewTaskDraft {
  return { title: "", category: "general", dueDate: "", notes: "", required: true };
}

export default function ProjectsAdmin() {
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ProjectDraft>>({});
  const [tasks, setTasks] = useState<Record<number, ProjectTask[]>>({});
  const [newTasks, setNewTasks] = useState<Record<number, NewTaskDraft>>({});
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

  const visible = useMemo(
    () => projects.filter((project) => filter === "all" || project.status === filter),
    [projects, filter],
  );
  const liveCount = projects.filter((project) => project.status === "live").length;
  const activeCount = projects.filter((project) => !["live", "cancelled"].includes(project.status)).length;
  const waitingCount = projects.filter((project) => project.onboarding_status === "waiting_customer").length;

  useEffect(() => {
    void adminSessionActive().then((active) => {
      if (active) void loadProjects();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function api(body: Record<string, unknown>) {
    return adminFetch("/api/admin/projects", body);
  }

  async function signIn() {
    setError("");
    try {
      await adminLogin(password);
      setPassword("");
      await loadProjects();
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    }
  }

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const data = await api({ action: "list" });
      const loaded = data.projects as CustomerProject[];
      setProjects(loaded);
      setDrafts(Object.fromEntries(loaded.map((project) => [project.id, draftFromProject(project)])));
      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
      handleAdminError(err, setError, setAuthenticated, "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(projectId: number, patch: Partial<ProjectDraft>) {
    setDrafts((current) => ({ ...current, [projectId]: { ...current[projectId], ...patch } }));
  }

  async function saveProject(projectId: number) {
    const draft = drafts[projectId];
    if (!draft) return;
    setSavingId(projectId);
    setError("");
    try {
      await api({
        action: "update",
        projectId,
        status: draft.status,
        progress: draft.progress,
        domain: draft.domain,
        liveUrl: draft.liveUrl,
        targetLaunchDate: draft.targetLaunchDate,
        notes: draft.notes,
      });
      await api({
        action: "onboarding",
        projectId,
        onboardingStatus: draft.onboardingStatus,
        contentDeadline: draft.contentDeadline,
        logoReceived: draft.logoReceived,
        imagesReceived: draft.imagesReceived,
        textsReceived: draft.textsReceived,
        domainAccessReceived: draft.domainAccessReceived,
        legalDataReceived: draft.legalDataReceived,
      });
      await loadProjects();
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Projekt konnte nicht gespeichert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleDetails(projectId: number) {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      return;
    }
    setExpandedProject(projectId);
    setError("");
    if (!tasks[projectId]) {
      try {
        const data = await api({ action: "tasks", projectId });
        setTasks((current) => ({ ...current, [projectId]: data.tasks as ProjectTask[] }));
        setNewTasks((current) => ({ ...current, [projectId]: current[projectId] || defaultNewTask() }));
      } catch (err) {
        handleAdminError(err, setError, setAuthenticated, "Checkliste konnte nicht geladen werden.");
      }
    }
  }

  async function toggleTask(projectId: number, task: ProjectTask) {
    setSavingId(projectId);
    setError("");
    try {
      await api({
        action: "task-save",
        projectId,
        taskId: task.id,
        title: task.title,
        category: task.category,
        required: task.required,
        completed: !task.completed,
        dueDate: task.due_date || "",
        notes: task.notes || "",
        sortOrder: task.sort_order,
      });
      setTasks((current) => ({
        ...current,
        [projectId]: (current[projectId] || []).map((item) =>
          item.id === task.id
            ? { ...item, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : null }
            : item,
        ),
      }));
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Checkliste konnte nicht aktualisiert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function addTask(projectId: number) {
    const draft = newTasks[projectId] || defaultNewTask();
    if (!draft.title.trim()) return;
    setSavingId(projectId);
    setError("");
    try {
      await api({
        action: "task-save",
        projectId,
        title: draft.title,
        category: draft.category,
        required: draft.required,
        completed: false,
        dueDate: draft.dueDate,
        notes: draft.notes,
        sortOrder: (tasks[projectId]?.length || 0) + 1,
      });
      const data = await api({ action: "tasks", projectId });
      setTasks((current) => ({ ...current, [projectId]: data.tasks as ProjectTask[] }));
      setNewTasks((current) => ({ ...current, [projectId]: defaultNewTask() }));
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Checklistenpunkt konnte nicht erstellt werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeTask(projectId: number, taskId: number) {
    if (!confirm("Checklistenpunkt löschen?")) return;
    setSavingId(projectId);
    setError("");
    try {
      await api({ action: "task-delete", projectId, taskId });
      setTasks((current) => ({
        ...current,
        [projectId]: (current[projectId] || []).filter((task) => task.id !== taskId),
      }));
    } catch (err) {
      handleAdminError(err, setError, setAuthenticated, "Checklistenpunkt konnte nicht gelöscht werden.");
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
              <h1>Projekte</h1>
            </div>
            <a className="button" href="/admin">
              CRM öffnen
            </a>
          </div>
          <div className="adminpanel">
            <h2>Admin Login</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
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
          <b>Projekte</b>
        </nav>
      </aside>
      <section>
        <div className="adminhead">
          <div>
            <small>DELIVERY CONTROL</small>
            <h1>Kundenprojekte</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button" onClick={() => void loadProjects()} disabled={loading}>
              {loading ? "Lädt …" : "Aktualisieren"}
            </button>
            <a className="button" href="/admin">
              Zurück zum CRM
            </a>
          </div>
        </div>
        <div className="stats">
          <article>
            <small>PROJEKTE</small>
            <strong>{projects.length}</strong>
            <span>gesamt</span>
          </article>
          <article>
            <small>AKTIV</small>
            <strong>{activeCount}</strong>
            <span>in Bearbeitung</span>
          </article>
          <article>
            <small>WARTET AUF KUNDE</small>
            <strong>{waitingCount}</strong>
            <span>Onboarding</span>
          </article>
          <article>
            <small>LIVE</small>
            <strong>{liveCount}</strong>
            <span>veröffentlicht</span>
          </article>
        </div>
        <div className="adminpanel">
          <div>
            <small>FILTER</small>
            <h2>Projektstatus</h2>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | ProjectStatus)}>
            <option value="all">Alle Projekte</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="adminpanel">
          <div>
            <small>DELIVERY PIPELINE</small>
            <h2>{visible.length} Projekte</h2>
          </div>
          {error && <p>{error}</p>}
          {visible.length === 0 && (
            <p>Noch keine Projekte. Ein Projekt wird automatisch erzeugt, sobald ein Angebot angenommen wird.</p>
          )}
          {visible.map((project) => {
            const draft = drafts[project.id] || draftFromProject(project);
            const projectTasks = tasks[project.id] || [];
            const done = projectTasks.filter((task) => task.completed).length;
            const onboardingDone = [
              draft.logoReceived,
              draft.imagesReceived,
              draft.textsReceived,
              draft.domainAccessReceived,
              draft.legalDataReceived,
            ].filter(Boolean).length;
            const open = expandedProject === project.id;
            const newTask = newTasks[project.id] || defaultNewTask();
            return (
              <div
                key={project.id}
                style={{ padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 12 }}
              >
                <div className="adminrow">
                  <span className="dot" />
                  <div>
                    <strong>
                      {project.project_number} · {project.name}
                    </strong>
                    <small>
                      {project.company}
                      {project.offer_number ? ` · ${project.offer_number}` : ""}
                    </small>
                  </div>
                  <select
                    value={draft.status}
                    onChange={(e) => updateDraft(project.id, { status: e.target.value as ProjectStatus })}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <strong>{draft.progress}%</strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                  <label>
                    Fortschritt
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={draft.progress}
                      onChange={(e) => updateDraft(project.id, { progress: Number(e.target.value) })}
                    />
                  </label>
                  <input
                    value={draft.domain}
                    onChange={(e) => updateDraft(project.id, { domain: e.target.value })}
                    placeholder="Domain"
                  />
                  <input
                    value={draft.liveUrl}
                    onChange={(e) => updateDraft(project.id, { liveUrl: e.target.value })}
                    placeholder="Live-URL"
                  />
                  <label>
                    Zieltermin
                    <input
                      type="date"
                      value={draft.targetLaunchDate}
                      onChange={(e) => updateDraft(project.id, { targetLaunchDate: e.target.value })}
                    />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                  <label>
                    Onboarding
                    <select
                      value={draft.onboardingStatus}
                      onChange={(e) =>
                        updateDraft(project.id, { onboardingStatus: e.target.value as OnboardingStatus })
                      }
                    >
                      {Object.entries(onboardingLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Inhalte bis
                    <input
                      type="date"
                      value={draft.contentDeadline}
                      onChange={(e) => updateDraft(project.id, { contentDeadline: e.target.value })}
                    />
                  </label>
                  <div>
                    <small>Material vollständig</small>
                    <strong style={{ display: "block", marginTop: 4 }}>{onboardingDone}/5</strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    ["Logo", "logoReceived"],
                    ["Bilder", "imagesReceived"],
                    ["Texte", "textsReceived"],
                    ["Domainzugang", "domainAccessReceived"],
                    ["Impressum/Datenschutz", "legalDataReceived"],
                  ].map(([label, key]) => (
                    <label key={key} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(draft[key as keyof ProjectDraft])}
                        onChange={(e) => updateDraft(project.id, { [key]: e.target.checked } as Partial<ProjectDraft>)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => updateDraft(project.id, { notes: e.target.value })}
                  placeholder="Projekt-Notizen, fehlende Inhalte, nächste Schritte …"
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    className="button"
                    disabled={savingId === project.id}
                    onClick={() => void saveProject(project.id)}
                  >
                    {savingId === project.id ? "Speichert …" : "Projekt & Onboarding speichern"}
                  </button>
                  <button className="button" onClick={() => void toggleDetails(project.id)}>
                    {open ? "Checkliste schließen" : "Checkliste öffnen"}
                  </button>
                  {project.live_url && (
                    <a
                      className="button"
                      href={/^https?:\/\//i.test(project.live_url) ? project.live_url : `https://${project.live_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Live öffnen ↗
                    </a>
                  )}
                  {project.launched_at && (
                    <small>Live seit {new Date(project.launched_at).toLocaleDateString("de-DE")}</small>
                  )}
                </div>
                {open && (
                  <div className="adminpanel" style={{ marginTop: 4 }}>
                    <div>
                      <small>PROJEKT-CHECKLISTE</small>
                      <h2>
                        {done}/{projectTasks.length} erledigt
                      </h2>
                    </div>
                    {projectTasks.length === 0 && <p>Noch keine Checklistenpunkte.</p>}
                    {projectTasks.map((task) => (
                      <div key={task.id} className="adminrow">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => void toggleTask(project.id, task)}
                        />
                        <div>
                          <strong>{task.title}</strong>
                          <small>
                            {categoryLabels[task.category]}
                            {task.due_date
                              ? ` · fällig ${new Date(task.due_date + "T00:00:00").toLocaleDateString("de-DE")}`
                              : ""}
                            {task.notes ? ` · ${task.notes}` : ""}
                          </small>
                        </div>
                        <b>{task.required ? "Pflicht" : "Optional"}</b>
                        <button className="button" onClick={() => void removeTask(project.id, task.id)}>
                          Löschen
                        </button>
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                      <input
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTasks((current) => ({
                            ...current,
                            [project.id]: { ...newTask, title: e.target.value },
                          }))
                        }
                        placeholder="Neuer Checklistenpunkt"
                      />
                      <select
                        value={newTask.category}
                        onChange={(e) =>
                          setNewTasks((current) => ({
                            ...current,
                            [project.id]: { ...newTask, category: e.target.value as ProjectTaskCategory },
                          }))
                        }
                      >
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTasks((current) => ({
                            ...current,
                            [project.id]: { ...newTask, dueDate: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={newTask.notes}
                      onChange={(e) =>
                        setNewTasks((current) => ({ ...current, [project.id]: { ...newTask, notes: e.target.value } }))
                      }
                      placeholder="Hinweis zum Checklistenpunkt"
                      style={{ marginTop: 8 }}
                    />
                    <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={newTask.required}
                          onChange={(e) =>
                            setNewTasks((current) => ({
                              ...current,
                              [project.id]: { ...newTask, required: e.target.checked },
                            }))
                          }
                        />{" "}
                        Pflicht
                      </label>
                      <button className="button" onClick={() => void addTask(project.id)}>
                        Punkt hinzufügen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
