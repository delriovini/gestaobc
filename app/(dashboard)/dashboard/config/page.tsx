import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";

type ConfigPageProps = {
  searchParams: Promise<{ tab?: string; ano?: string; mes?: string }>;
};

export default async function ConfigPage({ searchParams }: ConfigPageProps) {
  await requireRole(ROLES.GESTOR);

  const params = await searchParams;
  const activeTab = params.tab ?? "geral";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
  const apelido = (profile?.full_name && String(profile.full_name).trim()) || user?.email?.split("@")[0] || "Usuário";

  let tabContent: React.ReactNode = null;
  if (activeTab === "treinamentos") {
    const { TreinamentosAdminContent } = await import("./treinamentos/TreinamentosTabContent");
    tabContent = <TreinamentosAdminContent />;
  } else if (activeTab === "gamificacao") {
    const { GamificacaoAdminContent } = await import("./gamificacao/GamificacaoAdminContent");
    tabContent = <GamificacaoAdminContent />;
  } else if (activeTab === "relatorios") {
    const { RelatoriosAdminContent } = await import("./relatorios/RelatoriosAdminContent");
    tabContent = (
      <RelatoriosAdminContent
        ano={params.ano != null ? parseInt(params.ano, 10) : null}
        mes={params.mes != null ? parseInt(params.mes, 10) : null}
      />
    );
  } else if (activeTab === "geral") {
    tabContent = (
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <p className="text-slate-400">Configurações gerais do sistema.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Configurações do Sistema</h1>
        <p className="mt-1 text-slate-400">Bem-vindo, {apelido}.</p>
        <p className="mt-4 text-sm text-slate-500">
          Esta área é restrita a CEO e Gestores.
        </p>

        <nav className="mt-6 flex gap-2 border-b border-white/10">
          <Link
            href="/dashboard/config?tab=geral"
            className={`rounded-t-lg border border-b-0 border-white/10 px-4 py-2 text-sm font-medium transition ${
              activeTab === "geral"
                ? "bg-slate-800/80 text-white"
                : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            Geral
          </Link>
          <Link
            href="/dashboard/config?tab=treinamentos"
            className={`rounded-t-lg border border-b-0 border-white/10 px-4 py-2 text-sm font-medium transition ${
              activeTab === "treinamentos"
                ? "bg-slate-800/80 text-white"
                : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            Treinamentos
          </Link>
          <Link
            href="/dashboard/config?tab=gamificacao"
            className={`rounded-t-lg border border-b-0 border-white/10 px-4 py-2 text-sm font-medium transition ${
              activeTab === "gamificacao"
                ? "bg-slate-800/80 text-white"
                : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            Gamificação
          </Link>
          <Link
            href="/dashboard/config?tab=relatorios"
            className={`rounded-t-lg border border-b-0 border-white/10 px-4 py-2 text-sm font-medium transition ${
              activeTab === "relatorios"
                ? "bg-slate-800/80 text-white"
                : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            Relatórios
          </Link>
        </nav>
      </div>

      <div className="mt-6">{tabContent}</div>
    </div>
  );
}
