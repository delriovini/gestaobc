import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  createServerSupabaseAdminClient,
} from "@/lib/supabaseServer";
import { normalizeRole, ROLES, hasPermission } from "@/lib/rbac";
import { ensureActiveUser } from "@/lib/ensure-active-user";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateUserRole(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureActiveUser(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentRole = normalizeRole(profile?.role ?? null);

  if (currentRole !== ROLES.CEO) {
    redirect("/dashboard");
  }

  const userId = formData.get("id") as string | null;
  const newRoleRaw = formData.get("role") as string | null;
  const newStaffLevelRaw = formData.get("staff_level") as string | null;

  if (!userId || !newRoleRaw) {
    redirect("/dashboard/usuarios");
  }

  const newRole = normalizeRole(newRoleRaw);

  if (!newRole) {
    redirect("/dashboard/usuarios");
  }

  let newStaffLevel: Database["public"]["Enums"]["staff_level"] | null = null;
  if (newRole === ROLES.STAFF && newStaffLevelRaw) {
    const trimmed = newStaffLevelRaw.trim().toUpperCase();
    const validValues: Database["public"]["Enums"]["staff_level"][] = [
      "TRAINEE",
      "SUPORTE",
      "MODERADOR",
      "ADMINISTRADOR",
    ];
    if (validValues.includes(trimmed as Database["public"]["Enums"]["staff_level"])) {
      newStaffLevel = trimmed as Database["public"]["Enums"]["staff_level"];
    }
  }

  const admin = createServerSupabaseAdminClient();
  const client = admin ?? supabase;

  const { error } = await client
    .from("profiles")
    .update({ role: newRole, staff_level: newRole === ROLES.STAFF ? newStaffLevel : null })
    .eq("id", userId);

  if (error) {
    redirect(`/dashboard/usuarios?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/usuarios");
}

export default async function EditUsuarioPage({ params }: PageProps) {
  const resolved = await params;
  const id = typeof resolved?.id === "string" ? resolved.id.trim() : "";
  const supabase = await createServerSupabaseClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) redirect("/login");

  if (!id) {
    redirect("/dashboard/usuarios");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  const currentRole = normalizeRole(profile.role);

  if (!hasPermission(currentRole, ROLES.GESTOR)) {
    redirect("/dashboard");
  }

  const admin = createServerSupabaseAdminClient();
  const clientForProfile = admin ?? supabase;
  const { data: targetUser, error } = await clientForProfile
    .from("profiles")
    .select("id, nome_completo, full_name, email, role, staff_level")
    .eq("id", id)
    .maybeSingle();

  if (error || !targetUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Editar usuário</h1>
          <p className="mt-1 text-sm text-amber-400">
            Usuário não encontrado ou sem permissão para visualizar.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-slate-400">
            ID: <code className="rounded bg-slate-800 px-1 text-slate-300">{id}</code>
          </p>
          {error != null && (
            <p className="mt-2 text-sm text-red-400">{error.message}</p>
          )}
          <Link
            href="/dashboard/usuarios"
            className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
          >
            Voltar para Usuários
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    (targetUser.nome_completo && String(targetUser.nome_completo).trim()) ||
    (targetUser.full_name && String(targetUser.full_name).trim()) ||
    "Sem nome";
  const nomeCompletoVal = targetUser.nome_completo != null ? String(targetUser.nome_completo) : "";
  const apelidoVal = targetUser.full_name != null ? String(targetUser.full_name) : "";

  const targetRole = targetUser.role ?? "STAFF";
  const targetStaffLevel = targetUser.staff_level ?? null;
  const canEditRole = currentRole === ROLES.CEO;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Editar usuário</h1>
        <p className="mt-1 text-sm text-slate-400">{displayName}</p>
      </div>

      <div className="max-w-lg rounded-xl border border-white/10 bg-slate-900/60 p-6">
        <form action={updateUserRole} className="space-y-4">
          <input type="hidden" name="id" value={targetUser.id} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Nome completo
            </label>
            <input
              type="text"
              value={nomeCompletoVal}
              readOnly
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Apelido
            </label>
            <input
              type="text"
              value={apelidoVal}
              readOnly
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={targetUser.email ?? ""}
              disabled
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed"
            />
          </div>

          {canEditRole && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Cargo
                </label>
                <select
                  name="role"
                  defaultValue={String(targetRole).toUpperCase()}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none"
                >
                  <option value={ROLES.CEO}>CEO</option>
                  <option value={ROLES.GESTOR}>GESTOR</option>
                  <option value={ROLES.STAFF}>STAFF</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Nível de staff
                </label>
                <select
                  name="staff_level"
                  defaultValue={
                    targetRole === ROLES.STAFF && targetStaffLevel ? targetStaffLevel : ""
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none"
                >
                  <option value="">Selecione (apenas para STAFF)</option>
                  <option value="TRAINEE">TRAINEE</option>
                  <option value="SUPORTE">SUPORTE</option>
                  <option value="MODERADOR">MODERADOR</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Este campo só é considerado quando o cargo é STAFF. Para CEO ou GESTOR, o nível é ignorado.
                </p>
              </div>

              <div className="mt-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <p className="font-semibold flex items-center gap-1">
                  <span>⚠</span>
                  <span>Alterar o cargo impacta permissões do sistema.</span>
                </p>
                <p className="mt-1 text-[11px] text-amber-100/80">
                  Apenas usuários com cargo CEO podem alterar o cargo de outros usuários.
                </p>
              </div>
            </div>
          )}

          {!canEditRole && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Cargo
              </label>
              <input
                type="text"
                value={targetRole}
                disabled
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">
                Apenas usuários com cargo CEO podem alterar o cargo.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <a
              href="/dashboard/usuarios"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Cancelar
            </a>
            {canEditRole && (
              <button
                type="submit"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
              >
                Salvar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

