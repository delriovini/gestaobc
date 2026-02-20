import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumoCards } from "@/components/relatorios/ResumoCards";
import { TabelaRanking } from "@/components/relatorios/TabelaRanking";
import { anosDisponiveis } from "@/lib/types/relatorios";
import type { RankingRow, ResumoRelatorio } from "@/lib/types/relatorios";
import { RelatoriosAnoMesForm } from "./RelatoriosAnoMesForm";

type PageProps = { searchParams: Promise<{ ano?: string; mes?: string }> };

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const anoParam = params.ano != null ? parseInt(params.ano, 10) : null;
  const mesParam = params.mes != null ? parseInt(params.mes, 10) : null;
  const now = new Date();
  const ano = Number.isNaN(anoParam) || anoParam == null ? now.getFullYear() : anoParam;
  const mes = Number.isNaN(mesParam) || mesParam == null ? now.getMonth() + 1 : Math.max(1, Math.min(12, mesParam));

  let ranking: RankingRow[] = [];
  let resumo: ResumoRelatorio = {
    totalTicketsGeral: 0,
    totalTicketsSecurity: 0,
    totalTicketsOtimizacao: 0,
    totalAllowlists: 0,
    totalHoras: 0,
    totalDenuncias: 0,
  };

  const { data: rows } = await supabase
    .from("relatorios_staff")
    .select(`
      id,
      ano,
      mes,
      staff_id,
      tickets_geral,
      tickets_security,
      tickets_otimizacao,
      allowlists,
      horas_conectadas,
      denuncias,
      profiles!inner(full_name)
    `)
    .eq("ano", ano)
    .eq("mes", mes)
    .order("horas_conectadas", { ascending: false })
    .order("tickets_geral", { ascending: false });

  const withNome: RankingRow[] = (rows ?? []).map((r: Record<string, unknown>) => {
    const p = r.profiles as { full_name: string | null } | null;
    const { profiles: _, ...rest } = r;
    return { ...rest, nome: p?.full_name ?? null } as RankingRow;
  });

  ranking = withNome;
  resumo = withNome.reduce(
    (acc, row) => ({
      totalTicketsGeral: acc.totalTicketsGeral + Number(row.tickets_geral ?? 0),
      totalTicketsSecurity: acc.totalTicketsSecurity + Number(row.tickets_security ?? 0),
      totalTicketsOtimizacao: acc.totalTicketsOtimizacao + Number(row.tickets_otimizacao ?? 0),
      totalAllowlists: acc.totalAllowlists + Number(row.allowlists ?? 0),
      totalHoras: acc.totalHoras + Number(row.horas_conectadas ?? 0),
      totalDenuncias: acc.totalDenuncias + Number(row.denuncias ?? 0),
    }),
    resumo
  );

  const anos = anosDisponiveis();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Relatórios</h1>
          <p className="mt-1 text-slate-400">Relatório Mensal da Staff</p>
        </div>
        <RelatoriosAnoMesForm anos={anos} anoAtual={ano} mesAtual={mes} />
      </div>

      <ResumoCards resumo={resumo} />
      <TabelaRanking rows={ranking} />
    </div>
  );
}
