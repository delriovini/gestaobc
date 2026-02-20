"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { getVisibleRoutes } from "@/config/navigation";
import { LogoutButton } from "@/app/(dashboard)/dashboard/LogoutButton";

export interface SidebarProps {
  /** @deprecated Exibido apenas no header. */
  fullName?: string | null;
  /** Cargo do usuário (role da tabela profiles) - usado para filtrar rotas visíveis */
  userRole?: string | null;
  /** @deprecated Exibido apenas no header. */
  avatarUrl?: string | null;
  /** Quantidade de usuários com status PENDENTE (CEO/GESTOR) */
  pendingUsersCount?: number;
}

const iconByPath: Record<string, React.ReactNode> = {
  "/dashboard": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  ),
  "/dashboard/kanban": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
    />
  ),
  "/dashboard/calendario": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  ),
  "/dashboard/treinamentos": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
    />
  ),
  "/dashboard/gamificacao": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
    />
  ),
  "/dashboard/usuarios": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17.25a3.75 3.75 0 10-6 0m9 3a4.5 4.5 0 00-9 0m4.5-15a3 3 0 110 6 3 3 0 010-6zm-7.5 3a3 3 0 100 6 3 3 0 000-6z"
    />
  ),
  "/dashboard/relatorios": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  ),
  "/dashboard/financeiro": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  "/dashboard/config": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
  ),
};

export function Sidebar({ fullName: _fullName, userRole, avatarUrl: _avatarUrl, pendingUsersCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const visibleRoutes = useMemo(
    () => getVisibleRoutes(userRole ?? "STAFF"),
    [userRole]
  );

  useEffect(() => {
    const overlay = document.querySelector("[data-sidebar-overlay]");
    const toggle = document.querySelector("[data-sidebar-toggle]");
    const sidebar = document.querySelector("[data-sidebar]");

    function open() {
      sidebar?.classList.add("translate-x-0");
      sidebar?.classList.remove("-translate-x-full");
      overlay?.classList.remove("opacity-0", "pointer-events-none");
      overlay?.classList.add("opacity-100", "pointer-events-auto");
    }

    function close() {
      sidebar?.classList.remove("translate-x-0");
      sidebar?.classList.add("-translate-x-full");
      overlay?.classList.remove("opacity-100", "pointer-events-auto");
      overlay?.classList.add("opacity-0", "pointer-events-none");
    }

    toggle?.addEventListener("click", open);
    overlay?.addEventListener("click", close);
    return () => {
      toggle?.removeEventListener("click", open);
      overlay?.removeEventListener("click", close);
    };
  }, []);

  return (
    <aside
      data-sidebar
      className="fixed left-0 top-0 z-40 flex h-screen w-[260px] shrink-0 -translate-x-full flex-col border-r border-white/5 bg-slate-900 transition-transform duration-300 lg:translate-x-0"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/5 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-lg font-semibold text-white"
        >
          <img
            src="https://i.imgur.com/7mWUZKi.png"
            alt="Gestão BC"
            className="h-8 w-8 rounded-lg object-contain"
          />
          Gestão BC
        </Link>
      </div>

      <div className="flex h-full flex-col">
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleRoutes.map((route) => {
            const isActive =
              route.path === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(route.path);
            const icon = iconByPath[route.path];

            const showPendingBadge =
              route.path === "/dashboard/usuarios" && pendingUsersCount > 0;

            return (
              <Link
                key={route.path}
                href={route.path}
                className={`
                  group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                  text-sm font-medium transition-all duration-200
                  before:absolute before:left-0 before:top-1/2 before:h-6 before:-translate-y-1/2
                  before:rounded-r-full before:bg-blue-500 before:transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 before:w-1"
                      : "text-slate-400 before:w-0 hover:bg-white/5 hover:text-white hover:before:w-1 hover:before:bg-blue-500/80"
                  }
                `}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {icon}
                </svg>
                <span className="flex flex-1 items-center justify-between gap-2">
                  {route.name}
                  {showPendingBadge && (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500/20 px-1.5 py-0.5 text-xs font-semibold text-red-400">
                      {pendingUsersCount > 99 ? "99+" : pendingUsersCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/5 p-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
