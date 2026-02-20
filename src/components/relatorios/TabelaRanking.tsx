import type { RankingRow } from "@/lib/types/relatorios";

const COLS = "80px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr";

export function TabelaRanking({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 py-16 text-center">
        <p className="text-slate-400">Nenhum dado no mês selecionado.</p>
        <p className="mt-1 text-sm text-slate-500">Selecione outro mês ou aguarde lançamentos.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/95">
      <div
        className="grid gap-0 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
        style={{ gridTemplateColumns: COLS }}
      >
        <div className="border-b border-slate-700 bg-slate-800 p-3">Posição</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Nome</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Geral</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Security</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Otimização</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Allowlists</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Horas</div>
        <div className="border-b border-slate-700 bg-slate-800 p-3">Denúncias</div>
      </div>
      <div className="divide-y divide-slate-700">
        {rows.map((row, index) => {
          const pos = index + 1;
          const isTop3 = pos <= 3;
          const rowClass = isTop3
            ? pos === 1
              ? "bg-amber-500/10 border-l-4 border-amber-500"
              : pos === 2
                ? "bg-slate-400/10 border-l-4 border-slate-400"
                : "bg-amber-700/10 border-l-4 border-amber-700"
            : "hover:bg-slate-800/50";
          return (
            <div
              key={row.staff_id ?? row.id ?? index}
              className={`grid items-center gap-0 text-center ${rowClass}`}
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="p-3 text-sm font-semibold text-slate-200">
                {pos}º
              </div>
              <div className="p-3 text-sm font-medium text-white">
                {row.nome ?? "—"}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.tickets_geral).toLocaleString("pt-BR")}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.tickets_security).toLocaleString("pt-BR")}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.tickets_otimizacao).toLocaleString("pt-BR")}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.allowlists).toLocaleString("pt-BR")}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.horas_conectadas).toFixed(1)}
              </div>
              <div className="p-3 text-sm text-slate-300">
                {Number(row.denuncias).toLocaleString("pt-BR")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
