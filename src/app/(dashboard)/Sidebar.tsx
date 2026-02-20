"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoutButton } from "./dashboard/LogoutButton";

interface SidebarProps {
  canAccessAdmin: boolean;
  canAccessConfig: boolean;
}

export function Sidebar({ canAccessAdmin, canAccessConfig }: SidebarProps) {
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
      className="fixed left-0 top-0 z-40 flex h-screen w-[260px] shrink-0 -translate-x-full flex-col border-r border-white/10 bg-slate-900/95 shadow-xl backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 lg:border-slate-800/50"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold text-white"
        >
          <img
            src="https://i.imgur.com/7mWUZKi.png"
            alt="Gestão BC"
            className="h-8 w-8 rounded-lg object-contain"
          />
          Gestão BC
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          Dashboard
        </Link>
        {canAccessAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Admin
          </Link>
        )}
        {canAccessConfig && (
          <Link
            href="/dashboard/config"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Config
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
