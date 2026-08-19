import { NextResponse } from "next/server";
import { listProjects, updateProject, type ProjectStatus } from "@/lib/projects";

const allowedStatuses: ProjectStatus[] = ["planning", "waiting_content", "design", "development", "review", "live", "paused", "cancelled"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const action = String(body.action || "list");
    if (!password) return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });

    if (action === "list") {
      const projects = await listProjects(password);
      return NextResponse.json({ ok: true, projects });
    }

    if (action === "update") {
      const projectId = Number(body.projectId);
      const status = String(body.status || "") as ProjectStatus;
      const progress = Number(body.progress ?? 0);
      const domain = String(body.domain || "").trim();
      const liveUrl = String(body.liveUrl || "").trim();
      const targetLaunchDate = String(body.targetLaunchDate || "").trim();
      const notes = String(body.notes || "").trim();
      if (!Number.isSafeInteger(projectId) || projectId <= 0 || !allowedStatuses.includes(status) || !Number.isInteger(progress) || progress < 0 || progress > 100 || domain.length > 300 || liveUrl.length > 500 || notes.length > 5000) {
        return NextResponse.json({ ok: false, error: "Projektdaten sind ungültig." }, { status: 400 });
      }
      await updateProject(password, projectId, { status, progress, domain, liveUrl, targetLaunchDate, notes });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ ok: false, error: "Ungültiges Passwort." }, { status: 401 });
    console.error("WEBFORGE_PROJECTS_API_ERROR", error);
    return NextResponse.json({ ok: false, error: "Projekt konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
