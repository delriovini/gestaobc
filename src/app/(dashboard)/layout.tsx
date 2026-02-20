import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, nome, role, avatar_url")
    .eq("id", user.id)
    .single();

  const rawRole = profile?.role ?? null;
  const userRole = normalizeRole(rawRole) ?? ROLES.STAFF;

  const isRole = (s: string | null | undefined) =>
    !!s && ["CEO", "GESTOR", "STAFF"].includes(s.trim().toUpperCase());

  const fullName =
    (profile?.full_name?.trim() && !isRole(profile.full_name) ? profile.full_name.trim() : null) ||
    (profile?.nome?.trim() && !isRole(profile.nome) ? profile.nome.trim() : null) ||
    (user.user_metadata?.nome && !isRole(String(user.user_metadata.nome)) ? user.user_metadata.nome : null) ||
    user.email?.split("@")[0] ||
    "Usuário";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar fixa - 260px */}
      <Sidebar fullName={fullName} userRole={userRole} avatarUrl={profile?.avatar_url ?? null} />

      {/* Área principal: header + conteúdo */}
      <div className="flex flex-1 flex-col lg:pl-[260px]">
        {/* Header superior - 64px */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Abrir menu"
              className="flex rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              data-sidebar-toggle
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-400">
              Gestão BC
            </span>
          </div>
        </header>

        {/* Área principal scrollável */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Overlay para fechar sidebar no mobile */}
      <div
        aria-hidden
        className="fixed inset-0 z-20 bg-slate-950/60 opacity-0 backdrop-blur-sm transition-opacity lg:hidden lg:opacity-0"
        data-sidebar-overlay
      />
    </div>
  );
}
