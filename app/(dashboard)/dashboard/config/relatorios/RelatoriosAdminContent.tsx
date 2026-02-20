import { createClient } from "@/lib/supabase/server";
import { TabelaEditavelRelatorios, type RowEdit } from "./TabelaEditavelRelatorios";
import { AnoMesSelect } from "./AnoMesSelect";
import { anosDisponiveis, MESES } from "@/lib/types/relatorios";

type Props = { ano: number | null; mes: number | null };

export async function RelatoriosAdminContent({ ano, mes }: Props) {
  const supabase = await createClient();
  const anos = anosDisponiveis();
  const now = new Date();
  const anoNum = ano ?? now.getFullYear();
  const mesNum = mes ?? now.getMonth() + 1;
  const hasSelection = true;

  let fechado = false;
  let rows: RowEdit[] = [];

  if (hasSelection) {
    const { data: relatorios } = await supabase
      .from("relatorios_staff")
      .select("staff_id, tickets_geral, tickets_security, tickets_otimizacao, allowlists, horas_conectadas, denuncias, fechado")
      .eq("ano", anoNum)
      .eq("mes", mesNum);

    const firstFechado = (relatorios ?? []).find((r: { fechado?: boolean }) => r.fechado);
    fechado = Boolean(firstFechado?.fechado);

    const { data: staffList } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "STAFF")
      .order("full_name");

    const byStaff = new Map(
      (relatorios ?? []).map((r: Record<string, unknown>) => [
        r.staff_id as string,
        r as {
          staff_id: string;
          tickets_geral: number;
          tickets_security: number;
          tickets_otimizacao: number;
          allowlists: number;
          horas_conectadas: number;
          denuncias: number;
        },
      ])
    );

    rows = (staffList ?? []).map((s: { id: string; full_name: string | null }) => {
      const existing = byStaff.get(s.id);
      return {
        staff_id: s.id,
        nome: s.full_name ?? null,
        tickets_geral: existing?.tickets_geral ?? 0,
        tickets_security: existing?.tickets_security ?? 0,
        tickets_otimizacao: existing?.tickets_otimizacao ?? 0,
        allowlists: existing?.allowlists ?? 0,
        horas_conectadas: existing?.horas_conectadas ?? 0,
        denuncias: existing?.denuncias ?? 0,
      };
    });
  }

  const mesLabel = MESES.find((m) => m.value === mesNum)?.label ?? String(mesNum);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white">Relatórios — Por mês</h2>
        <p className="mt-1 text-slate-400">Selecione ano e mês para lançar ou editar métricas da staff.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Ano e mês</h3>
        <div className="mt-4">
          <AnoMesSelect anos={anos} anoAtual={anoNum} mesAtual={mesNum} />
        </div>
      </div>

      {hasSelection && (
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            {mesLabel} {anoNum}
            {fechado && (
              <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-sm font-normal text-amber-400">
                Fechado
              </span>
            )}
          </h3>
          {rows.length === 0 ? (
            <p className="mt-4 text-slate-400">Nenhum usuário com role STAFF encontrado.</p>
          ) : (
            <div className="mt-4">
              <TabelaEditavelRelatorios ano={anoNum} mes={mesNum} fechado={fechado} rows={rows} />
            </div>
          )}
        </div>
      )}

      {!hasSelection && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 py-8 text-center">
          <p className="text-slate-400">Selecione ano e mês acima para editar.</p>
        </div>
      )}
    </div>
  );
}
