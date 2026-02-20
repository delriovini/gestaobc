import { ROLES, type Role } from "../rbac";

export type RouteConfig = {
  path: string;
  requiredRole: Role;
};

export const PROTECTED_ROUTES: RouteConfig[] = [
  { path: "/dashboard", requiredRole: ROLES.STAFF },
  { path: "/dashboard/admin", requiredRole: ROLES.GESTOR },
  { path: "/dashboard/config", requiredRole: ROLES.CEO },
];

export function getRequiredRoleForPath(pathname: string): Role | null {
  const sorted = [...PROTECTED_ROUTES].sort((a, b) => b.path.length - a.path.length);
  for (const route of sorted) {
    if (pathname === route.path || pathname.startsWith(`${route.path}/`)) {
      return route.requiredRole;
    }
  }
  return null;
}
