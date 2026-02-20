import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";

export default async function AdminPage() {
  await requireRole(ROLES.GESTOR);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user!.id).single();
  const nome = profile?.nome ?? user?.email?.split("@")[0] ?? "Gestor";

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Área Administrativa</h1>
        <p className="mt-1 text-slate-400">Bem-vindo, {nome}. Você tem acesso de gestor.</p>
        <p className="mt-4 text-sm text-slate-500">Esta área é restrita a GESTOR e CEO.</p>
      </div>
    </div>
  );
}
