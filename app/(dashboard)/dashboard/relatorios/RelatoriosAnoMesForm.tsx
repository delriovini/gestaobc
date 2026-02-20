import { MESES } from "@/lib/types/relatorios";

export function RelatoriosAnoMesForm({
  anos,
  anoAtual,
  mesAtual,
}: {
  anos: number[];
  anoAtual: number;
  mesAtual: number;
}) {
  return (
    <form method="get" action="/dashboard/relatorios" className="flex items-end gap-2">
      <div>
        <label htmlFor="ano" className="mb-1 block text-xs font-medium text-slate-400">
          Ano
        </label>
        <select
          id="ano"
          name="ano"
          defaultValue={anoAtual}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50"
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mes" className="mb-1 block text-xs font-medium text-slate-400">
          Mês
        </label>
        <select
          id="mes"
          name="mes"
          defaultValue={mesAtual}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50"
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
      >
        Ver
      </button>
    </form>
  );
}
