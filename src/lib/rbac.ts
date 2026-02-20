/**
 * RBAC - Role-Based Access Control
 * Hierarquia: CEO > GESTOR > STAFF
 */

export const ROLES = {
  CEO: "CEO",
  GESTOR: "GESTOR",
  STAFF: "STAFF",
} as const;

export type Role = "CEO" | "GESTOR" | "STAFF";

const ROLE_LEVEL: Record<string, number> = {
  [ROLES.CEO]: 3,
  [ROLES.GESTOR]: 2,
  [ROLES.STAFF]: 1,
};

export function hasPermission(userRole: string | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_LEVEL[userRole.toUpperCase()] ?? -1;
  const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export const VALID_ROLES: readonly string[] = Object.values(ROLES);

export function normalizeRole(role: string | null | undefined): Role | null {
  if (!role) return null;
  const normalized = role.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return VALID_ROLES.includes(normalized) ? (normalized as Role) : null;
}
