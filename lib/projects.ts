import { adminRpc } from "@/lib/admin-rpc";

export type ProjectStatus =
  "planning" | "waiting_content" | "design" | "development" | "review" | "live" | "paused" | "cancelled";
export type OnboardingStatus = "not_started" | "waiting_customer" | "ready" | "completed";
export type ProjectTaskCategory = "general" | "content" | "branding" | "domain" | "legal" | "technical";

export type CustomerProject = {
  id: number;
  lead_id: number;
  offer_id: number | null;
  project_number: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  domain: string | null;
  live_url: string | null;
  target_launch_date: string | null;
  notes: string | null;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
  onboarding_status: OnboardingStatus;
  content_deadline: string | null;
  logo_received: boolean;
  images_received: boolean;
  texts_received: boolean;
  domain_access_received: boolean;
  legal_data_received: boolean;
  company: string;
  contact_name: string | null;
  email: string;
  offer_number: string | null;
};

export type ProjectTask = {
  id: number;
  project_id: number;
  title: string;
  category: ProjectTaskCategory;
  required: boolean;
  completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
};

export async function listProjects(session: string): Promise<CustomerProject[]> {
  const response = await adminRpc("admin_list_projects", session);
  return (await response.json()) as CustomerProject[];
}

export async function updateProject(
  session: string,
  projectId: number,
  input: {
    status: ProjectStatus;
    progress: number;
    domain: string;
    liveUrl: string;
    targetLaunchDate: string;
    notes: string;
  },
) {
  await adminRpc("admin_update_project", session, {
    p_project_id: projectId,
    p_status: input.status,
    p_progress: input.progress,
    p_domain: input.domain || null,
    p_live_url: input.liveUrl || null,
    p_target_launch_date: input.targetLaunchDate || null,
    p_notes: input.notes || null,
  });
}

export async function saveProjectOnboarding(
  session: string,
  projectId: number,
  input: {
    onboardingStatus: OnboardingStatus;
    contentDeadline: string;
    logoReceived: boolean;
    imagesReceived: boolean;
    textsReceived: boolean;
    domainAccessReceived: boolean;
    legalDataReceived: boolean;
  },
) {
  await adminRpc("admin_save_project_onboarding", session, {
    p_project_id: projectId,
    p_onboarding_status: input.onboardingStatus,
    p_content_deadline: input.contentDeadline || null,
    p_logo_received: input.logoReceived,
    p_images_received: input.imagesReceived,
    p_texts_received: input.textsReceived,
    p_domain_access_received: input.domainAccessReceived,
    p_legal_data_received: input.legalDataReceived,
  });
}

export async function listProjectTasks(session: string, projectId: number): Promise<ProjectTask[]> {
  const response = await adminRpc("admin_project_tasks", session, { p_project_id: projectId });
  return (await response.json()) as ProjectTask[];
}

export async function saveProjectTask(
  session: string,
  projectId: number,
  task: Partial<ProjectTask> & Pick<ProjectTask, "title" | "category" | "required" | "completed" | "sort_order">,
) {
  const response = await adminRpc("admin_upsert_project_task", session, {
    p_project_id: projectId,
    p_task_id: task.id || null,
    p_title: task.title,
    p_category: task.category,
    p_required: task.required,
    p_completed: task.completed,
    p_due_date: task.due_date || null,
    p_notes: task.notes || null,
    p_sort_order: task.sort_order,
  });
  return (await response.json()) as number;
}

export async function deleteProjectTask(session: string, projectId: number, taskId: number) {
  await adminRpc("admin_delete_project_task", session, { p_project_id: projectId, p_task_id: taskId });
}
