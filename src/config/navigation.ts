import { hasPermission } from "@/lib/rbac";
import { ROLES, type Role } from "@/lib/rbac";

export interface NavRoute {
  name: string;
  path: string;
  minimumRole: Role;
}

export const navRoutes: NavRoute[] = [
  { name: "Dashboard", path: "/dashboard", minimumRole: ROLES.STAFF },
  { name: "Kanban", path: "/dashboard/kanban", minimumRole: ROLES.STAFF },
  { name: "Calendário", path: "/dashboard/calendario", minimumRole: ROLES.STAFF },
  { name: "Treinamentos", path: "/dashboard/treinamentos", minimumRole: ROLES.STAFF },
  { name: "Gamificação", path: "/dashboard/gamificacao", minimumRole: ROLES.STAFF },
  { name: "Relatórios", path: "/dashboard/relatorios", minimumRole: ROLES.STAFF },
  { name: "Financeiro", path: "/dashboard/financeiro", minimumRole: ROLES.CEO },
  { name: "Usuários", path: "/dashboard/usuarios", minimumRole: ROLES.GESTOR },
  { name: "Configurações", path: "/dashboard/config", minimumRole: ROLES.CEO },
];

/**
 * Retorna as rotas visíveis para o usuário com base no role.
 * Financeiro: apenas CEO.
 */
export function getVisibleRoutes(userRole: string | null | undefined): NavRoute[] {
  const role = userRole?.toUpperCase();
  return navRoutes.filter((route) => {
    if (route.path === "/dashboard/financeiro") {
      return role === ROLES.CEO;
    }
    return hasPermission(userRole, route.minimumRole);
  });
}
