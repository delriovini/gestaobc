import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeRole, ROLES, hasPermission } from "@/lib/rbac";
import { ApproveRejectButtons } from "./ApproveRejectButtons";
import { toggleUserStatusForm } from "./actions";

export default async function UsuariosPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = normalizeRole(profile?.role ?? null);
  const isCEOOrGestor =
    userRole === ROLES.CEO || userRole === ROLES.GESTOR;

  let users: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    status: string | null;
    staff_level: string | null;
  }> = [];

  if (isCEOOrGestor) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    users = (data ?? []) as typeof users;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    users = data ? [data as (typeof users)[0]] : [];
  }

  const canViewPage = hasPermission(userRole, ROLES.GESTOR);

  if (!canViewPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-5 text-sm text-amber-100">
          <p className="font-semibold mb-1">
            Permissão insuficiente
          </p>
          <p>
            Apenas usuários com cargo <strong>GESTOR</strong> ou <strong>CEO</strong> podem acessar a
            área de gerenciamento de usuários.
          </p>
        </div>
      </div>
    );
  }

  function formatStaffLevel(s: string | null | undefined): string | null {
    if (s == null || !s.trim()) return null;
    const t = s.trim();
    return t[0] + t.slice(1).toLowerCase();
  }

  const rows = users.map((u) => {
    const role = u.role ?? "STAFF";
    const staffLevel = u.staff_level ?? null;
    const displayRole =
      role === "STAFF" && staffLevel
        ? `STAFF - ${formatStaffLevel(staffLevel) ?? staffLevel}`
        : role;
    return {
      id: u.id,
      name:
        (u.full_name ?? null) ??
        (u.email ? String(u.email).split("@")[0] : "Sem nome"),
      role: displayRole,
      email: u.email ?? "",
      status: u.status ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Usuários</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cargo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-900/40">
            {rows.map((userRow) => {
              const statusLabel =
                userRow.status === "PENDENTE"
                  ? "Pendente"
                  : userRow.status === "APROVADO"
                  ? "Aprovado"
                  : userRow.status === "REJEITADO"
                  ? "Rejeitado"
                  : userRow.status === "ACTIVE"
                  ? "Ativo"
                  : userRow.status === "INACTIVE"
                  ? "Inativo"
                  : userRow.status ?? "—";
              const isPending = userRow.status === "PENDENTE";

              return (
                <tr key={userRow.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-slate-200">{userRow.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{userRow.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{userRow.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{statusLabel}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {isPending ? (
                        <ApproveRejectButtons userId={userRow.id} />
                      ) : (
                        <>
                          <form action={toggleUserStatusForm} className="inline">
                            <input type="hidden" name="userId" value={userRow.id} />
                            <input type="hidden" name="currentStatus" value={userRow.status ?? ""} />
                            <button
                              type="submit"
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white transition hover:bg-red-500"
                            >
                              {userRow.status === "ACTIVE" ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                          {userRow.id ? (
                            <Link
                              href={`/dashboard/usuarios/${userRow.id}`}
                              className="inline-flex items-center rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-600"
                            >
                              Editar
                            </Link>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-400"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
