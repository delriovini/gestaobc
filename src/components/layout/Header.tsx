"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type RoleBadge } from "@/components/ui/Badge";

export interface HeaderProps {
  title: string;
  fullName: string;
  role: RoleBadge | string;
  avatarPath?: string | null;
}

export function Header({ title, fullName, role, avatarPath }: HeaderProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadAvatar() {
      if (!avatarPath) {
        setAvatarUrl(null);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 3600);

      if (error || !data?.signedUrl) {
        setAvatarUrl(null);
        return;
      }

      setAvatarUrl(data.signedUrl);
    }

    loadAvatar();
  }, [avatarPath]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleBadge = (role === "CEO" || role === "GESTOR" || role === "STAFF"
    ? role
    : "STAFF") as RoleBadge;

  const initial =
    fullName && fullName.trim().length > 0
      ? fullName.trim().charAt(0).toUpperCase()
      : "";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 backdrop-blur-sm sm:px-6">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
              {initial}
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-sm text-slate-300">{fullName}</span>
            <span className="badge">{roleBadge}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75m0 10.5v3.75m0-10.5h10.5m-10.5 0h-10.5"
            />
          </svg>
          Sair
        </button>
      </div>
    </header>
  );
}
