import { describe, expect, it } from "vitest";
import {
  canLaunch,
  canStartBuild,
  deriveOnboardingStatus,
  emptyOnboardingChecklist,
  missingRequiredOnboardingSteps,
  onboardingCompletion,
} from "../lib/onboarding";

describe("customer onboarding workflow", () => {
  it("starts blocked", () => {
    const checklist = emptyOnboardingChecklist();
    expect(canStartBuild(checklist)).toBe(false);
    expect(canLaunch(checklist)).toBe(false);
    expect(deriveOnboardingStatus(checklist)).toBe("not_started");
    expect(onboardingCompletion(checklist)).toBe(0);
  });

  it("allows build only after commercial and content prerequisites", () => {
    const checklist = emptyOnboardingChecklist();
    for (const step of [
      "lead-qualified",
      "offer-accepted",
      "deposit-confirmed",
      "company-data",
      "content",
      "legal-data",
    ] as const) {
      checklist[step] = true;
    }

    expect(canStartBuild(checklist)).toBe(true);
    expect(deriveOnboardingStatus(checklist)).toBe("ready");
    expect(canLaunch(checklist)).toBe(false);
  });

  it("requires domain, site configuration, review and launch approval before launch", () => {
    const checklist = emptyOnboardingChecklist();
    for (const key of Object.keys(checklist) as Array<keyof typeof checklist>) checklist[key] = true;

    expect(canLaunch(checklist)).toBe(true);
    expect(deriveOnboardingStatus(checklist)).toBe("completed");
    expect(onboardingCompletion(checklist)).toBe(100);
    expect(missingRequiredOnboardingSteps(checklist)).toEqual([]);
  });

  it("does not block launch on optional branding", () => {
    const checklist = emptyOnboardingChecklist();
    for (const key of Object.keys(checklist) as Array<keyof typeof checklist>) checklist[key] = true;
    checklist.branding = false;

    expect(canLaunch(checklist)).toBe(true);
  });
});
