export const USER_ROLES = ["owner", "admin", "staff", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "leads.read",
  "leads.write",
  "offers.read",
  "offers.write",
  "projects.read",
  "projects.write",
  "billing.read",
  "billing.write",
  "submissions.read",
  "submissions.write",
  "users.read",
  "users.write",
  "settings.write",
  "portal.read",
  "portal.submit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: [
    "leads.read",
    "leads.write",
    "offers.read",
    "offers.write",
    "projects.read",
    "projects.write",
    "billing.read",
    "billing.write",
    "submissions.read",
    "submissions.write",
    "users.read",
    "portal.read",
    "portal.submit",
  ],
  staff: [
    "leads.read",
    "leads.write",
    "offers.read",
    "projects.read",
    "projects.write",
    "submissions.read",
    "submissions.write",
  ],
  customer: ["portal.read", "portal.submit"],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`FORBIDDEN:${permission}`);
  }
}

export type AuthenticatedActor = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
};
