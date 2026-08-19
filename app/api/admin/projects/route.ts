import { NextResponse } from "next/server";
import {
  deleteProjectTask,
  listProjects,
  listProjectTasks,
  saveProjectOnboarding,
  saveProjectTask,
  updateProject,
  type OnboardingStatus,
  type ProjectStatus,
  type ProjectTaskCategory,
} from "@/lib/projects";

const allowedStatuses: ProjectStatus[] = ["planning", "waiting_content", "design", "development", "review", "live", "paused", "cancelled"];
const allowedOnboarding: OnboardingStatus[] = ["not_started", "waiting_customer", "ready", "completed"];
const allowedCategories: ProjectTaskCategory[] = ["general", "content", "branding", "domain", "legal", "technical"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const action = String(body.action || "list");
    if (!password) return NextResponse.json({ ok: false, error: "Passwort fehlt." }, { status: 400 });

    if (action === "list") {
      return NextResponse.json({ ok: true, projects: await listProjects(password) });
    }

    const projectId = Number(body.projectId);
    if (!Number.isSafeInteger(projectId) || projectId <= 0) return NextResponse.json({ ok: false, error: "Ungültiges Projekt." }, { status: 400 });

    if (action === "update") {
      const status = String(body.status || "") as ProjectStatus;
      const progress = Number(body.progress ?? 0);
      const domain = String(body.domain || "").trim();
      const liveUrl = String(body.liveUrl || "").trim();
      const targetLaunchDate = String(body.targetLaunchDate || "").trim();
      const notes = String(body.notes || "").trim();
      if (!allowedStatuses.includes(status) || !Number.isInteger(progress) || progress < 0 || progress > 100 || domain.length > 300 || liveUrl.length > 500 || notes.length > 5000) {
        return NextResponse.json({ ok: false, error: "Projektdaten sind ungültig." }, { status: 400 });
      }
      await updateProject(password, projectId, { status, progress, domain, liveUrl, targetLaunchDate, notes });
      return NextResponse.json({ ok: true });
    }

    if (action === "onboarding") {
      const onboardingStatus = String(body.onboardingStatus || "") as OnboardingStatus;
      const contentDeadline = String(body.contentDeadline || "").trim();
      if (!allowedOnboarding.includes(onboardingStatus)) return NextResponse.json({ ok: false, error: "Ungültiger Onboarding-Status." }, { status: 400 });
      await saveProjectOnboarding(password, projectId, {
        onboardingStatus,
        contentDeadline,
        logoReceived: Boolean(body.logoReceived),
        imagesReceived: Boolean(body.imagesReceived),
        textsReceived: Boolean(body.textsReceived),
        domainAccessReceived: Boolean(body.domainAccessReceived),
        legalDataReceived: Boolean(body.legalDataReceived),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "tasks") {
      return NextResponse.json({ ok: true, tasks: await listProjectTasks(password, projectId) });
    }

    if (action === "task-save") {
      const taskId = body.taskId == null ? undefined : Number(body.taskId);
      const title = String(body.title || "").trim();
      const category = String(body.category || "general") as ProjectTaskCategory;
      const sortOrder = Number(body.sortOrder ?? 1);
      const dueDate = String(body.dueDate || "").trim();
      const notes = String(body.notes || "").trim();
      if ((taskId !== undefined && (!Number.isSafeInteger(taskId) || taskId <= 0)) || title.length < 1 || title.length > 200 || !allowedCategories.includes(category) || !Number.isInteger(sortOrder) || sortOrder < 1 || notes.length > 3000) {
        return NextResponse.json({ ok: false, error: "Checklistenpunkt ist ungültig." }, { status: 400 });
      }
      const id = await saveProjectTask(password, projectId, {
        id: taskId,
        title,
        category,
        required: body.required !== false,
        completed: Boolean(body.completed),
        due_date: dueDate || null,
        notes: notes || null,
        sort_order: sortOrder,
      });
      return NextResponse.json({ ok: true, id });
    }

    if (action === "task-delete") {
      const taskId = Number(body.taskId);
      if (!Number.isSafeInteger(taskId) || taskId <= 0) return NextResponse.json({ ok: false, error: "Ungültiger Checklistenpunkt." }, { status: 400 });
      await deleteProjectTask(password, projectId, taskId);
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
