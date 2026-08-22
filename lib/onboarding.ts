import type { CustomerProject, OnboardingStatus, ProjectStatus } from "./projects";

export const ONBOARDING_STEPS = [
  "lead-qualified",
  "offer-accepted",
  "deposit-confirmed",
  "company-data",
  "branding",
  "content",
  "domain-access",
  "legal-data",
  "site-configured",
  "customer-review",
  "launch-approved",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingChecklist = Record<OnboardingStep, boolean>;

export type OnboardingGate = {
  id: OnboardingStep;
  label: string;
  required: boolean;
  customerFacing: boolean;
  description: string;
};

export const ONBOARDING_GATES: readonly OnboardingGate[] = [
  { id: "lead-qualified", label: "Anfrage geprüft", required: true, customerFacing: false, description: "Bedarf, Budget und grundsätzliche Passung sind geklärt." },
  { id: "offer-accepted", label: "Angebot angenommen", required: true, customerFacing: true, description: "Leistungsumfang und Preis wurden bestätigt." },
  { id: "deposit-confirmed", label: "Startzahlung bestätigt", required: true, customerFacing: true, description: "Die vereinbarte Startzahlung ist eingegangen oder anderweitig freigegeben." },
  { id: "company-data", label: "Firmendaten vorhanden", required: true, customerFacing: true, description: "Firmenname, Ansprechpartner, Kontakt und Anschrift liegen vor." },
  { id: "branding", label: "Logo und Erscheinungsbild", required: false, customerFacing: true, description: "Logo, Farben oder die Freigabe für ein neues Erscheinungsbild liegen vor." },
  { id: "content", label: "Texte und Bilder", required: true, customerFacing: true, description: "Leistungen, Texte und verwendbare Bilder sind vorhanden oder zur Erstellung freigegeben." },
  { id: "domain-access", label: "Domain-Zugang", required: true, customerFacing: true, description: "Domain ist registriert und DNS-Zugang bzw. Transfermöglichkeit liegt vor." },
  { id: "legal-data", label: "Rechtliche Angaben", required: true, customerFacing: true, description: "Impressums- und Datenschutzangaben des Kunden sind vorhanden." },
  { id: "site-configured", label: "Website konfiguriert", required: true, customerFacing: false, description: "Branche, Theme, Module und Inhalte sind in der SiteConfig vollständig erfasst." },
  { id: "customer-review", label: "Kundenprüfung", required: true, customerFacing: true, description: "Der Kunde hat die Vorschau geprüft und Änderungswünsche abgearbeitet." },
  { id: "launch-approved", label: "Livegang freigegeben", required: true, customerFacing: true, description: "Der Kunde hat den finalen Stand ausdrücklich zum Livegang freigegeben." },
];

export function emptyOnboardingChecklist(): OnboardingChecklist {
  return Object.fromEntries(ONBOARDING_STEPS.map((step) => [step, false])) as OnboardingChecklist;
}

export function onboardingCompletion(checklist: OnboardingChecklist): number {
  const required = ONBOARDING_GATES.filter((gate) => gate.required);
  const completed = required.filter((gate) => checklist[gate.id]).length;
  return Math.round((completed / required.length) * 100);
}

export function missingRequiredOnboardingSteps(checklist: OnboardingChecklist): OnboardingGate[] {
  return ONBOARDING_GATES.filter((gate) => gate.required && !checklist[gate.id]);
}

export function canStartBuild(checklist: OnboardingChecklist): boolean {
  const requiredBeforeBuild: OnboardingStep[] = [
    "lead-qualified",
    "offer-accepted",
    "deposit-confirmed",
    "company-data",
    "content",
    "legal-data",
  ];
  return requiredBeforeBuild.every((step) => checklist[step]);
}

export function canLaunch(checklist: OnboardingChecklist): boolean {
  return missingRequiredOnboardingSteps(checklist).length === 0;
}

export function deriveOnboardingStatus(checklist: OnboardingChecklist): OnboardingStatus {
  if (canLaunch(checklist)) return "completed";
  if (canStartBuild(checklist)) return "ready";

  const anyStarted = ONBOARDING_STEPS.some((step) => checklist[step]);
  if (!anyStarted) return "not_started";
  return "waiting_customer";
}

export function deriveProjectStatus(checklist: OnboardingChecklist, current: ProjectStatus): ProjectStatus {
  if (current === "cancelled" || current === "paused" || current === "live") return current;
  if (!canStartBuild(checklist)) return "waiting_content";
  if (!checklist["site-configured"]) return "planning";
  if (!checklist["customer-review"]) return "development";
  if (!checklist["launch-approved"]) return "review";
  return "review";
}

/** Maps the existing database onboarding fields onto the stricter launch workflow. */
export function checklistFromProject(project: CustomerProject): OnboardingChecklist {
  return {
    "lead-qualified": true,
    "offer-accepted": project.offer_id !== null,
    "deposit-confirmed": project.offer_id !== null,
    "company-data": Boolean(project.company && project.email),
    branding: project.logo_received,
    content: project.images_received && project.texts_received,
    "domain-access": project.domain_access_received,
    "legal-data": project.legal_data_received,
    "site-configured": ["design", "development", "review", "live"].includes(project.status),
    "customer-review": ["review", "live"].includes(project.status),
    "launch-approved": project.status === "live" || Boolean(project.launched_at),
  };
}
