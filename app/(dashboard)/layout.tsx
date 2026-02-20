import { redirect } from "next/navigation";
import {
  createServerSupabaseAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabaseServer";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { Sidebar } from "@/components/layout/Sidebar";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

// Sempre buscar perfil/status no servidor (evita cache com status antigo)
export const dynamic = "force-dynamic";

function roleBadgeClasses(role: string) {
  const r = role.toUpperCase();
  return r === "CEO"
    ? "bg-red-500/20 text-red-400"
    : r === "GESTOR"
    ? "bg-yellow-500/20 text-yellow-400"
    : "bg-blue-500/20 text-blue-400";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTotp = factorsData?.totp?.some((f) => f.status === "verified");
  if (!hasVerifiedTotp) {
    redirect("/perfil?setup=2fa");
  }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.currentLevel !== "aal2") {
    redirect("/verify-mfa");
  }

  // Buscar perfil: preferir admin client (ignora RLS) para ler o status real do banco
  const admin = createServerSupabaseAdminClient();
  const profileSource = admin ?? supabase;
  const { data: profile } = await profileSource
    .from("profiles")
    .select("id, full_name, role, avatar_url, status, created_at, birth_date")
    .eq("id", user.id)
    .single();

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  let isBirthdayToday = false;
  if (profile?.birth_date) {
    const parts = String(profile.birth_date).trim().split("-").map(Number);
    const bdMonth = parts[1];
    const bdDay = parts[2];
    if (bdMonth === todayMonth && bdDay === todayDay) isBirthdayToday = true;
  }

  const statusNorm =
    profile?.status != null ? String(profile.status).trim().toUpperCase() : "";
  const isApproved = profile != null && statusNorm === "ACTIVE";

  if (!isApproved) {
    return (
      <PendingApprovalScreen
        status={profile?.status ?? null}
        createdAt={profile?.created_at ?? null}
      />
    );
  }

  const fullName = profile?.full_name?.trim() ?? "";
  const userRole = normalizeRole(profile?.role ?? null) ?? ROLES.STAFF;
  const normalizedRole = userRole.toUpperCase();

  let count = 0;
  if (normalizedRole === "CEO" || normalizedRole === "GESTOR") {
    const { count: pendingCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDENTE");
    count = typeof pendingCount === "number" ? pendingCount : 0;
  }

  let avatarUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        fullName={fullName}
        userRole={userRole}
        avatarUrl={avatarUrl}
        pendingUsersCount={count}
      />

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <header className="relative sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 backdrop-blur-sm sm:px-6">
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
            <span className="text-sm font-medium text-slate-400">Gestão BC</span>
          </div>
          {isBirthdayToday && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-amber-400/30">
              Parabéns! Hoje é seu aniversário 🎂
            </div>
          )}
          <a
            href="/perfil"
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || "Usuário"}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-medium text-blue-400">
                {initials}
              </span>
            )}
            <div className="hidden flex-col sm:flex sm:items-start">
              <span className="text-sm font-medium text-white">
                {fullName || "Usuário"}
              </span>
              <span
                className={`mt-0.5 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClasses(normalizedRole)}`}
              >
                {normalizedRole}
              </span>
            </div>
          </a>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>

      <div
        aria-hidden
        className="fixed inset-0 z-20 bg-slate-950/60 opacity-0 backdrop-blur-sm transition-opacity lg:hidden lg:opacity-0"
        data-sidebar-overlay
      />
    </div>
  );
}
