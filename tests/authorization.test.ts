import { describe, expect, it } from "vitest";
import { hasPermission, isUserRole, permissionsForRole, requirePermission } from "../lib/authorization";

describe("role based authorization", () => {
  it("recognizes supported roles", () => {
    expect(isUserRole("owner")).toBe(true);
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("staff")).toBe(true);
    expect(isUserRole("customer")).toBe(true);
    expect(isUserRole("root")).toBe(false);
  });

  it("gives owner every permission", () => {
    expect(hasPermission("owner", "users.write")).toBe(true);
    expect(hasPermission("owner", "settings.write")).toBe(true);
  });

  it("keeps staff away from billing and user management", () => {
    expect(hasPermission("staff", "projects.write")).toBe(true);
    expect(hasPermission("staff", "billing.write")).toBe(false);
    expect(hasPermission("staff", "users.write")).toBe(false);
  });

  it("limits customer to portal actions", () => {
    expect(permissionsForRole("customer")).toEqual(["portal.read", "portal.submit"]);
  });

  it("throws a stable forbidden error", () => {
    expect(() => requirePermission("staff", "billing.write")).toThrow("FORBIDDEN:billing.write");
  });
});
